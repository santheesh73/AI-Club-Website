import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response';
import { analyticsPeriodSchema } from './analytics.validators';
import { auditService } from '../admin/audit.service';

export class AnalyticsController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = analyticsPeriodSchema.parse(req.query);
      const metrics = await analyticsService.getPlatformOverview(period);
      await auditService.createLog({
        actorId: req.user!.id,
        action: 'ANALYTICS_VIEWED',
        entityType: 'ANALYTICS_OVERVIEW',
        entityId: req.user!.id,
        metadata: { period },
      });
      sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  }

  async getMemberships(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = analyticsPeriodSchema.parse(req.query);
      const result = await analyticsService.getMembershipAnalytics(period);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = analyticsPeriodSchema.parse(req.query);
      const result = await analyticsService.getApplicationAnalytics(period);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = analyticsPeriodSchema.parse(req.query);
      const result = await analyticsService.getEventAnalytics(period);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = analyticsPeriodSchema.parse(req.query);
      const result = await analyticsService.getCourseAnalytics(period);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getCommunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = analyticsPeriodSchema.parse(req.query);
      const result = await analyticsService.getCommunityAnalytics(period);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getEngagement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = analyticsPeriodSchema.parse(req.query);
      const result = await analyticsService.getEngagementAnalytics(period);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getMemberLearning(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await analyticsService.getMemberLearningAnalytics(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getMemberActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await analyticsService.getMemberActivitySummary(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
