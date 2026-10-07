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
        <Route
          path="/projects"
          element={
            <MilestonePlaceholder
              title="Showcase Projects"
              milestone="Milestone 2: Public Experience"
              description="Open-source AI repositories, applied research systems, and student builds."
            />
          }
        />
        <Route
          path="/community"
          element={
            <MilestonePlaceholder
              title="AI Community"
              milestone="Milestone 2: Public Experience"
              description="Members directory, mentor network, and ecosystem partners."
            />
          }
        />
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
        <Route
          path="courses"
          element={
            <MilestonePlaceholder
              title="Courses & Labs"
              milestone="Milestone 6: Courses"
              description="Interactive learning modules, video lectures, and code assignments."
            />
          }
        />
        <Route
          path="events"
          element={
            <MilestonePlaceholder
              title="Member Events"
              milestone="Milestone 6: Events"
              description="Exclusive member hackathons, research seminars, and RSVP tracking."
            />
          }
        />
        <Route
          path="projects"
          element={
            <MilestonePlaceholder
              title="Active Projects"
              milestone="Milestone 7: Projects & Teams"
              description="Collaborative AI repositories, sprint boards, and deliverables."
            />
          }
        />
        <Route
          path="community"
          element={
            <MilestonePlaceholder
              title="Member Network"
              milestone="Milestone 7: Community"
              description="Connect with fellow AI club members, peer reviews, and discussion channels."
            />
          }
        />
        <Route
          path="achievements"
          element={
            <MilestonePlaceholder
              title="Achievements & Badges"
              milestone="Milestone 8: Achievements"
              description="Earned milestones, verified credentials, and activity streak records."
            />
          }
        />
        <Route
          path="notifications"
          element={
            <MilestonePlaceholder
              title="Notifications"
              milestone="Milestone 8: Notifications"
              description="Real-time alerts, project updates, and system announcements."
            />
          }
        />
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
        <Route
          path="events"
          element={
            <MilestonePlaceholder
              title="Event Management"
              milestone="Milestone 10: Admin Platform"
              description="Create, schedule, and manage club events and attendance."
            />
          }
        />
        <Route
          path="courses"
          element={
            <MilestonePlaceholder
              title="Course Management"
              milestone="Milestone 10: Admin Platform"
              description="Publish modules, syllabus management, and student progress oversight."
            />
          }
        />
        <Route
          path="projects"
          element={
            <MilestonePlaceholder
              title="Project Oversight"
              milestone="Milestone 10: Admin Platform"
              description="Approve team proposals, track milestones, and showcase highlights."
            />
          }
        />
        <Route
          path="achievements"
          element={
            <MilestonePlaceholder
              title="Achievement Rules"
              milestone="Milestone 10: Admin Platform"
              description="Define achievement criteria, point allocations, and badges."
            />
          }
        />
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
        <Route
          path="notifications"
          element={
            <MilestonePlaceholder
              title="Notification Center"
              milestone="Milestone 10: Admin Platform"
              description="System triggers, email dispatch logs, and push delivery status."
            />
          }
        />
        <Route
          path="analytics"
          element={
            <MilestonePlaceholder
              title="Platform Analytics"
              milestone="Milestone 10: Admin Platform"
              description="Engagement metrics, assessment distributions, and member retention."
            />
          }
        />
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

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
