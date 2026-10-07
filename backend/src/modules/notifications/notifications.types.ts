export type NotificationType =
  | 'APPLICATION_STATUS_CHANGED'
  | 'MEMBERSHIP_ACTIVATED'
  | 'EVENT_PUBLISHED'
  | 'EVENT_REGISTRATION_CONFIRMED'
  | 'EVENT_CANCELLED'
  | 'EVENT_REMINDER'
  | 'COURSE_PUBLISHED'
  | 'COURSE_ENROLLMENT_CONFIRMED'
  | 'COURSE_COMPLETED'
  | 'PROJECT_FEATURED'
  | 'PROJECT_MODERATION'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'ADMIN_ANNOUNCEMENT'
  | 'SYSTEM_ALERT'
  | 'NEW_APPLICATION'
  | 'NEW_REPORT'
  | 'COURSE_ACTIVITY_ALERT'
  | 'EVENT_ACTIVITY_ALERT';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferencesRecord {
  id: string;
  userId: string;
  applicationUpdates: boolean;
  membershipUpdates: boolean;
  eventUpdates: boolean;
  courseUpdates: boolean;
  communityUpdates: boolean;
  systemNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationQueryDto {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationListResponseDto {
  notifications: NotificationRecord[];
  total: number;
  unreadCount: number;
}
