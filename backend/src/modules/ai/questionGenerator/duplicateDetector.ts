import { supabaseAdmin } from '../../../services/supabase';
import { ValidatedMCQ } from './types';

/**
 * Normalizes question text for duplicate comparisons:
 * - Lowercase
 * - Strip punctuation
 * - Collapse multiple whitespaces
 */
export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface DuplicateCheckResult {
  uniqueQuestions: ValidatedMCQ[];
  duplicateCount: number;
  duplicateDetails: Array<{ text: string; reason: string }>;
}

export class DuplicateDetector {
  /**
   * Filters out duplicates within the generated batch itself
   */
  public filterBatchDuplicates(questions: ValidatedMCQ[]): DuplicateCheckResult {
    const seen = new Set<string>();
    const unique: ValidatedMCQ[] = [];
    const duplicates: Array<{ text: string; reason: string }> = [];

    for (const q of questions) {
      const normalized = normalizeQuestionText(q.questionText);
      if (seen.has(normalized)) {
        duplicates.push({
          text: q.questionText,
          reason: 'Duplicate question within the same generation batch',
        });
      } else {
        seen.add(normalized);
        unique.push(q);
      }
    }

    return {
      uniqueQuestions: unique,
      duplicateCount: duplicates.length,
      duplicateDetails: duplicates,
    };
  }

  /**
   * Checks candidate questions against the existing database question bank
   */
  public async filterDatabaseDuplicates(questions: ValidatedMCQ[]): Promise<DuplicateCheckResult> {
    if (!supabaseAdmin || questions.length === 0) {
      return {
        uniqueQuestions: questions,
        duplicateCount: 0,
        duplicateDetails: [],
      };
    }

    try {
      // Fetch active question texts from database for comparison
      const { data, error } = await supabaseAdmin
        .from('assessment_questions')
        .select('question_text')
        .neq('status', 'archived');

      if (error || !data) {
        // In case of query error, do not drop questions, treat as unique
        return {
          uniqueQuestions: questions,
          duplicateCount: 0,
          duplicateDetails: [],
        };
      }

      const existingNormalized = new Set(data.map((row) => normalizeQuestionText(String(row.question_text))));

      const unique: ValidatedMCQ[] = [];
      const duplicates: Array<{ text: string; reason: string }> = [];

      for (const q of questions) {
        const norm = normalizeQuestionText(q.questionText);
        if (existingNormalized.has(norm)) {
          duplicates.push({
            text: q.questionText,
            reason: 'Question already exists in active question bank',
          });
        } else {
          unique.push(q);
        }
      }

      return {
        uniqueQuestions: unique,
        duplicateCount: duplicates.length,
        duplicateDetails: duplicates,
      };
    } catch {
      return {
        uniqueQuestions: questions,
        duplicateCount: 0,
        duplicateDetails: [],
      };
    }
  }
}

export const duplicateDetector = new DuplicateDetector();
