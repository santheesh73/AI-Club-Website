import express from 'express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { securityHeaders, corsMiddleware } from './middleware/security';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/response';

// Module routers
import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { profileRoutes } from './modules/profile/profile.routes';
import { applicationsRoutes } from './modules/applications/applications.routes';
import { assessmentRoutes } from './modules/assessment/assessment.routes';
import { membershipRoutes } from './modules/membership/membership.routes';
import { eventsRoutes } from './modules/events/events.routes';
import { coursesRoutes } from './modules/courses/courses.routes';
import { courseRecommendationsRoutes } from './modules/courses/courseRecommendations.routes';
import { projectsRoutes, memberProjectsRoutes } from './modules/projects/projects.routes';
import { memberProjectIdeasRoutes } from './modules/projects/projectIdeas.routes';
import { teamsRoutes } from './modules/teams/teams.routes';
import { achievementsRoutes, memberAchievementsRoutes } from './modules/achievements/achievements.routes';
import { announcementsRoutes } from './modules/announcements/announcements.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { memberAnalyticsRoutes } from './modules/analytics/analytics.routes';
import { memberLeaderboardRoutes } from './modules/leaderboard/leaderboard.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import {
  apiRateLimiter,
  authRateLimiter,
  assessmentRateLimiter,
  aiRateLimiter,
} from './middleware/rateLimit';

const app = express();

// Security and utility middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestLogger);

// Root level health check for load balancers / cloud orchestration
app.use('/health', healthRoutes);

// API Versioned routes (/api/v1/...)
const v1Router = express.Router();

// General API rate limiter across all endpoints
v1Router.use(apiRateLimiter);

v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRateLimiter, authRoutes);
v1Router.use('/profile', profileRoutes);
v1Router.use('/applications', applicationsRoutes);
v1Router.use('/assessment', assessmentRateLimiter, assessmentRoutes);
v1Router.use('/membership', membershipRoutes);
v1Router.use('/events', eventsRoutes);
v1Router.use('/member/events', eventsRoutes);
v1Router.use('/courses', coursesRoutes);
v1Router.use('/member/courses', coursesRoutes);
v1Router.use('/member/courses/recommendations', courseRecommendationsRoutes);
v1Router.use('/projects', projectsRoutes);
v1Router.use('/member/projects', memberProjectsRoutes);
v1Router.use('/member/project-ideas', memberProjectIdeasRoutes);
v1Router.use('/projects/ideas', memberProjectIdeasRoutes);
v1Router.use('/teams', teamsRoutes);
v1Router.use('/achievements', achievementsRoutes);
v1Router.use('/member/achievements', memberAchievementsRoutes);
v1Router.use('/announcements', announcementsRoutes);
v1Router.use('/notifications', notificationsRoutes);
v1Router.use('/member/notifications', notificationsRoutes);
v1Router.use('/member/analytics', memberAnalyticsRoutes);
v1Router.use('/member/leaderboard', memberLeaderboardRoutes);
v1Router.use('/leaderboard', memberLeaderboardRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/ai', aiRateLimiter, aiRoutes);

app.use(`/api/${env.API_VERSION}`, v1Router);

// 404 Handler for unknown endpoints
app.use((req, _res, next) => {
  next(
    new AppError(
      `Endpoint ${req.method} ${req.originalUrl} does not exist on this server`,
      404,
      'ROUTE_NOT_FOUND'
    )
  );
});

// Centralized error handler
app.use(errorHandler);

// Start server if not running in test mode
if (env.NODE_ENV !== 'test') {
  app.listen(env.PORT, env.HOST, () => {
    logger.info(`AI CLUB API Server running on http://${env.HOST}:${env.PORT}`, {
      environment: env.NODE_ENV,
      version: '0.1.0',
      apiPrefix: `/api/${env.API_VERSION}`,
    });
  });
}

export { app };
