import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';
import type {
  CourseCategoryRecord,
  CourseCardDto,
  CourseDetailDto,
  LessonDetailDto,
  CourseProgressDto,
  AdminCourseSummaryDto,
  AdminLearnerEnrollmentDto,
  LearningDashboardStatsDto,
  CreateCourseDto,
  UpdateCourseDto,
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
  ReorderItemDto,
  CourseDifficulty,
  CourseStatus,
} from '@/types/courses';

export const coursesApi = {
  // ============================================================================
  // PUBLIC / COMMON CALLS
  // ============================================================================

  /**
   * Fetch all course categories
   */
  async getCategories(): Promise<ApiResponse<CourseCategoryRecord[]>> {
    return apiClient.get<CourseCategoryRecord[]>('/api/v1/courses/categories');
  },

  // ============================================================================
  // MEMBER API CALLS
  // ============================================================================

  /**
   * Fetch courses catalogue for member discovery
   */
  async getMemberCourses(query: {
    category?: string;
    difficulty?: CourseDifficulty;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'created_at' | 'title' | 'estimated_duration';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<CourseCardDto[]>> {
    const params = new URLSearchParams();
    if (query.category) params.append('category', query.category);
    if (query.difficulty) params.append('difficulty', query.difficulty);
    if (query.search) params.append('search', query.search);
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString();
    return apiClient.get<CourseCardDto[]>(`/api/v1/member/courses${qs ? `?${qs}` : ''}`);
  },

  /**
   * Fetch active member's enrolled courses (both active and completed)
   */
  async getEnrolledCourses(): Promise<ApiResponse<CourseCardDto[]>> {
    return apiClient.get<CourseCardDto[]>('/api/v1/member/courses/enrolled');
  },

  /**
   * Fetch member learning stats and resume learning pointer
   */
  async getLearningDashboardStats(): Promise<ApiResponse<LearningDashboardStatsDto>> {
    return apiClient.get<LearningDashboardStatsDto>('/api/v1/member/courses/dashboard');
  },

  /**
   * Fetch course detail and full syllabus tree by slug
   */
  async getCourseBySlug(slug: string): Promise<ApiResponse<CourseDetailDto>> {
    return apiClient.get<CourseDetailDto>(`/api/v1/member/courses/${slug}`);
  },

  /**
   * Enroll active member in a published course
   */
  async enrollInCourse(courseId: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return apiClient.post<{ id: string; status: string }>(`/api/v1/member/courses/${courseId}/enroll`);
  },

  /**
   * Fetch lesson content and navigation pointers.
   * Gated: only delivers protected content if member is enrolled or lesson isPreview.
   */
  async getLesson(courseSlug: string, lessonSlug: string): Promise<ApiResponse<LessonDetailDto>> {
    return apiClient.get<LessonDetailDto>(`/api/v1/member/courses/${courseSlug}/lessons/${lessonSlug}`);
  },

  /**
   * Update progress for a lesson (mark completed or incomplete)
   */
  async updateLessonProgress(
    courseSlug: string,
    lessonSlug: string,
    completed: boolean = true
  ): Promise<ApiResponse<CourseProgressDto>> {
    return apiClient.post<CourseProgressDto>(
      `/api/v1/member/courses/${courseSlug}/lessons/${lessonSlug}/progress`,
      { completed }
    );
  },

  // ============================================================================
  // ADMIN API CALLS
  // ============================================================================

  /**
   * Admin: List courses
   */
  async getAdminCourses(query: {
    category?: string;
    difficulty?: CourseDifficulty;
    status?: CourseStatus;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'created_at' | 'title' | 'estimated_duration';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<AdminCourseSummaryDto[]>> {
    const params = new URLSearchParams();
    if (query.category) params.append('category', query.category);
    if (query.difficulty) params.append('difficulty', query.difficulty);
    if (query.status) params.append('status', query.status);
    if (query.search) params.append('search', query.search);
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString();
    return apiClient.get<AdminCourseSummaryDto[]>(`/api/v1/admin/courses${qs ? `?${qs}` : ''}`);
  },

  /**
   * Admin: Fetch course detail by ID (including modules and lessons)
   */
  async getAdminCourseById(id: string): Promise<ApiResponse<CourseDetailDto>> {
    return apiClient.get<CourseDetailDto>(`/api/v1/admin/courses/${id}`);
  },

  /**
   * Admin: Create a new course
   */
  async createCourse(data: CreateCourseDto): Promise<ApiResponse<CourseCardDto>> {
    return apiClient.post<CourseCardDto>('/api/v1/admin/courses', data);
  },

  /**
   * Admin: Update course metadata
   */
  async updateCourse(id: string, data: UpdateCourseDto): Promise<ApiResponse<CourseCardDto>> {
    return apiClient.put<CourseCardDto>(`/api/v1/admin/courses/${id}`, data);
  },

  /**
   * Admin: Delete course
   */
  async deleteCourse(id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
    return apiClient.delete<{ id: string; deleted: boolean }>(`/api/v1/admin/courses/${id}`);
  },

  /**
   * Admin: Publish course
   */
  async publishCourse(id: string): Promise<ApiResponse<{ id: string; status: CourseStatus }>> {
    return apiClient.post<{ id: string; status: CourseStatus }>(`/api/v1/admin/courses/${id}/publish`);
  },

  /**
   * Admin: Unpublish course back to draft
   */
  async unpublishCourse(id: string): Promise<ApiResponse<{ id: string; status: CourseStatus }>> {
    return apiClient.post<{ id: string; status: CourseStatus }>(`/api/v1/admin/courses/${id}/unpublish`);
  },

  /**
   * Admin: Archive course
   */
  async archiveCourse(id: string): Promise<ApiResponse<{ id: string; status: CourseStatus }>> {
    return apiClient.post<{ id: string; status: CourseStatus }>(`/api/v1/admin/courses/${id}/archive`);
  },

  /**
   * Admin: Create module in a course
   */
  async createModule(courseId: string, data: CreateModuleDto): Promise<ApiResponse<any>> {
    return apiClient.post<any>(`/api/v1/admin/courses/${courseId}/modules`, data);
  },

  /**
   * Admin: Update module
   */
  async updateModule(courseId: string, moduleId: string, data: UpdateModuleDto): Promise<ApiResponse<any>> {
    return apiClient.put<any>(`/api/v1/admin/courses/${courseId}/modules/${moduleId}`, data);
  },

  /**
   * Admin: Delete module
   */
  async deleteModule(courseId: string, moduleId: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
    return apiClient.delete<{ id: string; deleted: boolean }>(`/api/v1/admin/courses/${courseId}/modules/${moduleId}`);
  },

  /**
   * Admin: Reorder modules
   */
  async reorderModules(courseId: string, items: ReorderItemDto[]): Promise<ApiResponse<{ updated: boolean }>> {
    return apiClient.post<{ updated: boolean }>(`/api/v1/admin/courses/${courseId}/modules/reorder`, { items });
  },

  /**
   * Admin: Create lesson in a module
   */
  async createLesson(courseId: string, moduleId: string, data: CreateLessonDto): Promise<ApiResponse<any>> {
    return apiClient.post<any>(`/api/v1/admin/courses/${courseId}/modules/${moduleId}/lessons`, data);
  },

  /**
   * Admin: Update lesson
   */
  async updateLesson(courseId: string, moduleId: string, lessonId: string, data: UpdateLessonDto): Promise<ApiResponse<any>> {
    return apiClient.put<any>(`/api/v1/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data);
  },

  /**
   * Admin: Delete lesson
   */
  async deleteLesson(courseId: string, moduleId: string, lessonId: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
    return apiClient.delete<{ id: string; deleted: boolean }>(
      `/api/v1/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
    );
  },

  /**
   * Admin: Reorder lessons
   */
  async reorderLessons(
    courseId: string,
    moduleId: string,
    items: ReorderItemDto[]
  ): Promise<ApiResponse<{ updated: boolean }>> {
    return apiClient.post<{ updated: boolean }>(
      `/api/v1/admin/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
      { items }
    );
  },

  /**
   * Admin: Get learner enrollments & progress roster for a course
   */
  async getAdminLearnerEnrollments(courseId: string): Promise<ApiResponse<AdminLearnerEnrollmentDto[]>> {
    return apiClient.get<AdminLearnerEnrollmentDto[]>(`/api/v1/admin/courses/${courseId}/enrollments`);
  },
};
