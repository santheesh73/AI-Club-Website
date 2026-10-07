import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';
import type {
  ProjectCardDto,
  ProjectDetailDto,
  ProjectCategoryRecord,
  TechnologyRecord,
  AdminProjectSummaryDto,
  AdminReportDto,
  CreateProjectInput,
  UpdateProjectInput,
  AddContributorInput,
  AddLinkInput,
  AddMediaInput,
  CreateReportInput,
  ProjectQueryInput,
  AchievementCategoryRecord,
  AchievementDto,
  CreateAchievementInput,
  UpdateAchievementInput,
  ProjectLinkRecord,
  ProjectMediaRecord,
} from '@/types/community';

export const communityApi = {
  // ============================================================================
  // PUBLIC & DISCOVERY
  // ============================================================================

  async getCategories(): Promise<ApiResponse<ProjectCategoryRecord[]>> {
    return apiClient.get<ProjectCategoryRecord[]>('/api/v1/projects/categories');
  },

  async getTechnologies(): Promise<ApiResponse<TechnologyRecord[]>> {
    return apiClient.get<TechnologyRecord[]>('/api/v1/projects/technologies');
  },

  async getProjects(query: ProjectQueryInput = {}): Promise<
    ApiResponse<{
      items: ProjectCardDto[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>
  > {
    const params = new URLSearchParams();
    if (query.category) params.append('category', query.category);
    if (query.technology) params.append('technology', query.technology);
    if (query.search) params.append('search', query.search);
    if (query.status) params.append('status', query.status);
    if (query.visibility) params.append('visibility', query.visibility);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));

    const qs = params.toString();
    return apiClient.get(`/api/v1/projects${qs ? `?${qs}` : ''}`);
  },

  async getProjectDetail(slug: string): Promise<ApiResponse<ProjectDetailDto>> {
    return apiClient.get<ProjectDetailDto>(`/api/v1/projects/detail/${slug}`);
  },

  async createReport(input: CreateReportInput): Promise<ApiResponse<{ id: string; status: string }>> {
    return apiClient.post<{ id: string; status: string }>('/api/v1/projects/report', input);
  },

  // ============================================================================
  // MEMBER PROJECT MANAGEMENT
  // ============================================================================

  async getMemberProjects(): Promise<ApiResponse<ProjectCardDto[]>> {
    return apiClient.get<ProjectCardDto[]>('/api/v1/member/projects');
  },

  async createProject(input: CreateProjectInput): Promise<ApiResponse<ProjectDetailDto>> {
    return apiClient.post<ProjectDetailDto>('/api/v1/member/projects', input);
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<ApiResponse<ProjectDetailDto>> {
    return apiClient.patch<ProjectDetailDto>(`/api/v1/member/projects/${id}`, input);
  },

  async publishProject(id: string): Promise<ApiResponse<ProjectDetailDto>> {
    return apiClient.post<ProjectDetailDto>(`/api/v1/member/projects/${id}/publish`);
  },

  async archiveProject(id: string): Promise<ApiResponse<ProjectDetailDto>> {
    return apiClient.post<ProjectDetailDto>(`/api/v1/member/projects/${id}/archive`);
  },

  async deleteProject(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/member/projects/${id}`);
  },

  async addContributor(id: string, input: AddContributorInput): Promise<ApiResponse<ProjectDetailDto>> {
    return apiClient.post<ProjectDetailDto>(`/api/v1/member/projects/${id}/contributors`, input);
  },

  async removeContributor(id: string, userId: string): Promise<ApiResponse<ProjectDetailDto>> {
    return apiClient.delete<ProjectDetailDto>(`/api/v1/member/projects/${id}/contributors/${userId}`);
  },

  async addLink(id: string, input: AddLinkInput): Promise<ApiResponse<ProjectLinkRecord>> {
    return apiClient.post<ProjectLinkRecord>(`/api/v1/member/projects/${id}/links`, input);
  },

  async deleteLink(id: string, linkId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/member/projects/${id}/links/${linkId}`);
  },

  async addMedia(id: string, input: AddMediaInput): Promise<ApiResponse<ProjectMediaRecord>> {
    return apiClient.post<ProjectMediaRecord>(`/api/v1/member/projects/${id}/media`, input);
  },

  async deleteMedia(id: string, mediaId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/member/projects/${id}/media/${mediaId}`);
  },

  // ============================================================================
  // ACHIEVEMENTS
  // ============================================================================

  async getAchievementCategories(): Promise<ApiResponse<AchievementCategoryRecord[]>> {
    return apiClient.get<AchievementCategoryRecord[]>('/api/v1/achievements/categories');
  },

  async getAchievements(query: { userId?: string; categoryId?: string } = {}): Promise<ApiResponse<AchievementDto[]>> {
    const params = new URLSearchParams();
    if (query.userId) params.append('userId', query.userId);
    if (query.categoryId) params.append('categoryId', query.categoryId);
    const qs = params.toString();
    return apiClient.get<AchievementDto[]>(`/api/v1/achievements${qs ? `?${qs}` : ''}`);
  },

  async getMemberAchievements(): Promise<ApiResponse<AchievementDto[]>> {
    return apiClient.get<AchievementDto[]>('/api/v1/member/achievements');
  },

  async createAchievement(input: CreateAchievementInput): Promise<ApiResponse<AchievementDto>> {
    return apiClient.post<AchievementDto>('/api/v1/member/achievements', input);
  },

  async updateAchievement(id: string, input: UpdateAchievementInput): Promise<ApiResponse<AchievementDto>> {
    return apiClient.patch<AchievementDto>(`/api/v1/member/achievements/${id}`, input);
  },

  async deleteAchievement(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/member/achievements/${id}`);
  },

  // ============================================================================
  // ADMIN COMMUNITY MODERATION
  // ============================================================================

  async getAdminProjects(query: ProjectQueryInput = {}): Promise<
    ApiResponse<{ items: AdminProjectSummaryDto[]; total: number }>
  > {
    const params = new URLSearchParams();
    if (query.search) params.append('search', query.search);
    if (query.status) params.append('status', query.status);
    const qs = params.toString();
    return apiClient.get(`/api/v1/admin/community${qs ? `?${qs}` : ''}`);
  },

  async hideProject(id: string, reason: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/admin/community/${id}/hide`, { reason });
  },

  async restoreProject(id: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/admin/community/${id}/restore`);
  },

  async featureProject(id: string, position = 1, featuredUntil?: string | null): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/admin/community/${id}/feature`, { position, featuredUntil });
  },

  async unfeatureProject(id: string): Promise<ApiResponse<any>> {
    return apiClient.delete(`/api/v1/admin/community/${id}/feature`);
  },

  async getAdminReports(status?: string): Promise<ApiResponse<AdminReportDto[]>> {
    const qs = status ? `?status=${status}` : '';
    return apiClient.get<AdminReportDto[]>(`/api/v1/admin/community/reports${qs}`);
  },

  async resolveReport(id: string, status: 'resolved' | 'dismissed', adminNotes?: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/admin/community/reports/${id}/resolve`, { status, adminNotes });
  },

  async hideAchievement(id: string, reason: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/admin/achievements/${id}/hide`, { reason });
  },

  async restoreAchievement(id: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/admin/achievements/${id}/restore`);
  },
};
