import { Request, Response, NextFunction } from 'express';
import { projectIdeasService } from './projectIdeas.service';
import { sendSuccess, AppError } from '../../utils/response';

export class ProjectIdeasController {
  /**
   * Member endpoint: GET /api/v1/projects/ideas
   */
  async getIdeas(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, difficulty } = req.query;
      const ideas = await projectIdeasService.getPublishedIdeas({
        category: typeof category === 'string' ? category : undefined,
        difficulty: typeof difficulty === 'string' ? difficulty : undefined,
      });
      sendSuccess(res, ideas, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: GET /api/v1/admin/project-ideas
   */
  async getAdminIdeas(req: Request, res: Response, next: NextFunction) {
    try {
      const ideas = await projectIdeasService.getAllIdeas();
      sendSuccess(res, ideas, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: POST /api/v1/admin/project-ideas
   */
  async createIdea(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const { title, description, category } = req.body;
      if (!title || !description || !category) {
        return next(new AppError('Title, description, and category are required', 400, 'BAD_REQUEST'));
      }

      const created = await projectIdeasService.createIdea(req.body, adminUser.id, req.requestId);
      sendSuccess(res, created, 201, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: PUT /api/v1/admin/project-ideas/:id
   */
  async updateIdea(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const { id } = req.params;
      const updated = await projectIdeasService.updateIdea(id, req.body, adminUser.id, req.requestId);
      sendSuccess(res, updated, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: DELETE /api/v1/admin/project-ideas/:id
   */
  async archiveIdea(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const { id } = req.params;
      const result = await projectIdeasService.archiveIdea(id, adminUser.id, req.requestId);
      sendSuccess(res, result, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }
}

export const projectIdeasController = new ProjectIdeasController();
