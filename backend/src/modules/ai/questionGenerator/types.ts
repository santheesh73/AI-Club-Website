/**
 * AI CLUB - AI MCQ Question Generation Types
 */

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionCategory =
  | 'AI Fundamentals'
  | 'Machine Learning'
  | 'Deep Learning'
  | 'Generative AI'
  | 'Python'
  | 'Programming'
  | 'Data Science'
  | 'Computer Science'
  | 'Logical Reasoning'
  | 'Web Development'
  | string;

export interface GenerateMCQRequest {
  count: number; // 1 to 50
  category: QuestionCategory;
  difficulty: QuestionDifficulty | 'mixed';
  topic?: string;
  additionalInstructions?: string;
}

export interface GeneratedRawMCQ {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_option: 'A' | 'B' | 'C' | 'D';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface ValidatedMCQ {
  id?: string;
  questionText: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  marks: number;
  source: 'AI_GENERATED';
  status: 'draft';
}

export interface GenerationResult {
  requestedCount: number;
  generatedCount: number;
  validCount: number;
  duplicatesRemoved: number;
  invalidRemoved: number;
  provider: string;
  model: string;
  questions: ValidatedMCQ[];
  warnings: string[];
}
