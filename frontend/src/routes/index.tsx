import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ApplicantLayout } from '@/components/layout/ApplicantLayout';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RouteGuard } from '@/routes/RouteGuard';
import { LandingPage } from '@/pages/public/LandingPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { LearnPage } from '@/pages/public/LearnPage';
import { EventsPage } from '@/pages/public/EventsPage';

import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';
import { ProfilePage } from '@/pages/applicant/ProfilePage';
import { ApplicantDashboard } from '@/pages/applicant/ApplicantDashboard';
import { ApplicationPage } from '@/pages/applicant/ApplicationPage';
import { AssessmentPage } from '@/pages/applicant/AssessmentPage';
import { AssessmentResultPage } from '@/pages/applicant/AssessmentResultPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminApplicationsPage } from '@/pages/admin/AdminApplicationsPage';
import { AdminApplicationDetailPage } from '@/pages/admin/AdminApplicationDetailPage';
import { AdminMembersPage } from '@/pages/admin/AdminMembersPage';
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { MemberDashboard } from '@/pages/member/MemberDashboard';
import { MemberMembershipPage } from '@/pages/member/MemberMembershipPage';
import { MemberProfilePage } from '@/pages/member/MemberProfilePage';
import { MemberApplicationPage } from '@/pages/member/MemberApplicationPage';
import { MemberAssessmentPage } from '@/pages/member/MemberAssessmentPage';
import { MemberEventsPage } from '@/pages/member/MemberEventsPage';
import { MemberEventDetailPage } from '@/pages/member/MemberEventDetailPage';
import { AdminEventsPage } from '@/pages/admin/AdminEventsPage';
import { AdminEventCreatePage } from '@/pages/admin/AdminEventCreatePage';
import { AdminEventEditPage } from '@/pages/admin/AdminEventEditPage';
import { AdminEventRegistrationsPage } from '@/pages/admin/AdminEventRegistrationsPage';
import { MemberCoursesPage } from '@/pages/member/MemberCoursesPage';
import { MemberCourseDetailPage } from '@/pages/member/MemberCourseDetailPage';
import { MemberMyCoursesPage } from '@/pages/member/MemberMyCoursesPage';
import { MemberLearningPage } from '@/pages/member/MemberLearningPage';
import { AdminCoursesPage } from '@/pages/admin/AdminCoursesPage';
import { AdminCourseCreatePage } from '@/pages/admin/AdminCourseCreatePage';
import { AdminCourseEditPage } from '@/pages/admin/AdminCourseEditPage';
import { AdminCourseEnrollmentsPage } from '@/pages/admin/AdminCourseEnrollmentsPage';
import { MemberProjectsPage } from '@/pages/member/MemberProjectsPage';
import { MemberProjectCreatePage } from '@/pages/member/MemberProjectCreatePage';
import { MemberProjectEditPage } from '@/pages/member/MemberProjectEditPage';
import { MemberAchievementsPage } from '@/pages/member/MemberAchievementsPage';
import { CommunityProjectsPage } from '@/pages/community/CommunityProjectsPage';
import { ProjectDetailPage } from '@/pages/community/ProjectDetailPage';
import { AdminCommunityPage } from '@/pages/admin/AdminCommunityPage';
import { MemberNotificationsPage } from '@/pages/member/MemberNotificationsPage';
import { MemberActivityPage } from '@/pages/member/MemberActivityPage';
import { MemberLearningAnalyticsPage } from '@/pages/member/MemberLearningAnalyticsPage';
import { MemberAiPage } from '@/pages/member/MemberAiPage';
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminIntelligencePage } from '@/pages/admin/AdminIntelligencePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ================= PUBLIC & AUTH ROUTES ================= */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/events" element={<EventsPage />} />
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
              <ProfilePage />
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
        <Route path="profile" element={<ProfilePage />} />
        <Route path="apply" element={<ApplicationPage />} />
        <Route path="assessment" element={<AssessmentPage />} />
        <Route path="assessment/result" element={<AssessmentResultPage />} />
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
        <Route path="events/:id" element={<MemberEventDetailPage />} />
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
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="applications/:id" element={<AdminApplicationDetailPage />} />
        <Route path="members" element={<AdminMembersPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="events/new" element={<AdminEventCreatePage />} />
        <Route path="events/:id/edit" element={<AdminEventEditPage />} />
        <Route path="events/:id/registrations" element={<AdminEventRegistrationsPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
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
  );
};
