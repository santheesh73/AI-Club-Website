import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../utils/response';
import {
  notificationQuerySchema,
  updateNotificationPreferencesSchema,
} from './notifications.validators';

export class NotificationsController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = notificationQuerySchema.parse(req.query);
      const result = await notificationsService.getNotifications(req.user!.id, parsedQuery);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getMyUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationsService.getUnreadCount(req.user!.id);
      sendSuccess(res, { unreadCount: count });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await notificationsService.markAsRead(req.user!.id, id);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationsService.markAllAsRead(req.user!.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await notificationsService.getPreferences(req.user!.id);
      sendSuccess(res, prefs);
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = updateNotificationPreferencesSchema.parse(req.body);
      const updated = await notificationsService.updatePreferences(req.user!.id, body);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  async getAdminNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = notificationQuerySchema.parse(req.query);
      const result = await notificationsService.getAdminNotifications(parsedQuery);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
