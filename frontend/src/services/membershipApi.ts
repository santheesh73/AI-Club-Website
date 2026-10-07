import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';
import type {
  MembershipRecord,
  MemberDashboardData,
  MemberListItem,
} from '@/types/membership';

export const membershipApi = {
  /**
   * Fetch active membership for current user
   */
  async getMyMembership(): Promise<ApiResponse<MembershipRecord>> {
    return apiClient.get<MembershipRecord>('/api/v1/membership/me');
  },

  /**
   * Fetch comprehensive member dashboard data
   */
  async getMyDashboard(): Promise<ApiResponse<MemberDashboardData>> {
    return apiClient.get<MemberDashboardData>('/api/v1/membership/me/dashboard');
  },

  /**
   * Fetch member's linked application summary
   */
  async getMyApplication(): Promise<ApiResponse<MemberDashboardData['application']>> {
    return apiClient.get<MemberDashboardData['application']>('/api/v1/membership/me/application');
  },

  /**
   * Fetch member's final assessment result
   */
  async getMyAssessment(): Promise<ApiResponse<MemberDashboardData['assessment']>> {
    return apiClient.get<MemberDashboardData['assessment']>('/api/v1/membership/me/assessment');
  },

  /**
   * Admin: Activate membership for an approved application
   */
  async activateMembership(
    applicationId: string,
    notes?: string
  ): Promise<ApiResponse<{ membership: MembershipRecord; message: string }>> {
    return apiClient.post<{ membership: MembershipRecord; message: string }>(
      '/api/v1/admin/memberships/activate',
      { applicationId, notes }
    );
  },

  /**
   * Admin: Query list of active members
   */
  async getMembers(query: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  } = {}): Promise<ApiResponse<{ items: MemberListItem[]; total: number; page: number; pageSize: number }>> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));
    if (query.search) params.append('search', query.search);
    if (query.status) params.append('status', query.status);

    const qs = params.toString();
    return apiClient.get<{ items: MemberListItem[]; total: number; page: number; pageSize: number }>(
      `/api/v1/admin/members${qs ? `?${qs}` : ''}`
    );
  },
};
