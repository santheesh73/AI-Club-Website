import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { adminController } from './admin.controller';
import { membershipController } from '../membership/membership.controller';
import { adminEventsRoutes } from '../events/events.routes';
import { adminCoursesRoutes } from '../courses/courses.routes';
import { adminProjectsRoutes } from '../projects/projects.routes';
import { adminAchievementsRoutes } from '../achievements/achievements.routes';
import { adminNotificationsRoutes } from '../notifications/notifications.routes';
import { adminAnalyticsRoutes } from '../analytics/analytics.routes';
import { adminIntelligenceRoutes } from '../ai/ai.routes';
import { adminAssessmentRoutes } from './assessment.routes';
import { adminAnnouncementsRoutes } from '../announcements/announcements.routes';
import { adminProjectIdeasRoutes } from '../projects/projectIdeas.routes';
import { adminLeaderboardRoutes } from '../leaderboard/leaderboard.routes';

/**
 * AI CLUB - Module: admin
 * Comprehensive Admin Control Center
 */
const router = Router();

// Strict administrative authentication & authorization guard on all /admin routes
router.use(authenticate);
router.use(requireRole(['admin']));

// Application Statistics & Control Center Overview
router.get('/dashboard/summary', (req, res, next) =>
  adminController.getDashboardSummary(req, res, next)
);

// Application Querying (Filtering, Search, Sorting, Pagination)
router.get('/applications', (req, res, next) =>
  adminController.getApplications(req, res, next)
);

// Individual Applicant Dossier Inspection
router.get('/applications/:id', (req, res, next) =>
  adminController.getApplicationDetail(req, res, next)
);

// Decision Endpoints
router.post('/applications/:id/approve', (req, res, next) =>
  adminController.approveApplication(req, res, next)
);

router.post('/applications/:id/waitlist', (req, res, next) =>
  adminController.waitlistApplication(req, res, next)
);

router.post('/applications/:id/reject', (req, res, next) =>
  adminController.rejectApplication(req, res, next)
);

// Assessment Question Bank & Examination Management
router.use('/assessment', adminAssessmentRoutes);

// Membership Activation & Member Management
router.post('/memberships/activate', (req, res, next) =>
  membershipController.activateMembership(req, res, next)
);

router.get('/members', (req, res, next) =>
  membershipController.getMembersList(req, res, next)
);

// Events Management & Registrations Oversight
router.use('/events', adminEventsRoutes);

// Announcements Management
router.use('/announcements', adminAnnouncementsRoutes);

// Project Ideas Curation (Admin Created)
router.use('/project-ideas', adminProjectIdeasRoutes);

// Leaderboard & Points Ledger Management
router.use('/leaderboard', adminLeaderboardRoutes);

// Courses & Learning Management Oversight
router.use('/courses', adminCoursesRoutes);

// Projects, Achievements & Community Moderation
router.use('/projects', adminProjectsRoutes);
router.use('/community', adminProjectsRoutes);
router.use('/achievements', adminAchievementsRoutes);

// Notifications, Analytics & AI Intelligence
router.use('/notifications', adminNotificationsRoutes);
router.use('/analytics', adminAnalyticsRoutes);
router.use('/intelligence', adminIntelligenceRoutes);

export const adminRoutes = router;
