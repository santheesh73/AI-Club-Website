import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { assessmentConfig } from '../../config/assessment.config';
import { auditService } from './audit.service';

export interface AdminQuestionDto {
  id: string;
  questionText: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks: number;
  status: 'draft' | 'published' | 'archived';
  explanation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionInput {
  questionText: string;
  category: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks?: number;
  status?: 'draft' | 'published' | 'archived';
  explanation?: string;
}

export class AdminAssessmentService {
  /**
   * List questions with search, category filtering, and status
   */
  async getQuestions(params: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ questions: AdminQuestionDto[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

    if (!supabaseAdmin) {
      return { questions: [], total: 0, page, pageSize };
    }

    let query = supabaseAdmin.from('assessment_questions').select('*', { count: 'exact' });

    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    if (params.search) {
      query = query.ilike('question_text', `%${params.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) {
      throw new AppError(`Failed to fetch questions: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    const questions: AdminQuestionDto[] = (data || []).map((row) => ({
      id: row.id,
      questionText: row.question_text,
      category: row.category,
      difficulty: row.difficulty,
      optionA: row.option_a,
      optionB: row.option_b,
      optionC: row.option_c,
      optionD: row.option_d,
      correctOption: row.correct_option,
      marks: Number(row.marks) || 1.0,
      status: row.status || (row.is_active ? 'published' : 'draft'),
      explanation: row.explanation || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      questions,
      total: count || 0,
      page,
      pageSize,
    };
  }

  /**
   * Get single question including correct option (Admin only)
   */
  async getQuestionById(id: string): Promise<AdminQuestionDto> {
    if (!supabaseAdmin) {
      throw new AppError('Question not found', 404, 'NOT_FOUND');
    }

    const { data, error } = await supabaseAdmin
      .from('assessment_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppError('Question not found', 404, 'NOT_FOUND');
    }

    return {
      id: data.id,
      questionText: data.question_text,
      category: data.category,
      difficulty: data.difficulty,
      optionA: data.option_a,
      optionB: data.option_b,
      optionC: data.option_c,
      optionD: data.option_d,
      correctOption: data.correct_option,
      marks: Number(data.marks) || 1.0,
      status: data.status || 'published',
      explanation: data.explanation || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Create a new question in the question bank
   */
  async createQuestion(input: CreateQuestionInput, actorId: string, requestId?: string): Promise<AdminQuestionDto> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    const { data, error } = await supabaseAdmin
      .from('assessment_questions')
      .insert({
        question_text: input.questionText.trim(),
        category: input.category.trim(),
        difficulty: input.difficulty || 'medium',
        option_a: input.optionA.trim(),
        option_b: input.optionB.trim(),
        option_c: input.optionC.trim(),
        option_d: input.optionD.trim(),
        correct_option: input.correctOption,
        marks: input.marks || 1.0,
        status: input.status || 'published',
        is_active: input.status !== 'archived',
        explanation: input.explanation?.trim() || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Failed to create question: ${error?.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'QUESTION_CREATED',
      entityType: 'ASSESSMENT_QUESTION',
      entityId: data.id,
      metadata: { category: data.category, difficulty: data.difficulty, status: data.status },
      requestId,
    });

    return {
      id: data.id,
      questionText: data.question_text,
      category: data.category,
      difficulty: data.difficulty,
      optionA: data.option_a,
      optionB: data.option_b,
      optionC: data.option_c,
      optionD: data.option_d,
      correctOption: data.correct_option,
      marks: Number(data.marks),
      status: data.status,
      explanation: data.explanation,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Update an existing question
   */
  async updateQuestion(
    id: string,
    input: Partial<CreateQuestionInput>,
    actorId: string,
    requestId?: string
  ): Promise<AdminQuestionDto> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.questionText) updates.question_text = input.questionText.trim();
    if (input.category) updates.category = input.category.trim();
    if (input.difficulty) updates.difficulty = input.difficulty;
    if (input.optionA) updates.option_a = input.optionA.trim();
    if (input.optionB) updates.option_b = input.optionB.trim();
    if (input.optionC) updates.option_c = input.optionC.trim();
    if (input.optionD) updates.option_d = input.optionD.trim();
    if (input.correctOption) updates.correct_option = input.correctOption;
    if (input.marks !== undefined) updates.marks = input.marks;
    if (input.status) {
      updates.status = input.status;
      updates.is_active = input.status !== 'archived';
    }
    if (input.explanation !== undefined) updates.explanation = input.explanation?.trim() || null;

    const { data, error } = await supabaseAdmin
      .from('assessment_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Failed to update question: ${error?.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'QUESTION_UPDATED',
      entityType: 'ASSESSMENT_QUESTION',
      entityId: id,
      metadata: updates,
      requestId,
    });

    return {
      id: data.id,
      questionText: data.question_text,
      category: data.category,
      difficulty: data.difficulty,
      optionA: data.option_a,
      optionB: data.option_b,
      optionC: data.option_c,
      optionD: data.option_d,
      correctOption: data.correct_option,
      marks: Number(data.marks),
      status: data.status,
      explanation: data.explanation,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Archive/delete a question
   */
  async deleteQuestion(id: string, actorId: string, requestId?: string): Promise<{ success: boolean }> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    // Set to archived rather than hard deletion to preserve historical attempt joins
    const { error } = await supabaseAdmin
      .from('assessment_questions')
      .update({ status: 'archived', is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new AppError(`Failed to archive question: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'QUESTION_ARCHIVED',
      entityType: 'ASSESSMENT_QUESTION',
      entityId: id,
      requestId,
    });

    return { success: true };
  }

  /**
   * Return assessment configuration rules
   */
  getAssessmentSettings() {
    return {
      questionCount: assessmentConfig.questionCount,
      durationMinutes: Math.round(assessmentConfig.durationSeconds / 60),
      durationSeconds: assessmentConfig.durationSeconds,
      passPercentage: assessmentConfig.passingPercentage,
      passingMarks: Math.ceil((assessmentConfig.passingPercentage / 100) * assessmentConfig.questionCount),
      marksPerQuestion: 1.0,
      maxAttempts: assessmentConfig.maxAttempts,
    };
  }
}

export const adminAssessmentService = new AdminAssessmentService();
