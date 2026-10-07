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

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
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

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '12m' | 'all';

export interface PlatformOverviewMetrics {
  totalUsers: number;
  activeMembers: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalEvents: number;
  eventRegistrations: number;
  publishedCourses: number;
  courseEnrollments: number;
  completedCourses: number;
  publishedProjects: number;
  achievementsAwarded: number;
  openReports: number;
}

export interface MembershipGrowthPoint {
  date: string;
  count: number;
}

export interface MembershipAnalytics {
  totalMemberships: number;
  activeMemberships: number;
  suspendedMemberships: number;
  expiredMemberships: number;
  growth: MembershipGrowthPoint[];
  departmentBreakdown: { department: string; count: number }[];
}

export interface ApplicationAnalytics {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  waitlisted: number;
  rejected: number;
  assessmentCompletionCount: number;
  assessmentAverageScore: number;
  assessmentPassRate: number;
  applicationApprovalRate: number;
  conversionRate: number;
}

export interface EventAnalytics {
  totalEvents: number;
  publishedEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  cancellationCount: number;
  cancellationRate: number;
  popularEvents: {
    id: string;
    title: string;
    slug: string;
    registrations: number;
    capacity: number;
  }[];
}

export interface CourseAnalytics {
  publishedCourses: number;
  totalEnrollments: number;
  activeLearners: number;
  completedEnrollments: number;
  courseCompletionRate: number;
  averageProgressPercentage: number;
  mostEnrolledCourses: {
    id: string;
    title: string;
    slug: string;
    enrollments: number;
    completedCount: number;
  }[];
}

export interface CommunityAnalytics {
  publishedProjects: number;
  draftProjects: number;
  archivedProjects: number;
  featuredProjects: number;
  achievementsTotal: number;
  achievementsAwarded: number;
  openReports: number;
  resolvedReports: number;
  moderationActionsCount: number;
}

export interface EngagementAnalytics {
  activeMembersCount: number;
  weeklyActivePercentage: number;
  courseParticipationRate: number;
  eventParticipationRate: number;
  projectParticipationRate: number;
  topContributors: {
    userId: string;
    name: string;
    projectsCount: number;
    achievementsCount: number;
  }[];
}

export interface MemberLearningAnalytics {
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  lessonsCompletedCount: number;
  averageProgressPercentage: number;
  recentCourses: {
    courseId: string;
    title: string;
    slug: string;
    progressPercentage: number;
    status: string;
  }[];
}

export interface MemberActivityItem {
  id: string;
  type: 'APPLICATION' | 'MEMBERSHIP' | 'EVENT' | 'COURSE' | 'PROJECT' | 'ACHIEVEMENT';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export interface AiInsight {
  id: string;
  period: AnalyticsPeriod;
  summary: string;
  platformOverview: string;
  memberEngagement: string;
  learningInsights: string;
  eventInsights: string;
  communityInsights: string;
  recommendations: string[];
  metricsSnapshot: Partial<PlatformOverviewMetrics>;
  createdAt: string;
}
