import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { analyticsController } from './analytics.controller';

// Member personal analytics router
const memberRouter = Router();
memberRouter.use(authenticate);
memberRouter.use(requireRole(['member', 'admin']));

memberRouter.get('/learning', (req, res, next) =>
  analyticsController.getMemberLearning(req, res, next)
);

memberRouter.get('/activity', (req, res, next) =>
  analyticsController.getMemberActivity(req, res, next)
);

export const memberAnalyticsRoutes = memberRouter;

// Admin analytics router
const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(requireRole(['admin']));

adminRouter.get('/overview', (req, res, next) =>
  analyticsController.getOverview(req, res, next)
);

adminRouter.get('/memberships', (req, res, next) =>
  analyticsController.getMemberships(req, res, next)
);

adminRouter.get('/applications', (req, res, next) =>
  analyticsController.getApplications(req, res, next)
);

adminRouter.get('/events', (req, res, next) =>
  analyticsController.getEvents(req, res, next)
);

adminRouter.get('/courses', (req, res, next) =>
  analyticsController.getCourses(req, res, next)
);

adminRouter.get('/community', (req, res, next) =>
  analyticsController.getCommunity(req, res, next)
);

adminRouter.get('/engagement', (req, res, next) =>
  analyticsController.getEngagement(req, res, next)
);

export const adminAnalyticsRoutes = adminRouter;
