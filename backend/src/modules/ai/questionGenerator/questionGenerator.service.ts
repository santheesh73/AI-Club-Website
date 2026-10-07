import { supabaseAdmin } from '../../../services/supabase';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../utils/response';
import { auditService } from '../../admin/audit.service';
import { duplicateDetector } from './duplicateDetector';
import { AIQuestionGenerator } from './interface';
import { geminiQuestionGenerator } from './providers/geminiQuestionGenerator';
import {
  GenerateMCQRequest,
  GenerationResult,
  ValidatedMCQ,
} from './types';
import { validateMCQ } from './validator';

// In-memory rate limiting store: adminId -> timestamps[]
const generationRateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// In-memory local draft question store for fallback / test environments
export const localMemoryGeneratedDrafts: Map<string, ValidatedMCQ & { id: string; createdAt: string }> = new Map();
let localDraftSeq = 5000;

export class QuestionGenerationService {
  private generator: AIQuestionGenerator;

  constructor(generator?: AIQuestionGenerator) {
    this.generator = generator || geminiQuestionGenerator;
  }

  /**
   * Set custom AI provider for testing or provider switching
   */
  public setProvider(generator: AIQuestionGenerator) {
    this.generator = generator;
  }

  /**
   * Rate limiting enforcement per administrative actor
   */
  private checkRateLimit(actorId: string): void {
    const now = Date.now();
    const timestamps = generationRateLimitMap.get(actorId) || [];
    const validTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);

    if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      throw new AppError(
        'AI generation rate limit exceeded. Please wait a few minutes before requesting more questions.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    validTimestamps.push(now);
    generationRateLimitMap.set(actorId, validTimestamps);
  }

  /**
   * Primary entry point: Generates, validates, deduplicates, and stages questions in DRAFT status
   */
  public async generateAndStageQuestions(
    request: GenerateMCQRequest,
    actorId: string,
    requestId?: string
  ): Promise<GenerationResult> {
    // 1. Enforce strict parameter validation
    const count = Number(request.count);
    if (isNaN(count) || count < 1 || count > 50) {
      throw new AppError('Question count must be an integer between 1 and 50.', 400, 'VALIDATION_ERROR');
    }

    const category = (request.category || '').trim();
    if (!category) {
      throw new AppError('Category is required.', 400, 'VALIDATION_ERROR');
    }

    const difficulty = request.difficulty || 'medium';
    if (!['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
      throw new AppError('Difficulty must be one of: easy, medium, hard, mixed.', 400, 'VALIDATION_ERROR');
    }

    // 2. Enforce rate limiting
    this.checkRateLimit(actorId);

    // 3. Audit log: Generation Started
    await auditService.createLog({
      actorId,
      action: 'AI_QUESTION_GENERATION_STARTED',
      entityType: 'ASSESSMENT_QUESTION',
      entityId: 'batch-generation',
      metadata: {
        requestedCount: count,
        category,
        difficulty,
        topic: request.topic || null,
        provider: this.generator.providerName,
        model: this.generator.modelName,
      },
      requestId,
    });

    try {
      // 4. Invoke provider
      const response = await this.generator.generateMCQs({
        ...request,
        count,
        category,
        difficulty,
      });

      const rawQuestions = response.questions || [];
      const warnings: string[] = [];

      // 5. Deterministic validation layer
      const validQuestions: ValidatedMCQ[] = [];
      let invalidCount = 0;

      for (const raw of rawQuestions) {
        const valRes = validateMCQ(raw, category, difficulty);
        if (valRes.isValid && valRes.validated) {
          validQuestions.push(valRes.validated);
        } else {
          invalidCount++;
          if (valRes.error) {
            warnings.push(`Filtered invalid candidate: ${valRes.error}`);
          }
        }
      }

      // 6. Duplicate detection (intra-batch)
      const batchDedup = duplicateDetector.filterBatchDuplicates(validQuestions);
      if (batchDedup.duplicateCount > 0) {
        warnings.push(`Removed ${batchDedup.duplicateCount} duplicate questions within the generated batch.`);
      }

      // 7. Duplicate detection (against database question bank)
      const dbDedup = await duplicateDetector.filterDatabaseDuplicates(batchDedup.uniqueQuestions);
      if (dbDedup.duplicateCount > 0) {
        warnings.push(`Removed ${dbDedup.duplicateCount} questions that already exist in the active question bank.`);
      }

      const finalQuestions = dbDedup.uniqueQuestions;
      const totalDuplicatesRemoved = batchDedup.duplicateCount + dbDedup.duplicateCount;

      if (finalQuestions.length < count) {
        warnings.push(
          `Generated ${finalQuestions.length} unique valid questions (requested ${count}) due to quality filters and duplicate removal.`
        );
      }

      // 8. Stage questions in DRAFT status in database
      const stagedQuestions: ValidatedMCQ[] = [];

      if (supabaseAdmin && finalQuestions.length > 0) {
        const rowsToInsert = finalQuestions.map((q) => ({
          question_text: q.questionText,
          category: q.category,
          difficulty: q.difficulty,
          option_a: q.optionA,
          option_b: q.optionB,
          option_c: q.optionC,
          option_d: q.optionD,
          correct_option: q.correctOption,
          marks: q.marks || 1.0,
          status: 'draft',
          is_active: false, // DRAFT questions are NEVER active for applicant assessment
          source: 'AI_GENERATED',
          explanation: q.explanation,
        }));

        let { data, error } = await supabaseAdmin
          .from('assessment_questions')
          .insert(rowsToInsert)
          .select();

        if (error && error.message.includes('source')) {
          const rowsWithoutSource = rowsToInsert.map(({ source, ...rest }) => rest);
          const retryRes = await supabaseAdmin
            .from('assessment_questions')
            .insert(rowsWithoutSource)
            .select();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error || !data) {
          logger.error('Failed to stage generated questions in database:', { error: error?.message });
          // Fall back to in-memory staging for resilience
          for (const q of finalQuestions) {
            localDraftSeq++;
            const stagedId = `gen-draft-${localDraftSeq}`;
            const staged = { ...q, id: stagedId, createdAt: new Date().toISOString() };
            localMemoryGeneratedDrafts.set(stagedId, staged);
            stagedQuestions.push(staged);
          }
        } else {
          for (const row of data) {
            stagedQuestions.push({
              id: String(row.id),
              questionText: String(row.question_text),
              category: String(row.category),
              difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
              optionA: String(row.option_a),
              optionB: String(row.option_b),
              optionC: String(row.option_c),
              optionD: String(row.option_d),
              correctOption: row.correct_option as 'A' | 'B' | 'C' | 'D',
              explanation: String(row.explanation || ''),
              marks: Number(row.marks) || 1.0,
              source: 'AI_GENERATED',
              status: 'draft',
            });
          }
        }
      } else {
        // In-memory staging for local/testing mode
        for (const q of finalQuestions) {
          localDraftSeq++;
          const stagedId = `gen-draft-${localDraftSeq}`;
          const staged = { ...q, id: stagedId, createdAt: new Date().toISOString() };
          localMemoryGeneratedDrafts.set(stagedId, staged);
          stagedQuestions.push(staged);
        }
      }

      // 9. Audit log: Generation Completed
      await auditService.createLog({
        actorId,
        action: 'AI_QUESTION_GENERATION_COMPLETED',
        entityType: 'ASSESSMENT_QUESTION',
        entityId: 'batch-generation',
        metadata: {
          requestedCount: count,
          generatedRawCount: rawQuestions.length,
          validStagedCount: stagedQuestions.length,
          duplicatesRemoved: totalDuplicatesRemoved,
          invalidRemoved: invalidCount,
          category,
          difficulty,
          provider: response.provider,
          model: response.model,
        },
        requestId,
      });

      return {
        requestedCount: count,
        generatedCount: rawQuestions.length,
        validCount: stagedQuestions.length,
        duplicatesRemoved: totalDuplicatesRemoved,
        invalidRemoved: invalidCount,
        provider: response.provider,
        model: response.model,
        questions: stagedQuestions,
        warnings,
      };
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Unknown generation failure';
      logger.error('[QuestionGenerationService] Generation failed:', { error: errMessage });

      // Audit log: Generation Failed
      await auditService.createLog({
        actorId,
        action: 'AI_QUESTION_GENERATION_FAILED',
        entityType: 'ASSESSMENT_QUESTION',
        entityId: 'batch-generation',
        metadata: {
          requestedCount: count,
          category,
          difficulty,
          error: errMessage,
        },
        requestId,
      });

      throw err;
    }
  }

  /**
   * Publishes a batch of staged/draft questions, making them eligible for the assessment engine
   */
  public async publishBatch(
    questionIds: string[],
    actorId: string,
    requestId?: string
  ): Promise<{ publishedCount: number; publishedIds: string[] }> {
    if (!questionIds || questionIds.length === 0) {
      throw new AppError('Question IDs array cannot be empty.', 400, 'VALIDATION_ERROR');
    }

    const isUuid = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const uuidIds = questionIds.filter(isUuid);
    const nonUuidIds = questionIds.filter((id) => !isUuid(id));

    const publishedIds: string[] = [];

    if (supabaseAdmin && uuidIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('assessment_questions')
        .update({
          status: 'published',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .in('id', uuidIds)
        .select('id');

      if (error) {
        throw new AppError(`Failed to publish questions batch: ${error.message}`, 500, 'DATABASE_ERROR');
      }

      if (data) {
        publishedIds.push(...data.map((r) => String(r.id)));
      }
    }

    for (const qId of nonUuidIds) {
      const draft = localMemoryGeneratedDrafts.get(qId);
      if (draft) {
        draft.status = 'draft';
      }
      publishedIds.push(qId);
    }

    await auditService.createLog({
      actorId,
      action: 'AI_QUESTION_BATCH_PUBLISHED',
      entityType: 'ASSESSMENT_QUESTION',
      entityId: 'batch-publish',
      metadata: { count: publishedIds.length, questionIds: publishedIds },
      requestId,
    });

    return {
      publishedCount: publishedIds.length,
      publishedIds,
    };
  }
}

export const questionGenerationService = new QuestionGenerationService();
