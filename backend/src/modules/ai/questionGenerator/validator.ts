import { GeneratedRawMCQ, ValidatedMCQ, QuestionDifficulty } from './types';

export interface ValidationResult {
  isValid: boolean;
  validated?: ValidatedMCQ;
  error?: string;
}

const FORBIDDEN_OPTIONS_REGEX = /\b(all of the above|none of the above|both [a-d] and [a-d]|neither [a-d] nor [a-d])\b/i;

/**
 * Deterministic quality and schema validation for AI-generated MCQ questions.
 * Never trusts raw AI outputs without strict validation.
 */
export function validateMCQ(
  raw: unknown,
  fallbackCategory: string,
  fallbackDifficulty: QuestionDifficulty | 'mixed'
): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { isValid: false, error: 'Question item is not a valid object' };
  }

  const q = raw as Partial<GeneratedRawMCQ>;

  // 1. Question text validation
  if (typeof q.question !== 'string' || q.question.trim().length < 10) {
    return { isValid: false, error: 'Question text missing or too short (< 10 chars)' };
  }
  if (q.question.trim().length > 600) {
    return { isValid: false, error: 'Question text too long (> 600 chars)' };
  }

  const questionText = q.question.trim();

  // 2. Options validation
  if (!q.options || typeof q.options !== 'object') {
    return { isValid: false, error: 'Options object missing' };
  }

  const optA = typeof q.options.A === 'string' ? q.options.A.trim() : '';
  const optB = typeof q.options.B === 'string' ? q.options.B.trim() : '';
  const optC = typeof q.options.C === 'string' ? q.options.C.trim() : '';
  const optD = typeof q.options.D === 'string' ? q.options.D.trim() : '';

  if (!optA || !optB || !optC || !optD) {
    return { isValid: false, error: 'All 4 options (A, B, C, D) must be non-empty strings' };
  }

  if (optA.length > 300 || optB.length > 300 || optC.length > 300 || optD.length > 300) {
    return { isValid: false, error: 'Option text exceeds maximum length of 300 chars' };
  }

  // 3. Duplicate options validation
  const normalizedOptions = [optA, optB, optC, optD].map((o) => o.toLowerCase());
  const uniqueOptions = new Set(normalizedOptions);
  if (uniqueOptions.size !== 4) {
    return { isValid: false, error: 'Question contains duplicate options' };
  }

  // 4. Forbidden patterns ("all of the above", "none of the above")
  for (const opt of [optA, optB, optC, optD]) {
    if (FORBIDDEN_OPTIONS_REGEX.test(opt)) {
      return { isValid: false, error: `Option contains forbidden phrase ("${opt}")` };
    }
  }

  // 5. Correct option validation
  const correctOpt = typeof q.correct_option === 'string' ? q.correct_option.trim().toUpperCase() : '';
  if (!['A', 'B', 'C', 'D'].includes(correctOpt)) {
    return { isValid: false, error: `Invalid correct option '${correctOpt}'. Must be A, B, C, or D` };
  }

  // 6. Category normalization
  const category = (typeof q.category === 'string' && q.category.trim()) || fallbackCategory || 'AI Fundamentals';

  // 7. Difficulty normalization
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (typeof q.difficulty === 'string') {
    const diffLower = q.difficulty.toLowerCase().trim();
    if (diffLower === 'easy' || diffLower === 'beginner') difficulty = 'easy';
    else if (diffLower === 'hard' || diffLower === 'advanced') difficulty = 'hard';
    else difficulty = 'medium';
  } else if (fallbackDifficulty !== 'mixed') {
    difficulty = fallbackDifficulty;
  }

  // 8. Explanation validation
  const explanation =
    typeof q.explanation === 'string' && q.explanation.trim().length > 0
      ? q.explanation.trim()
      : `Option ${correctOpt} is correct based on authoritative computer science and AI principles.`;

  // 9. Answer leakage check (e.g., question says "The answer is option B")
  const leakageRegex = new RegExp(`\\b(correct answer is (option )?${correctOpt}|answer is ${correctOpt})\\b`, 'i');
  if (leakageRegex.test(questionText)) {
    return { isValid: false, error: 'Question text contains direct answer leakage' };
  }

  return {
    isValid: true,
    validated: {
      questionText,
      category,
      difficulty,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctOption: correctOpt as 'A' | 'B' | 'C' | 'D',
      explanation,
      marks: 1.0,
      source: 'AI_GENERATED',
      status: 'draft',
    },
  };
}
