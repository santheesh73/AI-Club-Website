import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ApplicantLayout } from '@/components/layout/ApplicantLayout';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RouteGuard } from '@/routes/RouteGuard';
import { LandingPage } from '@/pages/public/LandingPage';
import { MilestonePlaceholder } from '@/components/shared/MilestonePlaceholder';

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
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminIntelligencePage } from '@/pages/admin/AdminIntelligencePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ================= PUBLIC & AUTH ROUTES ================= */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/about"
          element={
            <MilestonePlaceholder
              title="About AI CLUB"
              milestone="Milestone 2: Public Experience"
              description="Platform mission, leadership, research ethos, and community charter."
            />
          }
        />
        <Route
          path="/learn"
          element={
            <MilestonePlaceholder
              title="Learning Curriculum"
              milestone="Milestone 2: Public Experience"
              description="Curriculum pathways, foundational courses, and technical workshops."
            />
          }
        />
        <Route
          path="/events"
          element={
            <MilestonePlaceholder
              title="Community Events"
              milestone="Milestone 2: Public Experience"
              description="Keynotes, hackathons, engineering seminars, and community meetups."
            />
          }
        />
        <Route path="/projects" element={<CommunityProjectsPage />} />
        <Route path="/community" element={<CommunityProjectsPage />} />
        <Route path="/community/projects" element={<CommunityProjectsPage />} />
        <Route path="/community/projects/:slug" element={<ProjectDetailPage />} />
        <Route
          path="/join"
          element={
            <MilestonePlaceholder
              title="Join AI CLUB"
              milestone="Milestone 3: Applicant Flow"
              description="Membership admission intake, qualifications, and registration portal."
            />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/profile"
          element={
            <RouteGuard requiredRole="authenticated">
              <ProfilePage />
            </RouteGuard>
          }
        />
      </Route>

      {/* ================= APPLICANT ROUTES ================= */}
      <Route
        path="/applicant"
        element={
          <RouteGuard requiredRole="applicant">
            <ApplicantLayout />
          </RouteGuard>
        }
      >
        <Route index element={<ApplicantDashboard />} />
        <Route path="application" element={<ApplicationPage />} />
        <Route path="assessment" element={<AssessmentPage />} />
        <Route path="result" element={<AssessmentResultPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ================= MEMBER ROUTES ================= */}
      <Route
        path="/member"
        element={
          <RouteGuard requiredRole="member">
            <MemberLayout />
          </RouteGuard>
        }
      >
        <Route index element={<MemberDashboard />} />
        <Route path="profile" element={<MemberProfilePage />} />
        <Route path="membership" element={<MemberMembershipPage />} />
        <Route path="application" element={<MemberApplicationPage />} />
        <Route path="assessment" element={<MemberAssessmentPage />} />
        <Route path="courses" element={<MemberCoursesPage />} />
        <Route path="courses/my" element={<MemberMyCoursesPage />} />
        <Route path="courses/:slug" element={<MemberCourseDetailPage />} />
        <Route path="events" element={<MemberEventsPage />} />
        <Route path="events/:slug" element={<MemberEventDetailPage />} />
        <Route path="projects" element={<MemberProjectsPage />} />
        <Route path="projects/new" element={<MemberProjectCreatePage />} />
        <Route path="projects/:id/edit" element={<MemberProjectEditPage />} />
        <Route
          path="community"
          element={<CommunityProjectsPage />}
        />
        <Route path="achievements" element={<MemberAchievementsPage />} />
        <Route path="notifications" element={<MemberNotificationsPage />} />
        <Route path="activity" element={<MemberActivityPage />} />
        <Route path="learning" element={<MemberLearningAnalyticsPage />} />
        <Route
          path="ai"
          element={
            <MilestonePlaceholder
              title="AI Learning Assistant"
              milestone="Milestone 9: AI Experience"
              description="Personalized learning guidance, code explainers, and skill gap analysis."
            />
          }
        />
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
        <Route
          path="members"
          element={
            <MilestonePlaceholder
              title="Member Management"
              milestone="Milestone 10: Admin Platform"
              description="Cohort enrollment, role permissions, and active member roster."
            />
          }
        />
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
        <Route
          path="announcements"
          element={
            <MilestonePlaceholder
              title="Announcements"
              milestone="Milestone 10: Admin Platform"
              description="Broadcast announcements to public, applicants, or active members."
            />
          }
        />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="intelligence" element={<AdminIntelligencePage />} />
        <Route
          path="audit-logs"
          element={
            <MilestonePlaceholder
              title="Security & Audit Logs"
              milestone="Milestone 10: Admin Platform"
              description="Immutable administrative action logs and security events."
            />
          }
        />
        <Route
          path="settings"
          element={
            <MilestonePlaceholder
              title="System Settings"
              milestone="Milestone 10: Admin Platform"
              description="Platform parameters, intake cycles, and integration configurations."
            />
          }
        />
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
