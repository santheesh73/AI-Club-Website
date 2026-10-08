import { Request, Response, NextFunction } from 'express';
import { announcementsService } from './announcements.service';
import { sendSuccess, AppError } from '../../utils/response';

export class AnnouncementsController {
  /**
   * Public & Member endpoint: GET /api/v1/announcements
   */
  async getAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const role = user?.role || 'anon';
      const items = await announcementsService.getAnnouncementsForAudience(role as 'anon' | 'applicant' | 'member' | 'admin');
      sendSuccess(res, items, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: GET /api/v1/admin/announcements
   */
  async getAdminAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await announcementsService.getAllAnnouncements();
      sendSuccess(res, items, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: POST /api/v1/admin/announcements
   */
  async createAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const { title, content, priority, status, expiresAt } = req.body;
      const audience = req.body.audience || req.body.targetAudience || 'all';
      if (!title || !content) {
        return next(new AppError('Title and content are required', 400, 'BAD_REQUEST'));
      }

      const created = await announcementsService.createAnnouncement(
        { title, content, priority, audience, status, expiresAt },
        adminUser.id,
        req.requestId
      );
      sendSuccess(res, created, 201, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: PUT /api/v1/admin/announcements/:id
   */
  async updateAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const { id } = req.params;
      const updated = await announcementsService.updateAnnouncement(
        id,
        req.body,
        adminUser.id,
        req.requestId
      );
      sendSuccess(res, updated, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin endpoint: DELETE /api/v1/admin/announcements/:id
   */
  async archiveAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const { id } = req.params;
      const result = await announcementsService.archiveAnnouncement(id, adminUser.id, req.requestId);
      sendSuccess(res, result, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }
}

export const announcementsController = new AnnouncementsController();
