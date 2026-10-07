import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';
import type {
  AdminApplicationItem,
  AdminApplicationQuery,
  AdminApplicationDetail,
  AdminDashboardSummary,
} from '@/types/admin';

export const adminApi = {
  /**
   * Fetch admin control center metrics and summary
   */
  async getDashboardSummary(): Promise<ApiResponse<AdminDashboardSummary>> {
    return apiClient.get<AdminDashboardSummary>('/api/v1/admin/dashboard/summary');
  },

  /**
   * Query applications with server-side filters, search, and pagination
   */
  async getApplications(
    query: AdminApplicationQuery = {}
  ): Promise<ApiResponse<AdminApplicationItem[]>> {
    const params = new URLSearchParams();
    if (query.status && query.status !== 'all') params.append('status', query.status);
    if (query.department && query.department !== 'all') params.append('department', query.department);
    if (query.search) params.append('search', query.search);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.order) params.append('order', query.order);
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));

    const qs = params.toString();
    const endpoint = `/api/v1/admin/applications${qs ? `?${qs}` : ''}`;
    return apiClient.get<AdminApplicationItem[]>(endpoint);
  },

  /**
   * Get single applicant detail dossier
   */
  async getApplicationDetail(id: string): Promise<ApiResponse<AdminApplicationDetail>> {
    return apiClient.get<AdminApplicationDetail>(`/api/v1/admin/applications/${id}`);
  },

  /**
   * Approve application
   */
  async approveApplication(
    id: string,
    reviewerNotes?: string
  ): Promise<ApiResponse<AdminApplicationDetail['application']>> {
    return apiClient.post<AdminApplicationDetail['application']>(
      `/api/v1/admin/applications/${id}/approve`,
      { reviewerNotes }
    );
  },

  /**
   * Waitlist application
   */
  async waitlistApplication(
    id: string,
    reviewerNotes?: string
  ): Promise<ApiResponse<AdminApplicationDetail['application']>> {
    return apiClient.post<AdminApplicationDetail['application']>(
      `/api/v1/admin/applications/${id}/waitlist`,
      { reviewerNotes }
    );
  },

  /**
   * Reject application
   */
  async rejectApplication(
    id: string,
    reason: string
  ): Promise<ApiResponse<AdminApplicationDetail['application']>> {
    return apiClient.post<AdminApplicationDetail['application']>(
      `/api/v1/admin/applications/${id}/reject`,
      { reason }
    );
  },
};
