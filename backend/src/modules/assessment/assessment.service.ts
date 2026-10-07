import { AppError } from '../../utils/response';
import { supabaseAdmin } from '../../services/supabase';
import { assessmentConfig } from '../../config/assessment.config';
import { applicationsService, localMemoryApplications } from '../applications/applications.service';
import { notificationsService } from '../notifications/notifications.service';

export interface SafeQuestionDto {
  id: string;
  questionText: string;
  category: string;
  difficulty: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

export interface InternalQuestionRecord {
  id: string;
  questionText: string;
  category: string;
  difficulty: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks: number;
}

export interface AttemptRecord {
  id: string;
  applicationId: string;
  userId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  questionIds: string[];
  durationSeconds: number;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  score: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
}

export interface AssessmentResultDto {
  id?: string;
  applicationId: string;
  applicationNumber: string;
  attemptId: string;
  status: 'SUBMITTED' | 'EXPIRED' | 'completed';
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  totalCorrect?: number;
  wrongCount: number;
  totalWrong?: number;
  unansweredCount: number;
  totalUnanswered?: number;
  totalQuestions?: number;
  startedAt?: string;
  submittedAt: string;
  applicationStatus: 'under_review';
  notice: string;
}

// In-memory question bank fallback for standalone/testing
const fallbackQuestionBank: InternalQuestionRecord[] = Array.from({ length: 40 }).map((_, i) => ({
  id: `q-${i + 1}`,
  questionText: `Technical question ${i + 1}: What is the primary characteristic of this AI system?`,
  category: i % 2 === 0 ? 'Machine Learning' : 'AI Fundamentals',
  difficulty: 'medium',
  optionA: `Approach A for concept ${i + 1}`,
  optionB: `Approach B for concept ${i + 1}`,
  optionC: `Approach C for concept ${i + 1}`,
  optionD: `Approach D for concept ${i + 1}`,
  correctOption: (['A', 'B', 'C', 'D'][i % 4] as 'A' | 'B' | 'C' | 'D'),
  marks: 1.0,
}));

// In-memory stores for testing
export const localMemoryAttempts: Map<string, AttemptRecord> = new Map();
export const localMemoryAnswers: Map<string, Map<string, 'A' | 'B' | 'C' | 'D'>> = new Map();

const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export class AssessmentService {
  /**
   * Projects full database question row into a secure client DTO.
   * STRICT GUARANTEE: Never transmits correct_option to the client.
   */
  private toSafeDto(q: InternalQuestionRecord): SafeQuestionDto {
    return {
      id: q.id,
      questionText: q.questionText,
      category: q.category,
      difficulty: q.difficulty,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      options: {
        A: q.optionA,
        B: q.optionB,
        C: q.optionC,
        D: q.optionD,
      },
    };
  }

  /**
   * Loads the question bank from database or local fallback
   */
  private async loadActiveQuestions(): Promise<InternalQuestionRecord[]> {
    if (!supabaseAdmin) {
      return fallbackQuestionBank;
    }

    const { data, error } = await supabaseAdmin
      .from('assessment_questions')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'published');

    if (error || !data || data.length === 0) {
      return fallbackQuestionBank;
    }

    return data.map((row) => ({
      id: String(row.id),
      questionText: String(row.question_text),
      category: String(row.category),
      difficulty: String(row.difficulty),
      optionA: String(row.option_a),
      optionB: String(row.option_b),
      optionC: String(row.option_c),
      optionD: String(row.option_d),
      correctOption: row.correct_option as 'A' | 'B' | 'C' | 'D',
      marks: Number(row.marks) || 1.0,
    }));
  }

  /**
   * Starts a new assessment or resumes an existing attempt.
   * Selects exactly 25 random questions and guarantees persistent order.
   */
  public async startAssessment(userId: string, applicationId: string) {
    // 1. Verify application ownership and status
    const application = await applicationsService.getApplicationByUserId(userId);
    if (!application || application.id !== applicationId) {
      throw new AppError('Application not found or unauthorized', 404, 'APPLICATION_NOT_FOUND');
    }

    if (application.status === 'test_completed' || application.status === 'under_review') {
      throw new AppError(
        'Assessment has already been completed for this application.',
        400,
        'ALREADY_SUBMITTED'
      );
    }

    // 2. Check for existing attempt
    let existingAttempt: AttemptRecord | null = null;
    if (!supabaseAdmin || !isUuid(applicationId)) {
      existingAttempt = localMemoryAttempts.get(applicationId) || null;
    } else {
      const { data } = await supabaseAdmin
        .from('assessment_attempts')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (data) {
        existingAttempt = {
          id: String(data.id),
          applicationId: String(data.application_id),
          userId: String(data.user_id),
          status: data.status,
          questionIds: data.question_ids,
          durationSeconds: data.duration_seconds,
          startedAt: String(data.started_at),
          expiresAt: String(data.expires_at),
          score: Number(data.score) || 0,
          percentage: Number(data.percentage) || 0,
          passed: Boolean(data.passed),
          correctCount: Number(data.correct_count) || 0,
          wrongCount: Number(data.wrong_count) || 0,
          unansweredCount: Number(data.unanswered_count) || 0,
        };
      }
    }

    // 3. Resume if active attempt exists
    if (existingAttempt) {
      if (existingAttempt.status === 'SUBMITTED') {
        throw new AppError('Assessment has already been submitted.', 400, 'ALREADY_SUBMITTED');
      }

      // Check timer expiration
      const now = new Date();
      if (new Date(existingAttempt.expiresAt) <= now) {
        // Auto-finalize expired attempt
        return await this.submitAssessment(userId, existingAttempt.id);
      }

      // Return existing attempt in persistent order
      return await this.getAttempt(userId, existingAttempt.id);
    }

    // 4. Create new attempt: Select exactly 25 random questions
    const allQuestions = await this.loadActiveQuestions();
    if (allQuestions.length < assessmentConfig.questionCount) {
      throw new AppError('Insufficient questions in question bank', 500, 'INTERNAL_SERVER_ERROR');
    }

    // Shuffle and pick exactly 25
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, assessmentConfig.questionCount);
    const selectedIds = selected.map((q) => q.id);

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + assessmentConfig.durationSeconds * 1000);

    const newAttempt: AttemptRecord = {
      id: !supabaseAdmin || !isUuid(applicationId) ? `attempt-${Date.now()}` : '',
      applicationId,
      userId,
      status: 'IN_PROGRESS',
      questionIds: selectedIds,
      durationSeconds: assessmentConfig.durationSeconds,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      score: 0,
      percentage: 0,
      passed: false,
      correctCount: 0,
      wrongCount: 0,
      unansweredCount: 0,
    };

    if (!supabaseAdmin || !isUuid(applicationId)) {
      localMemoryAttempts.set(applicationId, newAttempt);
      localMemoryAnswers.set(newAttempt.id, new Map());
      // update app status
      const app = localMemoryApplications.get(userId);
      if (app) app.status = 'test_in_progress';
    } else {
      const { data: createdAttempt, error: attemptErr } = await supabaseAdmin
        .from('assessment_attempts')
        .insert({
          application_id: applicationId,
          user_id: userId,
          question_ids: selectedIds,
          duration_seconds: assessmentConfig.durationSeconds,
          started_at: startedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'IN_PROGRESS',
        })
        .select()
        .single();

      if (attemptErr) {
        throw new AppError(attemptErr.message, 500, 'DATABASE_ERROR');
      }

      newAttempt.id = String(createdAttempt.id);

      // Update application status to test_in_progress
      await supabaseAdmin
        .from('applications')
        .update({ status: 'test_in_progress' })
        .eq('id', applicationId);
    }

    const safeQuestions = selected.map((q) => this.toSafeDto(q));
    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(newAttempt.expiresAt).getTime() - Date.now()) / 1000)
    );

    return {
      id: newAttempt.id,
      attemptId: newAttempt.id,
      applicationId,
      userId: newAttempt.userId,
      status: 'in_progress',
      questionCount: safeQuestions.length,
      totalQuestions: safeQuestions.length,
      durationSeconds: newAttempt.durationSeconds,
      remainingSeconds,
      startedAt: newAttempt.startedAt,
      expiresAt: newAttempt.expiresAt,
      questions: safeQuestions,
      answers: {},
      savedAnswers: {},
    };
  }

  /**
   * Retrieves an ongoing attempt, restoring persistent order and saved answers
   */
  public async getAttempt(userId: string, attemptId: string) {
    let attempt: AttemptRecord | null = null;
    let savedAnswersMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {};

    if (!supabaseAdmin || !isUuid(attemptId)) {
      for (const att of localMemoryAttempts.values()) {
        if (att.id === attemptId) {
          attempt = att;
          break;
        }
      }
      if (attempt) {
        const answers = localMemoryAnswers.get(attempt.id);
        if (answers) {
          savedAnswersMap = Object.fromEntries(answers.entries());
        }
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from('assessment_attempts')
        .select('*')
        .eq('id', attemptId)
        .maybeSingle();

      if (error || !data) {
        throw new AppError('Assessment attempt not found', 404, 'ATTEMPT_NOT_FOUND');
      }

      attempt = {
        id: String(data.id),
        applicationId: String(data.application_id),
        userId: String(data.user_id),
        status: data.status,
        questionIds: data.question_ids,
        durationSeconds: data.duration_seconds,
        startedAt: String(data.started_at),
        expiresAt: String(data.expires_at),
        score: Number(data.score) || 0,
        percentage: Number(data.percentage) || 0,
        passed: Boolean(data.passed),
        correctCount: Number(data.correct_count) || 0,
        wrongCount: Number(data.wrong_count) || 0,
        unansweredCount: Number(data.unanswered_count) || 0,
      };

      // Load saved answers
      const { data: answersData } = await supabaseAdmin
        .from('assessment_answers')
        .select('question_id, selected_option')
        .eq('attempt_id', attemptId);

      if (answersData) {
        for (const ans of answersData) {
          savedAnswersMap[ans.question_id] = ans.selected_option as 'A' | 'B' | 'C' | 'D';
        }
      }
    }

    if (!attempt || attempt.userId !== userId) {
      throw new AppError('Unauthorized access to assessment attempt', 403, 'FORBIDDEN');
    }

    // Check timer expiration
    const now = new Date();
    if (attempt.status === 'IN_PROGRESS' && new Date(attempt.expiresAt) <= now) {
      return await this.submitAssessment(userId, attempt.id);
    }

    // Load full question bank to reconstruct safe DTOs in persistent order
    const allQuestions = await this.loadActiveQuestions();
    const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

    const safeQuestions: SafeQuestionDto[] = attempt.questionIds
      .map((qId) => questionMap.get(qId))
      .filter((q): q is InternalQuestionRecord => Boolean(q))
      .map((q) => this.toSafeDto(q));

    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)
    );

    return {
      id: attempt.id,
      attemptId: attempt.id,
      applicationId: attempt.applicationId,
      userId: attempt.userId,
      status: attempt.status === 'SUBMITTED' ? 'completed' : attempt.status === 'EXPIRED' ? 'expired' : 'in_progress',
      questionCount: safeQuestions.length,
      totalQuestions: safeQuestions.length,
      durationSeconds: attempt.durationSeconds,
      remainingSeconds,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      questions: safeQuestions,
      answers: savedAnswersMap,
      savedAnswers: savedAnswersMap,
    };
  }

  /**
   * Autosaves a student's answer for an assigned question in an active attempt
   */
  public async saveAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    selectedOption: string
  ) {
    if (!['A', 'B', 'C', 'D'].includes(selectedOption)) {
      throw new AppError('Invalid answer option', 400, 'INVALID_ANSWER');
    }

    let attempt: AttemptRecord | null = null;
    if (!supabaseAdmin || !isUuid(attemptId)) {
      for (const att of localMemoryAttempts.values()) {
        if (att.id === attemptId) {
          attempt = att;
          break;
        }
      }
    } else {
      const { data } = await supabaseAdmin
        .from('assessment_attempts')
        .select('*')
        .eq('id', attemptId)
        .maybeSingle();

      if (data) {
        attempt = {
          id: String(data.id),
          applicationId: String(data.application_id),
          userId: String(data.user_id),
          status: data.status,
          questionIds: data.question_ids,
          durationSeconds: data.duration_seconds,
          startedAt: String(data.started_at),
          expiresAt: String(data.expires_at),
          score: 0,
          percentage: 0,
          passed: false,
          correctCount: 0,
          wrongCount: 0,
          unansweredCount: 0,
        };
      }
    }

    if (!attempt || attempt.userId !== userId) {
      throw new AppError('Unauthorized access to attempt', 403, 'FORBIDDEN');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new AppError('Attempt is no longer active', 400, 'ATTEMPT_NOT_ACTIVE');
    }

    // Check expiration
    if (new Date(attempt.expiresAt) <= new Date()) {
      throw new AppError('Assessment duration has expired.', 400, 'ATTEMPT_EXPIRED');
    }

    // Verify question belongs to attempt
    if (!attempt.questionIds.includes(questionId)) {
      throw new AppError('Question is not part of this assessment attempt', 400, 'INVALID_QUESTION');
    }

    // Save
    if (!supabaseAdmin || !isUuid(attemptId)) {
      let answers = localMemoryAnswers.get(attemptId);
      if (!answers) {
        answers = new Map();
        localMemoryAnswers.set(attemptId, answers);
      }
      answers.set(questionId, selectedOption as 'A' | 'B' | 'C' | 'D');
    } else {
      const { error } = await supabaseAdmin
        .from('assessment_answers')
        .upsert(
          {
            attempt_id: attemptId,
            question_id: questionId,
            selected_option: selectedOption,
            answered_at: new Date().toISOString(),
          },
          { onConflict: 'attempt_id,question_id' }
        );

      if (error) {
        throw new AppError(error.message, 500, 'DATABASE_ERROR');
      }
    }

    return {
      success: true,
      questionId,
      selectedOption,
      savedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates answers server-side, scores attempt, transitions application to UNDER_REVIEW.
   * STRICT IDEMPOTENCY: Safely returns existing result if already submitted.
   */
  public async submitAssessment(userId: string, attemptId: string): Promise<AssessmentResultDto> {
    let attempt: AttemptRecord | null = null;
    let savedAnswers: Record<string, 'A' | 'B' | 'C' | 'D'> = {};

    if (!supabaseAdmin || !isUuid(attemptId)) {
      for (const att of localMemoryAttempts.values()) {
        if (att.id === attemptId) {
          attempt = att;
          break;
        }
      }
      if (attempt) {
        const ans = localMemoryAnswers.get(attempt.id);
        if (ans) savedAnswers = Object.fromEntries(ans.entries());
      }
    } else {
      const { data } = await supabaseAdmin
        .from('assessment_attempts')
        .select('*')
        .eq('id', attemptId)
        .maybeSingle();

      if (data) {
        attempt = {
          id: String(data.id),
          applicationId: String(data.application_id),
          userId: String(data.user_id),
          status: data.status,
          questionIds: data.question_ids,
          durationSeconds: data.duration_seconds,
          startedAt: String(data.started_at),
          expiresAt: String(data.expires_at),
          submittedAt: data.submitted_at ? String(data.submitted_at) : null,
          score: Number(data.score) || 0,
          percentage: Number(data.percentage) || 0,
          passed: Boolean(data.passed),
          correctCount: Number(data.correct_count) || 0,
          wrongCount: Number(data.wrong_count) || 0,
          unansweredCount: Number(data.unanswered_count) || 0,
        };

        const { data: answersData } = await supabaseAdmin
          .from('assessment_answers')
          .select('question_id, selected_option')
          .eq('attempt_id', attemptId);

        if (answersData) {
          for (const a of answersData) {
            savedAnswers[a.question_id] = a.selected_option as 'A' | 'B' | 'C' | 'D';
          }
        }
      }
    }

    if (!attempt || attempt.userId !== userId) {
      throw new AppError('Unauthorized access to attempt', 403, 'FORBIDDEN');
    }

    // Get application details
    const app = await applicationsService.getApplicationByUserId(userId);
    const appNumber = app?.applicationNumber || 'AIC-2026-000001';

    // IDEMPOTENCY: If already submitted, return saved result
    if (attempt.status === 'SUBMITTED') {
      return {
        applicationId: attempt.applicationId,
        applicationNumber: appNumber,
        attemptId: attempt.id,
        status: 'SUBMITTED',
        score: attempt.score,
        maxScore: assessmentConfig.maxScore,
        percentage: attempt.percentage,
        passed: attempt.passed,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        unansweredCount: attempt.unansweredCount,
        submittedAt: attempt.submittedAt || attempt.expiresAt,
        applicationStatus: 'under_review',
        notice:
          'Passing the assessment does not guarantee admission. Final selection is made by AI CLUB administration.',
      };
    }

    // Server-side scoring evaluation
    const allQuestions = await this.loadActiveQuestions();
    const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let score = 0;

    for (const qId of attempt.questionIds) {
      const q = questionMap.get(qId);
      const studentAns = savedAnswers[qId];

      if (!studentAns) {
        unansweredCount++;
      } else if (q && studentAns === q.correctOption) {
        correctCount++;
        score += q.marks;
      } else {
        wrongCount++;
      }
    }

    const percentage = Number(((score / assessmentConfig.maxScore) * 100).toFixed(2));
    const passed = percentage >= assessmentConfig.passingPercentage;
    const submittedAt = new Date().toISOString();

    // Persist to attempt and transition application
    if (!supabaseAdmin || !isUuid(attemptId)) {
      attempt.status = 'SUBMITTED';
      attempt.submittedAt = submittedAt;
      attempt.score = score;
      attempt.percentage = percentage;
      attempt.passed = passed;
      attempt.correctCount = correctCount;
      attempt.wrongCount = wrongCount;
      attempt.unansweredCount = unansweredCount;

      const userApp = localMemoryApplications.get(userId);
      if (userApp) {
        userApp.status = 'under_review';
        userApp.assessmentScore = score;
        userApp.assessmentPercentage = percentage;
        userApp.assessmentPassed = passed;
        userApp.submittedAt = submittedAt;
      }
    } else {
      // 1. Update attempt
      await supabaseAdmin
        .from('assessment_attempts')
        .update({
          status: 'SUBMITTED',
          submitted_at: submittedAt,
          score,
          percentage,
          passed,
          correct_count: correctCount,
          wrong_count: wrongCount,
          unanswered_count: unansweredCount,
        })
        .eq('id', attemptId);

      // 2. Update application: TEST_COMPLETED -> UNDER_REVIEW
      await supabaseAdmin
        .from('applications')
        .update({
          status: 'under_review',
          assessment_score: score,
          assessment_percentage: percentage,
          assessment_passed: passed,
          submitted_at: submittedAt,
        })
        .eq('id', attempt.applicationId);
    }

    await notificationsService.createNotification({
      userId: '00000000-0000-0000-0000-000000000001',
      type: 'NEW_APPLICATION',
      title: 'New Applicant Intake Submitted',
      message: `Applicant completed assessment (Score: ${score}/25) for ${appNumber}.`,
      actionUrl: '/admin/applications',
      metadata: { applicationId: attempt.applicationId, applicationNumber: appNumber, score },
    });

    return {
      id: attempt.id,
      attemptId: attempt.id,
      applicationId: attempt.applicationId,
      applicationNumber: appNumber,
      status: 'completed',
      score,
      maxScore: assessmentConfig.maxScore,
      percentage,
      passed,
      correctCount,
      totalCorrect: correctCount,
      wrongCount,
      totalWrong: wrongCount,
      unansweredCount,
      totalUnanswered: unansweredCount,
      totalQuestions: attempt.questionIds.length,
      startedAt: attempt.startedAt,
      submittedAt,
      applicationStatus: 'under_review',
      notice:
        'Passing the assessment does not guarantee admission. Final selection is made by AI CLUB administration.',
    };
  }

  /**
   * Retrieves final result for an attempt
   */
  public async getResult(userId: string, attemptId: string): Promise<AssessmentResultDto> {
    return await this.submitAssessment(userId, attemptId);
  }
}

export const assessmentService = new AssessmentService();
