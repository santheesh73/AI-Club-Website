import React, { useState, useEffect, useCallback } from 'react';
import { intelligenceApi } from '@/services/intelligenceApi';
import type {
  AnalyticsPeriod,
  PlatformOverviewMetrics,
  MembershipAnalytics,
  ApplicationAnalytics,
  EventAnalytics,
  CourseAnalytics,
  CommunityAnalytics,
  EngagementAnalytics,
} from '@/types/intelligence';
import { MetricCard } from '@/features/analytics/MetricCard';
import { AnalyticsChartCard } from '@/features/analytics/AnalyticsChartCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
  BarChart3,
  Users,
  Calendar,
  BookOpen,
  FolderGit2,
  Trophy,
  Activity,
  Award,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'memberships' | 'applications' | 'events' | 'courses' | 'community' | 'engagement'
  >('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [overview, setOverview] = useState<PlatformOverviewMetrics | null>(null);
  const [memberships, setMemberships] = useState<MembershipAnalytics | null>(null);
  const [applications, setApplications] = useState<ApplicationAnalytics | null>(null);
  const [events, setEvents] = useState<EventAnalytics | null>(null);
  const [courses, setCourses] = useState<CourseAnalytics | null>(null);
  const [community, setCommunity] = useState<CommunityAnalytics | null>(null);
  const [engagement, setEngagement] = useState<EngagementAnalytics | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        overviewRes,
        membershipsRes,
        applicationsRes,
        eventsRes,
        coursesRes,
        communityRes,
        engagementRes,
      ] = await Promise.all([
        intelligenceApi.getAdminOverview(period),
        intelligenceApi.getAdminMembershipsAnalytics(period),
        intelligenceApi.getAdminApplicationsAnalytics(period),
        intelligenceApi.getAdminEventsAnalytics(period),
        intelligenceApi.getAdminCoursesAnalytics(period),
        intelligenceApi.getAdminCommunityAnalytics(period),
        intelligenceApi.getAdminEngagementAnalytics(period),
      ]);

      if (overviewRes.success && overviewRes.data) setOverview(overviewRes.data);
      if (membershipsRes.success && membershipsRes.data) setMemberships(membershipsRes.data);
      if (applicationsRes.success && applicationsRes.data) setApplications(applicationsRes.data);
      if (eventsRes.success && eventsRes.data) setEvents(eventsRes.data);
      if (coursesRes.success && coursesRes.data) setCourses(coursesRes.data);
      if (communityRes.success && communityRes.data) setCommunity(communityRes.data);
      if (engagementRes.success && engagementRes.data) setEngagement(engagementRes.data);
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Title and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent-orange" />
            <span>Platform Analytics & Telemetry</span>
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Real-time authoritative metrics across memberships, admissions, curriculum, events, and community engagement.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-surface border border-surface-border p-1 rounded-pill self-start sm:self-auto">
          {(['7d', '30d', '90d', '12m', 'all'] as AnalyticsPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-pill transition-colors ${
                period === p
                  ? 'bg-ink text-canvas shadow-subtle'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-domain Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Platform Overview' },
          { id: 'memberships', label: 'Memberships' },
          { id: 'applications', label: 'Admissions' },
          { id: 'events', label: 'Events' },
          { id: 'courses', label: 'Courses & LMS' },
          { id: 'community', label: 'Projects & Badges' },
          { id: 'engagement', label: 'Engagement' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-pill transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-ink text-canvas shadow-subtle'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-ink-muted" />
          <p className="text-xs text-ink-muted mt-3">Synthesizing platform telemetry...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Platform Users"
                  value={overview.totalUsers}
                  subtext={`${overview.activeMembers} active members`}
                  icon={<Users className="w-5 h-5 text-indigo-600" />}
                />
                <MetricCard
                  label="Approved Applications"
                  value={overview.approvedApplications}
                  subtext={`${overview.pendingApplications} awaiting review`}
                  icon={<Award className="w-5 h-5 text-emerald-600" />}
                />
                <MetricCard
                  label="Event Registrations"
                  value={overview.eventRegistrations}
                  subtext={`across ${overview.totalEvents} events`}
                  icon={<Calendar className="w-5 h-5 text-purple-600" />}
                />
                <MetricCard
                  label="Course Enrollments"
                  value={overview.courseEnrollments}
                  subtext={`${overview.completedCourses} completed`}
                  icon={<BookOpen className="w-5 h-5 text-accent-orange" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnalyticsChartCard
                  title="Ecosystem Inventory"
                  description="Published artifacts across the AI CLUB platform"
                  items={[
                    { label: 'Published Courses', value: overview.publishedCourses, colorClass: 'bg-indigo-600' },
                    { label: 'Community Projects', value: overview.publishedProjects, colorClass: 'bg-emerald-600' },
                    { label: 'Achievements Unlocked', value: overview.achievementsAwarded, colorClass: 'bg-amber-500' },
                    { label: 'Open Moderation Flags', value: overview.openReports, colorClass: 'bg-rose-500' },
                  ]}
                />

                <AnalyticsChartCard
                  title="Admissions Funnel"
                  description="Applicant conversion pipeline"
                  items={[
                    { label: 'Total Users', value: overview.totalUsers, colorClass: 'bg-ink' },
                    { label: 'Approved Applicants', value: overview.approvedApplications, colorClass: 'bg-emerald-600' },
                    { label: 'Active Members', value: overview.activeMembers, colorClass: 'bg-accent-orange' },
                  ]}
                />

                <AnalyticsChartCard
                  title="Learning & Events Activity"
                  description="Participant volume summary"
                  items={[
                    { label: 'Event Registrations', value: overview.eventRegistrations, colorClass: 'bg-purple-600' },
                    { label: 'Course Enrollments', value: overview.courseEnrollments, colorClass: 'bg-indigo-600' },
                    { label: 'Completed Courses', value: overview.completedCourses, colorClass: 'bg-emerald-600' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERSHIPS */}
          {activeTab === 'memberships' && memberships && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Memberships"
                  value={memberships.totalMemberships}
                  subtext="Issued member IDs"
                  icon={<Users className="w-5 h-5 text-indigo-600" />}
                />
                <MetricCard
                  label="Active Members"
                  value={memberships.activeMemberships}
                  subtext="Full privileges"
                  icon={<Award className="w-5 h-5 text-emerald-600" />}
                />
                <MetricCard
                  label="Suspended Memberships"
                  value={memberships.suspendedMemberships}
                  subtext="Temporarily restricted"
                  icon={<Activity className="w-5 h-5 text-amber-500" />}
                />
                <MetricCard
                  label="Expired Memberships"
                  value={memberships.expiredMemberships}
                  subtext="Past validity"
                  icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsChartCard
                  title="Department Distribution"
                  description="Active members grouped by academic department"
                  items={memberships.departmentBreakdown.map((d) => ({
                    label: d.department,
                    value: d.count,
                    colorClass: 'bg-ink',
                  }))}
                />

                <AnalyticsChartCard
                  title="Membership Growth Timeline"
                  description="Cumulative membership creation"
                  items={memberships.growth.map((g) => ({
                    label: g.date,
                    value: g.count,
                    colorClass: 'bg-accent-orange',
                  }))}
                />
              </div>
            </div>
          )}

          {/* TAB 3: APPLICATIONS */}
          {activeTab === 'applications' && applications && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Applications"
                  value={applications.totalApplications}
                  subtext={`${applications.pendingReview} in review`}
                  icon={<Users className="w-5 h-5 text-indigo-600" />}
                />
                <MetricCard
                  label="Approval Rate"
                  value={`${applications.applicationApprovalRate}%`}
                  subtext={`${applications.approved} accepted`}
                  icon={<Percent className="w-5 h-5 text-emerald-600" />}
                />
                <MetricCard
                  label="Assessment Average"
                  value={`${applications.assessmentAverageScore}/25`}
                  subtext={`${applications.assessmentCompletionCount} tests taken`}
                  icon={<Award className="w-5 h-5 text-amber-500" />}
                />
                <MetricCard
                  label="MCQ Pass Rate"
                  value={`${applications.assessmentPassRate}%`}
                  subtext="Cutoff score achieved"
                  icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsChartCard
                  title="Application Decision Statuses"
                  description="Breakdown of candidate admissions disposition"
                  items={[
                    { label: 'Approved', value: applications.approved, colorClass: 'bg-emerald-600' },
                    { label: 'Pending Review', value: applications.pendingReview, colorClass: 'bg-amber-500' },
                    { label: 'Waitlisted', value: applications.waitlisted, colorClass: 'bg-blue-500' },
                    { label: 'Rejected', value: applications.rejected, colorClass: 'bg-rose-500' },
                  ]}
                />

                <Card className="p-5 flex flex-col justify-center">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-base font-semibold">Admissions Conversion Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="p-4 rounded-card-sm bg-canvas border border-surface-border">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Overall Conversion Rate</span>
                        <span className="font-bold text-base text-ink">{applications.conversionRate}%</span>
                      </div>
                      <p className="text-xs text-ink-muted mt-1">
                        Ratio of approved candidates successfully converted to certified club members.
                      </p>
                    </div>
                    <div className="p-4 rounded-card-sm bg-canvas border border-surface-border">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Assessment Completion Rate</span>
                        <span className="font-bold text-base text-ink">
                          {applications.totalApplications > 0
                            ? Math.round((applications.assessmentCompletionCount / applications.totalApplications) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-1">
                        Percentage of submitted applicants who completed the technical 25-MCQ exam.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 4: EVENTS */}
          {activeTab === 'events' && events && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Events"
                  value={events.totalEvents}
                  subtext={`${events.publishedEvents} published`}
                  icon={<Calendar className="w-5 h-5 text-indigo-600" />}
                />
                <MetricCard
                  label="Total Registrations"
                  value={events.totalRegistrations}
                  subtext="Attendee RSVPs"
                  icon={<Users className="w-5 h-5 text-emerald-600" />}
                />
                <MetricCard
                  label="Upcoming Events"
                  value={events.upcomingEvents}
                  subtext={`${events.completedEvents} completed`}
                  icon={<Activity className="w-5 h-5 text-amber-500" />}
                />
                <MetricCard
                  label="Cancellation Rate"
                  value={`${events.cancellationRate}%`}
                  subtext={`${events.cancellationCount} cancelled`}
                  icon={<Percent className="w-5 h-5 text-rose-500" />}
                />
              </div>

              <AnalyticsChartCard
                title="Top Attended Events"
                description="Events ranked by registered attendee counts"
                items={events.popularEvents.map((e) => ({
                  label: e.title,
                  value: e.registrations,
                  sublabel: `Cap: ${e.capacity}`,
                  colorClass: 'bg-purple-600',
                }))}
              />
            </div>
          )}

          {/* TAB 5: COURSES */}
          {activeTab === 'courses' && courses && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Published Courses"
                  value={courses.publishedCourses}
                  subtext="Curriculums available"
                  icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
                />
                <MetricCard
                  label="Total Enrollments"
                  value={courses.totalEnrollments}
                  subtext={`${courses.activeLearners} active learners`}
                  icon={<Users className="w-5 h-5 text-emerald-600" />}
                />
                <MetricCard
                  label="Completion Rate"
                  value={`${courses.courseCompletionRate}%`}
                  subtext={`${courses.completedEnrollments} certified`}
                  icon={<Award className="w-5 h-5 text-amber-500" />}
                />
                <MetricCard
                  label="Average Progress"
                  value={`${courses.averageProgressPercentage}%`}
                  subtext="Across all enrolled learners"
                  icon={<Percent className="w-5 h-5 text-accent-orange" />}
                />
              </div>

              <AnalyticsChartCard
                title="Most Popular Courses"
                description="Courses ranked by active enrollment counts"
                items={courses.mostEnrolledCourses.map((c) => ({
                  label: c.title,
                  value: c.enrollments,
                  sublabel: `${c.completedCount} completed`,
                  colorClass: 'bg-indigo-600',
                }))}
              />
            </div>
          )}

          {/* TAB 6: COMMUNITY */}
          {activeTab === 'community' && community && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Published Projects"
                  value={community.publishedProjects}
                  subtext={`${community.featuredProjects} featured`}
                  icon={<FolderGit2 className="w-5 h-5 text-indigo-600" />}
                />
                <MetricCard
                  label="Achievements Awarded"
                  value={community.achievementsAwarded}
                  subtext={`out of ${community.achievementsTotal} badges`}
                  icon={<Trophy className="w-5 h-5 text-amber-500" />}
                />
                <MetricCard
                  label="Open Reports"
                  value={community.openReports}
                  subtext="Pending moderation"
                  icon={<Activity className="w-5 h-5 text-rose-500" />}
                />
                <MetricCard
                  label="Moderation Actions"
                  value={community.moderationActionsCount}
                  subtext={`${community.resolvedReports} resolved`}
                  icon={<Award className="w-5 h-5 text-emerald-600" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsChartCard
                  title="Project Publication Statuses"
                  description="Repository states in showcase"
                  items={[
                    { label: 'Published', value: community.publishedProjects, colorClass: 'bg-emerald-600' },
                    { label: 'Draft', value: community.draftProjects, colorClass: 'bg-amber-500' },
                    { label: 'Archived', value: community.archivedProjects, colorClass: 'bg-ink-muted' },
                    { label: 'Featured Spotlight', value: community.featuredProjects, colorClass: 'bg-accent-orange' },
                  ]}
                />

                <AnalyticsChartCard
                  title="Moderation & Safety"
                  description="Community safety and report resolution"
                  items={[
                    { label: 'Resolved Reports', value: community.resolvedReports, colorClass: 'bg-emerald-600' },
                    { label: 'Open Reports', value: community.openReports, colorClass: 'bg-rose-500' },
                    { label: 'Moderation Actions Taken', value: community.moderationActionsCount, colorClass: 'bg-ink' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* TAB 7: ENGAGEMENT */}
          {activeTab === 'engagement' && engagement && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Active Members"
                  value={engagement.activeMembersCount}
                  subtext="Participating members"
                  icon={<Users className="w-5 h-5 text-indigo-600" />}
                />
                <MetricCard
                  label="Weekly Active %"
                  value={`${engagement.weeklyActivePercentage}%`}
                  subtext="Engagement frequency"
                  icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                />
                <MetricCard
                  label="Event Participation"
                  value={`${engagement.eventParticipationRate}%`}
                  subtext="Member event registration"
                  icon={<Calendar className="w-5 h-5 text-purple-600" />}
                />
                <MetricCard
                  label="Course Participation"
                  value={`${engagement.courseParticipationRate}%`}
                  subtext="Member course enrollment"
                  icon={<BookOpen className="w-5 h-5 text-accent-orange" />}
                />
              </div>

              <AnalyticsChartCard
                title="Top Member Contributors"
                description="Members ranked by combined projects and earned achievements"
                items={engagement.topContributors.map((c) => ({
                  label: c.name,
                  value: c.projectsCount + c.achievementsCount,
                  sublabel: `${c.projectsCount} proj, ${c.achievementsCount} badges`,
                  colorClass: 'bg-accent-orange',
                }))}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
