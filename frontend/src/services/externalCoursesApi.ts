import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';
import type {
  ExternalCourseDto,
  CourseProviderDefinition,
  RecommendationsResponseDto,
  ExternalCoursesListResponseDto,
  CreateExternalCourseDto,
  UpdateExternalCourseDto,
  AdminExternalCourseStatsDto,
  ExtractedCoursePreviewDto,
} from '@/types/externalCourses';

export const externalCoursesApi = {
  // ============================================================================
  // MEMBER / DISCOVERY ENDPOINTS
  // ============================================================================

  /**
   * Get personalized external course recommendations for the authenticated member
   */
  async getRecommendations(params?: {
    forceRefresh?: boolean;
    limit?: number;
  }): Promise<ApiResponse<RecommendationsResponseDto>> {
    const searchParams = new URLSearchParams();
    if (params?.forceRefresh) searchParams.append('forceRefresh', 'true');
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    const endpoint = `/api/v1/courses/recommended${qs ? `?${qs}` : ''}`;
    return apiClient.get<RecommendationsResponseDto>(endpoint);
  },

  /**
   * Browse verified external courses catalog
   */
  async getExternalCourses(params?: {
    provider?: string;
    category?: string;
    difficulty?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ExternalCoursesListResponseDto>> {
    const searchParams = new URLSearchParams();
    if (params?.provider) searchParams.append('provider', params.provider);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const qs = searchParams.toString();
    const endpoint = `/api/v1/courses/external${qs ? `?${qs}` : ''}`;
    return apiClient.get<ExternalCoursesListResponseDto>(endpoint);
  },

  /**
   * Record click event and get official verified provider redirect URL
   */
  async recordClick(courseId: string): Promise<ApiResponse<{
    success: boolean;
    courseId: string;
    officialUrl: string;
    redirectUrl: string;
  }>> {
    return apiClient.post<{
      success: boolean;
      courseId: string;
      officialUrl: string;
      redirectUrl: string;
    }>(`/api/v1/courses/external/${courseId}/click`, {});
  },

  /**
   * Get supported external course providers
   */
  async getProviders(): Promise<ApiResponse<{ providers: CourseProviderDefinition[] }>> {
    return apiClient.get<{ providers: CourseProviderDefinition[] }>('/api/v1/courses/providers');
  },

  // ============================================================================
  // ADMIN CATALOG MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Admin: List external courses with filtering and pagination
   */
  async getAdminExternalCourses(params?: {
    provider?: string;
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ExternalCourseDto[] | { courses: ExternalCourseDto[]; total: number; limit: number; offset: number }>> {
    const searchParams = new URLSearchParams();
    if (params?.provider) searchParams.append('provider', params.provider);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const qs = searchParams.toString();
    const endpoint = `/api/v1/admin/external-courses${qs ? `?${qs}` : ''}`;
    return apiClient.get<ExternalCourseDto[] | { courses: ExternalCourseDto[]; total: number; limit: number; offset: number }>(endpoint);
  },

  /**
   * Admin: Fetch catalog stats summary
   */
  async getAdminStats(): Promise<ApiResponse<AdminExternalCourseStatsDto | { stats: AdminExternalCourseStatsDto }>> {
    return apiClient.get<AdminExternalCourseStatsDto | { stats: AdminExternalCourseStatsDto }>('/api/v1/admin/external-courses/stats');
  },

  /**
   * Admin: Create a new verified external course
   */
  async createExternalCourse(data: CreateExternalCourseDto): Promise<ApiResponse<{ course: ExternalCourseDto; message: string }>> {
    return apiClient.post<{ course: ExternalCourseDto; message: string }>('/api/v1/admin/external-courses', data);
  },

  /**
   * Admin: Update external course details
   */
  async updateExternalCourse(id: string, data: UpdateExternalCourseDto): Promise<ApiResponse<{ course: ExternalCourseDto; message: string }>> {
    return apiClient.put<{ course: ExternalCourseDto; message: string }>(`/api/v1/admin/external-courses/${id}`, data);
  },

  /**
   * Admin: Verify external course URL and status
   */
  async verifyExternalCourse(id: string): Promise<ApiResponse<{ course: ExternalCourseDto; message: string }>> {
    return apiClient.post<{ course: ExternalCourseDto; message: string }>(`/api/v1/admin/external-courses/${id}/verify`, {});
  },

  /**
   * Admin: Extract official course page metadata from URL
   */
  async extractCourseDetails(url: string): Promise<ApiResponse<ExtractedCoursePreviewDto>> {
    return apiClient.post<ExtractedCoursePreviewDto>('/api/v1/admin/external-courses/extract', { url });
  },

  /**
   * Admin: Publish an existing course draft
   */
  async publishExternalCourse(id: string): Promise<ApiResponse<{ course: ExternalCourseDto; message: string }>> {
    return apiClient.post<{ course: ExternalCourseDto; message: string }>(`/api/v1/admin/external-courses/${id}/publish`, {});
  },

  /**
   * Admin: Delete/Archive external course
   */
  async deleteExternalCourse(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/v1/admin/external-courses/${id}`);
  },
};
