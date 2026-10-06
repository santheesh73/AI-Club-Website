/**
 * AI CLUB - Entrance Assessment Engine Configuration
 * 
 * Centralized, configurable parameters controlling assessment rules.
 * Passing score and question counts are governed here rather than hardcoded.
 */

export const assessmentConfig = {
  questionCount: 25,
  durationSeconds: 1800, // 30 minutes
  marksPerQuestion: 1.0,
  maxScore: 25.0,
  passingPercentage: 60.0, // 60% threshold (15/25 marks to pass)
  maxAttempts: 1,
  allowedOptions: ['A', 'B', 'C', 'D'] as const,
} as const;

export type AssessmentConfig = typeof assessmentConfig;
