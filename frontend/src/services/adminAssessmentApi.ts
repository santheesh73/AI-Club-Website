import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';

export interface AdminQuestion {
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
  source?: 'MANUAL' | 'AI_GENERATED';
  explanation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrEditQuestionInput {
  questionText: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks?: number;
  status?: 'draft' | 'published' | 'archived';
  source?: 'MANUAL' | 'AI_GENERATED';
  explanation?: string;
}

export interface GenerateMCQRequest {
  count: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  topic?: string;
  additionalInstructions?: string;
}

export interface GenerationResult {
  requestedCount: number;
  generatedCount: number;
  validCount: number;
  duplicatesRemoved: number;
  invalidRemoved: number;
  provider: string;
  model: string;
  questions: AdminQuestion[];
  warnings: string[];
}

export const adminAssessmentApi = {
  /**
   * Fetch questions list with filtering, search, and pagination
   */
  async getQuestions(params: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResponse<AdminQuestion[]>> {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));

    const qs = query.toString();
    return apiClient.get<AdminQuestion[]>(`/api/v1/admin/assessment/questions${qs ? `?${qs}` : ''}`);
  },

  /**
   * Fetch single question with correct answer (Admin only)
   */
  async getQuestion(id: string): Promise<ApiResponse<AdminQuestion>> {
    return apiClient.get<AdminQuestion>(`/api/v1/admin/assessment/questions/${id}`);
  },

  /**
   * Manually create question in question bank
   */
  async createQuestion(input: CreateOrEditQuestionInput): Promise<ApiResponse<AdminQuestion>> {
    return apiClient.post<AdminQuestion>('/api/v1/admin/assessment/questions', input);
  },

  /**
   * Edit existing question
   */
  async updateQuestion(id: string, input: Partial<CreateOrEditQuestionInput>): Promise<ApiResponse<AdminQuestion>> {
    return apiClient.put<AdminQuestion>(`/api/v1/admin/assessment/questions/${id}`, input);
  },

  /**
   * Archive/delete question
   */
  async deleteQuestion(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`/api/v1/admin/assessment/questions/${id}`);
  },

  /**
   * Promote draft question to published
   */
  async publishQuestion(id: string): Promise<ApiResponse<AdminQuestion>> {
    return apiClient.post<AdminQuestion>(`/api/v1/admin/assessment/questions/${id}/publish`);
  },

  /**
   * Batch publish draft questions
   */
  async publishBatch(questionIds: string[]): Promise<ApiResponse<{ publishedCount: number; publishedIds: string[] }>> {
    return apiClient.post<{ publishedCount: number; publishedIds: string[] }>('/api/v1/admin/assessment/publish-batch', {
      questionIds,
    });
  },

  /**
   * Generate questions using server-side Gemini AI provider
   */
  async generateMCQs(request: GenerateMCQRequest): Promise<ApiResponse<GenerationResult>> {
    return apiClient.post<GenerationResult>('/api/v1/admin/assessment/generate', request);
  },

  /**
   * Get assessment runtime configuration rules
   */
  async getSettings(): Promise<ApiResponse<{
    questionCount: number;
    durationMinutes: number;
    durationSeconds: number;
    passPercentage: number;
    passingMarks: number;
    marksPerQuestion: number;
    maxAttempts: number;
  }>> {
    return apiClient.get('/api/v1/admin/assessment/settings');
  },
};
