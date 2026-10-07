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

export interface MembershipAnalyticsDto {
  totalMemberships: number;
  activeMemberships: number;
  suspendedMemberships: number;
  expiredMemberships: number;
  growth: MembershipGrowthPoint[];
  departmentBreakdown: { department: string; count: number }[];
}

export interface ApplicationAnalyticsDto {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  waitlisted: number;
  rejected: number;
  assessmentCompletionCount: number;
  assessmentAverageScore: number;
  assessmentPassRate: number; // passed / tested
  applicationApprovalRate: number; // approved / total
  conversionRate: number; // activated memberships / approved apps
}

export interface EventAnalyticsDto {
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

export interface CourseAnalyticsDto {
  publishedCourses: number;
  totalEnrollments: number;
  activeLearners: number;
  completedEnrollments: number;
  courseCompletionRate: number; // completed / total enrollments
  averageProgressPercentage: number;
  mostEnrolledCourses: {
    id: string;
    title: string;
    slug: string;
    enrollments: number;
    completedCount: number;
  }[];
}

export interface CommunityAnalyticsDto {
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

export interface EngagementAnalyticsDto {
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

export interface MemberLearningAnalyticsDto {
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

export interface MemberActivityItemDto {
  id: string;
  type: 'APPLICATION' | 'MEMBERSHIP' | 'EVENT' | 'COURSE' | 'PROJECT' | 'ACHIEVEMENT';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}
