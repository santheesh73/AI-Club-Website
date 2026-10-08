import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api';
import type {
  MemberEventCardDto,
  EventDetailDto,
  AdminEventSummaryDto,
  RegistrationAttendeeDto,
  CreateEventInput,
  UpdateEventInput,
  EventCategory,
  EventStatus,
  PublicEventDto,
  EventRegistrationRecord,
  EventRegistrationStatusDto,
} from '@/types/events';

export const eventsApi = {
  async getPublicEvents(query: {
    category?: EventCategory;
    timeline?: 'upcoming' | 'past' | 'all';
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResponse<PublicEventDto[]>> {
    const params = new URLSearchParams();
    if (query.category) params.set('category', query.category);
    if (query.timeline) params.set('timeline', query.timeline);
    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    const qs = params.toString();
    return apiClient.get<PublicEventDto[]>(`/api/v1/events${qs ? `?${qs}` : ''}`);
  },

  async getPublicEventBySlug(slug: string): Promise<ApiResponse<PublicEventDto>> {
    return apiClient.get<PublicEventDto>(`/api/v1/events/${encodeURIComponent(slug)}`);
  },

  async getPublicEventRegistration(eventId: string): Promise<ApiResponse<EventRegistrationStatusDto>> {
    return apiClient.get<EventRegistrationStatusDto>(`/api/v1/events/${encodeURIComponent(eventId)}/registration`);
  },

  async registerForPublicEvent(eventId: string): Promise<ApiResponse<EventRegistrationRecord>> {
    return apiClient.post<EventRegistrationRecord>(`/api/v1/events/${encodeURIComponent(eventId)}/register`);
  },

  async cancelPublicEventRegistration(eventId: string): Promise<ApiResponse<EventRegistrationRecord>> {
    return apiClient.delete<EventRegistrationRecord>(`/api/v1/events/${encodeURIComponent(eventId)}/registration`);
  },

  // ============================================================================
  // MEMBER API CALLS
  // ============================================================================

  /**
   * Fetch events catalogue for member discovery
   */
  async getMemberEvents(query: {
    category?: EventCategory;
    timeline?: 'upcoming' | 'past' | 'all';
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResponse<MemberEventCardDto[]>> {
    const params = new URLSearchParams();
    if (query.category) params.append('category', query.category);
    if (query.timeline) params.append('timeline', query.timeline);
    if (query.search) params.append('search', query.search);
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));

    const qs = params.toString();
    return apiClient.get<MemberEventCardDto[]>(`/api/v1/member/events${qs ? `?${qs}` : ''}`);
  },

  /**
   * Fetch single event detail by slug
   */
  async getMemberEventBySlug(slug: string): Promise<ApiResponse<EventDetailDto>> {
    return apiClient.get<EventDetailDto>(`/api/v1/member/events/${slug}`);
  },

  /**
   * Register active member for event
   */
  async registerForEvent(eventId: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return apiClient.post<{ id: string; status: string }>(`/api/v1/member/events/${eventId}/register`);
  },

  /**
   * Cancel event registration
   */
  async cancelRegistration(eventId: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return apiClient.delete<{ id: string; status: string }>(`/api/v1/member/events/${eventId}/registration`);
  },

  /**
   * Fetch member's registered events
   */
  async getMemberRegisteredEvents(): Promise<
    ApiResponse<{ upcoming: MemberEventCardDto[]; past: MemberEventCardDto[] }>
  > {
    return apiClient.get<{ upcoming: MemberEventCardDto[]; past: MemberEventCardDto[] }>(
      '/api/v1/member/events/registered'
    );
  },

  // ============================================================================
  // ADMIN API CALLS
  // ============================================================================

  /**
   * Admin: List events
   */
  async getAdminEvents(query: {
    category?: EventCategory;
    status?: EventStatus;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<AdminEventSummaryDto[]>> {
    const params = new URLSearchParams();
    if (query.category) params.append('category', query.category);
    if (query.status) params.append('status', query.status);
    if (query.search) params.append('search', query.search);
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString();
    return apiClient.get<AdminEventSummaryDto[]>(`/api/v1/admin/events${qs ? `?${qs}` : ''}`);
  },

  /**
   * Admin: Get event by ID
   */
  async getAdminEventById(id: string): Promise<ApiResponse<AdminEventSummaryDto>> {
    return apiClient.get<AdminEventSummaryDto>(`/api/v1/admin/events/${id}`);
  },

  /**
   * Admin: Create event
   */
  async createEvent(input: CreateEventInput): Promise<ApiResponse<AdminEventSummaryDto>> {
    return apiClient.post<AdminEventSummaryDto>('/api/v1/admin/events', input);
  },

  /**
   * Admin: Update event
   */
  async updateEvent(id: string, input: UpdateEventInput): Promise<ApiResponse<AdminEventSummaryDto>> {
    return apiClient.patch<AdminEventSummaryDto>(`/api/v1/admin/events/${id}`, input);
  },

  /**
   * Admin: Publish event
   */
  async publishEvent(id: string): Promise<ApiResponse<AdminEventSummaryDto>> {
    return apiClient.post<AdminEventSummaryDto>(`/api/v1/admin/events/${id}/publish`);
  },

  /**
   * Admin: Cancel event
   */
  async cancelEvent(id: string, cancellationReason: string): Promise<ApiResponse<AdminEventSummaryDto>> {
    return apiClient.post<AdminEventSummaryDto>(`/api/v1/admin/events/${id}/cancel`, { cancellationReason });
  },

  /**
   * Admin: Get registrations roster
   */
  async getEventRegistrations(id: string): Promise<ApiResponse<RegistrationAttendeeDto[]>> {
    return apiClient.get<RegistrationAttendeeDto[]>(`/api/v1/admin/events/${id}/registrations`);
  },
};
