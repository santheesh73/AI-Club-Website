import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';
import type {
  NotificationItem,
  NotificationPreferences,
  NotificationListResponse,
  AnalyticsPeriod,
  PlatformOverviewMetrics,
  MembershipAnalytics,
  ApplicationAnalytics,
  EventAnalytics,
  CourseAnalytics,
  CommunityAnalytics,
  EngagementAnalytics,
  MemberLearningAnalytics,
  MemberActivityItem,
  AiInsight,
} from '@/types/intelligence';

export const intelligenceApi = {
  // ============================================================================
  // NOTIFICATIONS (MEMBER & UNIVERSAL)
  // ============================================================================

  async getNotifications(
    unreadOnly = false,
    limit = 20,
    offset = 0
  ): Promise<ApiResponse<NotificationListResponse>> {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unreadOnly', 'true');
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    return apiClient.get<NotificationListResponse>(`/api/v1/notifications?${params.toString()}`);
  },

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return apiClient.get<{ unreadCount: number }>('/api/v1/notifications/unread-count');
  },

  async markAsRead(notificationId: string): Promise<ApiResponse<{ id: string; readAt: string }>> {
    return apiClient.patch<{ id: string; readAt: string }>(
      `/api/v1/notifications/${notificationId}/read`
    );
  },

  async markAllAsRead(): Promise<ApiResponse<{ updatedCount: number }>> {
    return apiClient.patch<{ updatedCount: number }>('/api/v1/notifications/read-all');
  },

  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.get<NotificationPreferences>('/api/v1/notifications/preferences');
  },

  async updatePreferences(
    preferences: Partial<
      Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >
  ): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.patch<NotificationPreferences>(
      '/api/v1/notifications/preferences',
      preferences
    );
  },

  // ============================================================================
  // MEMBER ANALYTICS & ACTIVITY
  // ============================================================================

  async getMemberLearningAnalytics(): Promise<ApiResponse<MemberLearningAnalytics>> {
    return apiClient.get<MemberLearningAnalytics>('/api/v1/member/analytics/learning');
  },

  async getMemberActivityTimeline(): Promise<ApiResponse<MemberActivityItem[]>> {
    return apiClient.get<MemberActivityItem[]>('/api/v1/member/analytics/activity');
  },

  // ============================================================================
  // ADMIN NOTIFICATIONS & BROADCAST
  // ============================================================================

  async getAdminNotifications(
    type?: string,
    limit = 50,
    offset = 0
  ): Promise<ApiResponse<{ notifications: NotificationItem[]; total: number }>> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    return apiClient.get<{ notifications: NotificationItem[]; total: number }>(
      `/api/v1/admin/notifications?${params.toString()}`
    );
  },

  async broadcastAnnouncement(data: {
    title: string;
    message: string;
    targetRole?: 'all' | 'member' | 'admin';
  }): Promise<ApiResponse<{ count: number }>> {
    return apiClient.post<{ count: number }>('/api/v1/admin/notifications/announcement', data);
  },

  // ============================================================================
  // ADMIN ANALYTICS TELEMETRY
  // ============================================================================

  async getAdminOverview(
    period: AnalyticsPeriod = '30d'
  ): Promise<ApiResponse<PlatformOverviewMetrics>> {
    return apiClient.get<PlatformOverviewMetrics>(
      `/api/v1/admin/analytics/overview?period=${period}`
    );
  },

  async getAdminMembershipsAnalytics(
    period: AnalyticsPeriod = '30d'
  ): Promise<ApiResponse<MembershipAnalytics>> {
    return apiClient.get<MembershipAnalytics>(
      `/api/v1/admin/analytics/memberships?period=${period}`
    );
  },

  async getAdminApplicationsAnalytics(
    period: AnalyticsPeriod = '30d'
  ): Promise<ApiResponse<ApplicationAnalytics>> {
    return apiClient.get<ApplicationAnalytics>(
      `/api/v1/admin/analytics/applications?period=${period}`
    );
  },

  async getAdminEventsAnalytics(
    period: AnalyticsPeriod = '30d'
  ): Promise<ApiResponse<EventAnalytics>> {
    return apiClient.get<EventAnalytics>(`/api/v1/admin/analytics/events?period=${period}`);
  },

  async getAdminCoursesAnalytics(
    period: AnalyticsPeriod = '30d'
  ): Promise<ApiResponse<CourseAnalytics>> {
    return apiClient.get<CourseAnalytics>(`/api/v1/admin/analytics/courses?period=${period}`);
  },

  async getAdminCommunityAnalytics(
    period: AnalyticsPeriod = '30d'
  ): Promise<ApiResponse<CommunityAnalytics>> {
    return apiClient.get<CommunityAnalytics>(
      `/api/v1/admin/analytics/community?period=${period}`
    );
  },

  async getAdminEngagementAnalytics(
    period: AnalyticsPeriod = '30d'
  ): Promise<ApiResponse<EngagementAnalytics>> {
    return apiClient.get<EngagementAnalytics>(
      `/api/v1/admin/analytics/engagement?period=${period}`
    );
  },

  // ============================================================================
  // ADMIN AI ADVISORY INTELLIGENCE
  // ============================================================================

  async getAdminIntelligence(period: AnalyticsPeriod = '30d'): Promise<ApiResponse<AiInsight>> {
    return apiClient.get<AiInsight>(`/api/v1/admin/intelligence?period=${period}`);
  },

  async refreshAdminIntelligence(period: AnalyticsPeriod = '30d'): Promise<ApiResponse<AiInsight>> {
    return apiClient.post<AiInsight>('/api/v1/admin/intelligence/refresh', { period });
  },
};
