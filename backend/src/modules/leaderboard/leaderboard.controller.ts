import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from './leaderboard.service';
import { sendSuccess, AppError } from '../../utils/response';

export class LeaderboardController {
  /**
   * Member & Public endpoint: GET /api/v1/member/leaderboard
   */
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const rankings = await leaderboardService.getLeaderboard(limit ? Number(limit) : 50);
      sendSuccess(res, rankings, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Member endpoint: GET /api/v1/member/leaderboard/me
   */
  async getMyRank(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const data = await leaderboardService.getMemberRankAndHistory(user.id);
      sendSuccess(res, data, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: GET /api/v1/admin/leaderboard/rules
   */
  async getRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await leaderboardService.getRules();
      sendSuccess(res, rules, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: PUT /api/v1/admin/leaderboard/rules/:activityType
   */
  async updateRule(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const { activityType } = req.params;
      const { points } = req.body;

      if (typeof points !== 'number' || points < 0) {
        return next(new AppError('Points must be a non-negative number', 400, 'BAD_REQUEST'));
      }

      const updated = await leaderboardService.updateRule(
        activityType,
        points,
        adminUser.id,
        req.requestId
      );
      sendSuccess(res, updated, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: POST /api/v1/admin/leaderboard/correct
   */
  async correctPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const { targetUserId, points, reason } = req.body;
      if (!targetUserId || typeof points !== 'number' || !reason) {
        return next(
          new AppError('targetUserId, points, and reason are required', 400, 'BAD_REQUEST')
        );
      }

      const result = await leaderboardService.adminCorrectContribution({
        targetUserId,
        points,
        reason,
        actorId: adminUser.id,
        requestId: req.requestId,
      });

      sendSuccess(res, result, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }
}

export const leaderboardController = new LeaderboardController();
