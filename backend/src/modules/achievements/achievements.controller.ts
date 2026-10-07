import { Request, Response, NextFunction } from 'express';
import { sendSuccess, AppError } from '../../utils/response';
import { achievementsService } from './achievements.service';

export class AchievementsController {
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await achievementsService.getCategories();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  async getAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const achievements = await achievementsService.getAchievements(
        {
          userId: req.query.userId as string,
          categoryId: req.query.categoryId as string,
        },
        req.user
      );
      sendSuccess(res, achievements);
    } catch (err) {
      next(err);
    }
  }

  async getMemberAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const achievements = await achievementsService.getMemberAchievements(req.user.id);
      sendSuccess(res, achievements);
    } catch (err) {
      next(err);
    }
  }

  async createAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const achievement = await achievementsService.createAchievement(req.user.id, req.body);
      sendSuccess(res, achievement, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const achievement = await achievementsService.updateAchievement(
        req.params.id,
        req.user.id,
        req.body,
        req.user.role
      );
      sendSuccess(res, achievement);
    } catch (err) {
      next(err);
    }
  }

  async deleteAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      await achievementsService.deleteAchievement(req.params.id, req.user.id, req.user.role);
      sendSuccess(res, { message: 'Achievement deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async hideAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const achievement = await achievementsService.hideAchievement(
        req.params.id,
        req.body.reason,
        req.user.id
      );
      sendSuccess(res, achievement);
    } catch (err) {
      next(err);
    }
  }

  async restoreAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const achievement = await achievementsService.restoreAchievement(req.params.id, req.user.id);
      sendSuccess(res, achievement);
    } catch (err) {
      next(err);
    }
  }
}

export const achievementsController = new AchievementsController();
