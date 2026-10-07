/**
 * AI CLUB - Assessment Engine Types (Milestone 3)
 */

export type QuestionOption = 'A' | 'B' | 'C' | 'D';

export interface SafeQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export type AssessmentAttemptStatus = 'in_progress' | 'completed' | 'expired';

export interface AssessmentAttempt {
  id: string;
  applicationId: string;
  userId: string;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  totalQuestions: number;
  status: AssessmentAttemptStatus;
  remainingSeconds: number;
  questions: SafeQuestion[];
  answers: Record<string, QuestionOption>;
}

export interface AssessmentResult {
  id: string;
  applicationId: string;
  startedAt: string;
  submittedAt: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  status: AssessmentAttemptStatus;
  applicationStatus: string;
}
