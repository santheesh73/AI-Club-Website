import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';
import type { Application, ApplicationStatusResponse } from '@/types/application';

export const applicationApi = {
  /**
   * Submit or initialize club application for current user
   */
  async createApplication(): Promise<ApiResponse<Application>> {
    return apiClient.post<Application>('/api/v1/applications');
  },

  /**
   * Fetch current authenticated user's application
   */
  async getMyApplication(): Promise<ApiResponse<Application | null>> {
    return apiClient.get<Application | null>('/api/v1/applications/me');
  },

  /**
   * Fetch application lifecycle status and readiness summary
   */
  async getApplicationStatus(): Promise<ApiResponse<ApplicationStatusResponse>> {
    return apiClient.get<ApplicationStatusResponse>('/api/v1/applications/me/status');
  },
};
