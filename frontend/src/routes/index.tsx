import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ApplicantLayout } from '@/components/layout/ApplicantLayout';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RouteGuard } from '@/routes/RouteGuard';
import { LandingPage } from '@/pages/public/LandingPage';
const AboutPage = React.lazy(() => import('@/pages/public/AboutPage').then(module => ({ default: module.AboutPage })));
const LearnPage = React.lazy(() => import('@/pages/public/LearnPage').then(module => ({ default: module.LearnPage })));
const EventsPage = React.lazy(() => import('@/pages/public/EventsPage').then(module => ({ default: module.EventsPage })));
const PublicEventDetailPage = React.lazy(() => import('@/pages/public/PublicEventDetailPage').then(module => ({ default: module.PublicEventDetailPage })));

const LoginPage = React.lazy(() => import('@/pages/public/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = React.lazy(() => import('@/pages/public/RegisterPage').then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('@/pages/public/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ApplicantDashboard = React.lazy(() => import('@/pages/applicant/ApplicantDashboard').then(module => ({ default: module.ApplicantDashboard })));
const ApplicationPage = React.lazy(() => import('@/pages/applicant/ApplicationPage').then(module => ({ default: module.ApplicationPage })));
const AssessmentPage = React.lazy(() => import('@/pages/applicant/AssessmentPage').then(module => ({ default: module.AssessmentPage })));
const AssessmentResultPage = React.lazy(() => import('@/pages/applicant/AssessmentResultPage').then(module => ({ default: module.AssessmentResultPage })));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminApplicationsPage = React.lazy(() => import('@/pages/admin/AdminApplicationsPage').then(module => ({ default: module.AdminApplicationsPage })));
const AdminApplicationDetailPage = React.lazy(() => import('@/pages/admin/AdminApplicationDetailPage').then(module => ({ default: module.AdminApplicationDetailPage })));
const AdminMembersPage = React.lazy(() => import('@/pages/admin/AdminMembersPage').then(module => ({ default: module.AdminMembersPage })));
const AdminAnnouncementsPage = React.lazy(() => import('@/pages/admin/AdminAnnouncementsPage').then(module => ({ default: module.AdminAnnouncementsPage })));
const AdminAuditLogsPage = React.lazy(() => import('@/pages/admin/AdminAuditLogsPage').then(module => ({ default: module.AdminAuditLogsPage })));
const AdminSettingsPage = React.lazy(() => import('@/pages/admin/AdminSettingsPage').then(module => ({ default: module.AdminSettingsPage })));
const MemberDashboard = React.lazy(() => import('@/pages/member/MemberDashboard').then(module => ({ default: module.MemberDashboard })));
const MemberMembershipPage = React.lazy(() => import('@/pages/member/MemberMembershipPage').then(module => ({ default: module.MemberMembershipPage })));
const MemberProfilePage = React.lazy(() => import('@/pages/member/MemberProfilePage').then(module => ({ default: module.MemberProfilePage })));
const MemberApplicationPage = React.lazy(() => import('@/pages/member/MemberApplicationPage').then(module => ({ default: module.MemberApplicationPage })));
const MemberAssessmentPage = React.lazy(() => import('@/pages/member/MemberAssessmentPage').then(module => ({ default: module.MemberAssessmentPage })));
const MemberEventsPage = React.lazy(() => import('@/pages/member/MemberEventsPage').then(module => ({ default: module.MemberEventsPage })));
const MemberEventDetailPage = React.lazy(() => import('@/pages/member/MemberEventDetailPage').then(module => ({ default: module.MemberEventDetailPage })));
const AdminEventsPage = React.lazy(() => import('@/pages/admin/AdminEventsPage').then(module => ({ default: module.AdminEventsPage })));
const AdminEventCreatePage = React.lazy(() => import('@/pages/admin/AdminEventCreatePage').then(module => ({ default: module.AdminEventCreatePage })));
const AdminEventEditPage = React.lazy(() => import('@/pages/admin/AdminEventEditPage').then(module => ({ default: module.AdminEventEditPage })));
const AdminEventRegistrationsPage = React.lazy(() => import('@/pages/admin/AdminEventRegistrationsPage').then(module => ({ default: module.AdminEventRegistrationsPage })));
const MemberCoursesPage = React.lazy(() => import('@/pages/member/MemberCoursesPage').then(module => ({ default: module.MemberCoursesPage })));
const MemberCourseDetailPage = React.lazy(() => import('@/pages/member/MemberCourseDetailPage').then(module => ({ default: module.MemberCourseDetailPage })));
const MemberMyCoursesPage = React.lazy(() => import('@/pages/member/MemberMyCoursesPage').then(module => ({ default: module.MemberMyCoursesPage })));
const MemberLearningPage = React.lazy(() => import('@/pages/member/MemberLearningPage').then(module => ({ default: module.MemberLearningPage })));
const AdminCoursesPage = React.lazy(() => import('@/pages/admin/AdminCoursesPage').then(module => ({ default: module.AdminCoursesPage })));
const AdminExternalCoursesPage = React.lazy(() => import('@/pages/admin/AdminExternalCoursesPage').then(module => ({ default: module.AdminExternalCoursesPage })));
const AdminCourseCreatePage = React.lazy(() => import('@/pages/admin/AdminCourseCreatePage').then(module => ({ default: module.AdminCourseCreatePage })));
const AdminCourseEditPage = React.lazy(() => import('@/pages/admin/AdminCourseEditPage').then(module => ({ default: module.AdminCourseEditPage })));
const AdminCourseEnrollmentsPage = React.lazy(() => import('@/pages/admin/AdminCourseEnrollmentsPage').then(module => ({ default: module.AdminCourseEnrollmentsPage })));

const MemberProjectsPage = React.lazy(() => import('@/pages/member/MemberProjectsPage').then(module => ({ default: module.MemberProjectsPage })));
const MemberProjectCreatePage = React.lazy(() => import('@/pages/member/MemberProjectCreatePage').then(module => ({ default: module.MemberProjectCreatePage })));
const MemberProjectEditPage = React.lazy(() => import('@/pages/member/MemberProjectEditPage').then(module => ({ default: module.MemberProjectEditPage })));
const MemberAchievementsPage = React.lazy(() => import('@/pages/member/MemberAchievementsPage').then(module => ({ default: module.MemberAchievementsPage })));
const CommunityProjectsPage = React.lazy(() => import('@/pages/community/CommunityProjectsPage').then(module => ({ default: module.CommunityProjectsPage })));
const ProjectDetailPage = React.lazy(() => import('@/pages/community/ProjectDetailPage').then(module => ({ default: module.ProjectDetailPage })));
const AdminCommunityPage = React.lazy(() => import('@/pages/admin/AdminCommunityPage').then(module => ({ default: module.AdminCommunityPage })));
const MemberNotificationsPage = React.lazy(() => import('@/pages/member/MemberNotificationsPage').then(module => ({ default: module.MemberNotificationsPage })));
const MemberActivityPage = React.lazy(() => import('@/pages/member/MemberActivityPage').then(module => ({ default: module.MemberActivityPage })));
const MemberLearningAnalyticsPage = React.lazy(() => import('@/pages/member/MemberLearningAnalyticsPage').then(module => ({ default: module.MemberLearningAnalyticsPage })));
const MemberAiPage = React.lazy(() => import('@/pages/member/MemberAiPage').then(module => ({ default: module.MemberAiPage })));
const AdminNotificationsPage = React.lazy(() => import('@/pages/admin/AdminNotificationsPage').then(module => ({ default: module.AdminNotificationsPage })));
const AdminAnalyticsPage = React.lazy(() => import('@/pages/admin/AdminAnalyticsPage').then(module => ({ default: module.AdminAnalyticsPage })));
const AdminIntelligencePage = React.lazy(() => import('@/pages/admin/AdminIntelligencePage').then(module => ({ default: module.AdminIntelligencePage })));
const AdminAssessmentPage = React.lazy(() => import('@/pages/admin/AdminAssessmentPage').then(module => ({ default: module.AdminAssessmentPage })));
import { useAuth } from '@/features/auth';

const ProfileRouteHandler: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  if (profile?.role === 'member') {
    return <Navigate to="/member/profile" replace />;
  }
  // Applicants have no separate profile page; they go directly to assessment
  return <Navigate to="/applicant/assessment" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={<div role="status" className="px-6 py-12 text-ink-secondary">Loading page…</div>}>
    <Routes>
      {/* ================= PUBLIC & AUTH ROUTES ================= */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:slug" element={<PublicEventDetailPage />} />
        <Route path="/projects" element={<CommunityProjectsPage />} />
        <Route path="/community" element={<CommunityProjectsPage />} />
        <Route path="/community/projects" element={<CommunityProjectsPage />} />
        <Route path="/community/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/join" element={<Navigate to="/register" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/profile"
          element={
            <RouteGuard>
              <ProfileRouteHandler />
            </RouteGuard>
          }
        />
      </Route>

      {/* ================= APPLICANT FLOW ROUTES ================= */}
      <Route
        path="/applicant"
        element={
          <RouteGuard requiredRole="applicant">
            <ApplicantLayout />
          </RouteGuard>
        }
      >
        <Route index element={<ApplicantDashboard />} />
        <Route path="dashboard" element={<ApplicantDashboard />} />
        <Route path="profile" element={<Navigate to="/applicant/assessment" replace />} />
        <Route path="apply" element={<ApplicationPage />} />
        <Route path="application" element={<ApplicationPage />} />
        <Route path="assessment" element={<AssessmentPage />} />
        <Route path="assessment/result" element={<AssessmentResultPage />} />
        <Route path="result" element={<AssessmentResultPage />} />
      </Route>

      {/* ================= MEMBER PORTAL ROUTES ================= */}
      <Route
        path="/member"
        element={
          <RouteGuard requiredRole="member">
            <MemberLayout />
          </RouteGuard>
        }
      >
        <Route index element={<MemberDashboard />} />
        <Route path="dashboard" element={<MemberDashboard />} />
        <Route path="profile" element={<MemberProfilePage />} />
        <Route path="membership" element={<MemberMembershipPage />} />
        <Route path="application" element={<MemberApplicationPage />} />
        <Route path="assessment" element={<MemberAssessmentPage />} />
        <Route path="events" element={<MemberEventsPage />} />
        <Route path="events/:slug" element={<MemberEventDetailPage />} />
        <Route path="courses" element={<MemberCoursesPage />} />
        <Route path="courses/:slug" element={<MemberCourseDetailPage />} />
        <Route path="my-courses" element={<MemberMyCoursesPage />} />
        <Route path="projects" element={<MemberProjectsPage />} />
        <Route path="projects/new" element={<MemberProjectCreatePage />} />
        <Route path="projects/:id/edit" element={<MemberProjectEditPage />} />
        <Route path="achievements" element={<MemberAchievementsPage />} />
        <Route path="notifications" element={<MemberNotificationsPage />} />
        <Route path="activity" element={<MemberActivityPage />} />
        <Route path="learning" element={<MemberLearningAnalyticsPage />} />
        <Route path="ai" element={<MemberAiPage />} />
      </Route>

      {/* ================= ADMIN ROUTES ================= */}
      <Route
        path="/admin"
        element={
          <RouteGuard requiredRole="admin">
            <AdminLayout />
          </RouteGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="assessment" element={<AdminAssessmentPage />} />
        <Route path="questions" element={<AdminAssessmentPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="applications/:id" element={<AdminApplicationDetailPage />} />
        <Route path="members" element={<AdminMembersPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="events/new" element={<AdminEventCreatePage />} />
        <Route path="events/:id/edit" element={<AdminEventEditPage />} />
        <Route path="events/:id/registrations" element={<AdminEventRegistrationsPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="external-courses" element={<AdminExternalCoursesPage />} />
        <Route path="courses/new" element={<AdminCourseCreatePage />} />

        <Route path="courses/:id" element={<AdminCourseEditPage />} />
        <Route path="courses/:id/enrollments" element={<AdminCourseEnrollmentsPage />} />
        <Route path="projects" element={<AdminCommunityPage />} />
        <Route path="community" element={<AdminCommunityPage />} />
        <Route path="achievements" element={<AdminCommunityPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="intelligence" element={<AdminIntelligencePage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* ================= DISTRACTION-FREE LEARNING ROUTE ================= */}
      <Route
        path="/member/learn/:courseSlug"
        element={
          <RouteGuard requiredRole="member">
            <MemberLearningPage />
          </RouteGuard>
        }
      />

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </React.Suspense>
  );
};
