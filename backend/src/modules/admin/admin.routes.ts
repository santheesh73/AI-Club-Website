import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { adminController } from './admin.controller';
import { membershipController } from '../membership/membership.controller';

/**
 * AI CLUB - Module: admin
 * Milestone 4: Admin Control Center, Application Review & Decision Engine
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

// Milestone 5: Membership Activation & Member Management
router.post('/memberships/activate', (req, res, next) =>
  membershipController.activateMembership(req, res, next)
);

router.get('/members', (req, res, next) =>
  membershipController.getMembersList(req, res, next)
);

// Milestone 6: Events Management & Registrations Oversight
import { adminEventsRoutes } from '../events/events.routes';
router.use('/events', adminEventsRoutes);

// Milestone 7: Courses & Learning Management Oversight
import { adminCoursesRoutes } from '../courses/courses.routes';
router.use('/courses', adminCoursesRoutes);

// Milestone 8: Projects, Achievements & Community Moderation
import { adminProjectsRoutes } from '../projects/projects.routes';
import { adminAchievementsRoutes } from '../achievements/achievements.routes';
router.use('/projects', adminProjectsRoutes);
router.use('/community', adminProjectsRoutes);
router.use('/achievements', adminAchievementsRoutes);

export const adminRoutes = router;
