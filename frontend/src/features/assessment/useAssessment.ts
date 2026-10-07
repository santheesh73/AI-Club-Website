import { useState, useEffect, useCallback, useRef } from 'react';
import { assessmentApi } from '@/services/assessmentApi';
import type {
  AssessmentAttempt,
  AssessmentResult,
  QuestionOption,
} from '@/types/assessment';
import type { AutosaveStatus } from './AutosaveIndicator';

export function useAssessment(applicationId?: string) {
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, QuestionOption>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Load or resume attempt
  const loadAttempt = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await assessmentApi.startAssessment(applicationId);
      if (res.success && res.data) {
        const raw = res.data as any;
        const normalizedAttempt: AssessmentAttempt = {
          id: raw.id || raw.attemptId,
          applicationId: raw.applicationId,
          userId: raw.userId || '',
          startedAt: raw.startedAt,
          expiresAt: raw.expiresAt,
          submittedAt: raw.submittedAt || null,
          score: raw.score ?? null,
          percentage: raw.percentage ?? null,
          passed: raw.passed ?? null,
          totalQuestions: raw.totalQuestions || raw.questionCount || raw.questions?.length || 0,
          status: (raw.status?.toLowerCase() === 'submitted' ? 'completed' : raw.status?.toLowerCase() || 'in_progress') as any,
          remainingSeconds: raw.remainingSeconds ?? 1800,
          questions: (raw.questions || []).map((q: any) => ({
            id: q.id,
            category: q.category,
            difficulty: q.difficulty,
            questionText: q.questionText,
            optionA: q.optionA || q.options?.A || '',
            optionB: q.optionB || q.options?.B || '',
            optionC: q.optionC || q.options?.C || '',
            optionD: q.optionD || q.options?.D || '',
          })),
          answers: raw.answers || raw.savedAnswers || {},
        };
        setAttempt(normalizedAttempt);
        setAnswers(normalizedAttempt.answers);
        // If already completed or expired, load the result
        if (normalizedAttempt.status === 'completed' || normalizedAttempt.status === 'expired') {
          const resResult = await assessmentApi.getResult(normalizedAttempt.id);
          if (resResult.success && resResult.data) {
            setResult(resResult.data);
          }
        }
      } else if (!res.success) {
        setError(res.error.message || 'Could not load assessment');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading assessment';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // Answer recording with optimistic update & server autosave
  const pendingSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectAnswer = useCallback(
    async (questionId: string, option: QuestionOption) => {
      if (!attempt || attempt.status !== 'in_progress') return;

      // Optimistic update
      setAnswers((prev) => ({ ...prev, [questionId]: option }));
      setAutosaveStatus('saving');

      if (pendingSaveTimeoutRef.current) {
        clearTimeout(pendingSaveTimeoutRef.current);
      }

      try {
        const saveRes = await assessmentApi.recordAnswer(attempt.id, questionId, option);
        if (saveRes.success) {
          setAutosaveStatus('idle');
          setLastSavedAt(new Date());
        } else {
          setAutosaveStatus('error');
        }
      } catch {
        setAutosaveStatus('error');
      }
    },
    [attempt]
  );

  // Submit assessment
  const submit = useCallback(async (): Promise<AssessmentResult | null> => {
    if (!attempt) return null;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await assessmentApi.submitAssessment(attempt.id);
      if (res.success && res.data) {
        setResult(res.data);
        setAttempt((prev) => (prev ? { ...prev, status: 'completed' } : null));
        return res.data;
      } else if (!res.success) {
        setError(res.error.message || 'Failed to submit assessment');
        return null;
      }
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setError(msg);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt]);

  // Fetch standalone result
  const fetchResult = useCallback(async (attemptId: string) => {
    setIsLoading(true);
    try {
      const res = await assessmentApi.getResult(attemptId);
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch result';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const totalQuestions = attempt?.questions?.length || 0;
  const currentQuestion = attempt?.questions?.[currentIndex] || null;

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  };

  return {
    attempt,
    questions: attempt?.questions || [],
    currentQuestion,
    currentIndex,
    totalQuestions,
    answers,
    isLoading,
    isSubmitting,
    autosaveStatus,
    lastSavedAt,
    error,
    result,
    selectAnswer,
    submit,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    fetchResult,
    reload: loadAttempt,
  };
}
