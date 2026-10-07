import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';
import type {
  AssessmentAttempt,
  AssessmentResult,
  QuestionOption,
} from '@/types/assessment';

export const assessmentApi = {
  /**
   * Start or resume assessment attempt for an application
   */
  async startAssessment(applicationId: string): Promise<ApiResponse<AssessmentAttempt>> {
    return apiClient.post<AssessmentAttempt>(`/api/v1/assessment/applications/${applicationId}/start`);
  },

  /**
   * Fetch assessment attempt details and safe question list
   */
  async getAttempt(attemptId: string): Promise<ApiResponse<AssessmentAttempt>> {
    return apiClient.get<AssessmentAttempt>(`/api/v1/assessment/attempts/${attemptId}`);
  },

  /**
   * Autosave/record an answer for a specific question
   */
  async recordAnswer(
    attemptId: string,
    questionId: string,
    selectedOption: QuestionOption
  ): Promise<ApiResponse<{ success: boolean; questionId: string; selectedOption: QuestionOption }>> {
    return apiClient.put<{ success: boolean; questionId: string; selectedOption: QuestionOption }>(
      `/api/v1/assessment/attempts/${attemptId}/answers/${questionId}`,
      { selectedOption }
    );
  },

  /**
   * Submit attempt for server-authoritative scoring
   */
  async submitAssessment(attemptId: string): Promise<ApiResponse<AssessmentResult>> {
    return apiClient.post<AssessmentResult>(`/api/v1/assessment/attempts/${attemptId}/submit`);
  },

  /**
   * Fetch assessment evaluation results
   */
  async getResult(attemptId: string): Promise<ApiResponse<AssessmentResult>> {
    return apiClient.get<AssessmentResult>(`/api/v1/assessment/attempts/${attemptId}/result`);
  },
};
