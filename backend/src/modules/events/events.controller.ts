import { Request, Response, NextFunction } from 'express';
import { sendSuccess, AppError } from '../../utils/response';
import { eventsService } from './events.service';
import { EventQueryDto } from './events.types';
import { isAuthorizedAdmin } from '../../middleware/auth';

export class EventsController {
  async getPublicEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as EventQueryDto;
      const result = await eventsService.getPublicEvents(query);
      sendSuccess(res, result.items, 200, { total: result.total, page: query.page || 1, pageSize: query.pageSize || 20 });
    } catch (err) { next(err); }
  }

  async getPublicEventBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await eventsService.getPublicEventBySlug(req.params.slug)); }
    catch (err) { next(err); }
  }

  async getRegistrationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      sendSuccess(res, await eventsService.getRegistrationStatus(req.params.eventId, req.user.id, isAuthorizedAdmin(req.user.email, req.user.role)));
    } catch (err) { next(err); }
  }

  // ============================================================================
  // ADMIN CONTROLLER METHODS
  // ============================================================================

  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      const event = await eventsService.createEvent(req.body, req.user.id, req.headers['x-request-id'] as string);
      sendSuccess(res, event, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      const event = await eventsService.updateEvent(
        req.params.id,
        req.body,
        req.user.id,
        req.headers['x-request-id'] as string
      );
      sendSuccess(res, event, 200);
    } catch (err) {
      next(err);
    }
  }

  async publishEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      const event = await eventsService.publishEvent(
        req.params.id,
        req.user.id,
        req.headers['x-request-id'] as string
      );
      sendSuccess(res, event, 200);
    } catch (err) {
      next(err);
    }
  }

  async cancelEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      const { cancellationReason } = req.body;
      if (!cancellationReason || cancellationReason.trim().length < 3) {
        return next(
          new AppError('Cancellation reason must be at least 3 characters', 400, 'INVALID_CANCELLATION_REASON')
        );
      }
      const event = await eventsService.cancelEvent(
        req.params.id,
        cancellationReason,
        req.user.id,
        req.headers['x-request-id'] as string
      );
      sendSuccess(res, event, 200);
    } catch (err) {
      next(err);
    }
  }

  async getAdminEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: EventQueryDto = {
        search: req.query.search as string,
        category: req.query.category as any,
        status: req.query.status as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await eventsService.getAdminEvents(query);
      sendSuccess(res, result.items, 200, {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAdminEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventsService.getEventById(req.params.id);
      if (!event) {
        return next(new AppError('Event not found', 404, 'EVENT_NOT_FOUND'));
      }
      const regCount = await eventsService.getEventRegistrationCount(event.id);
      const availableSeats = event.capacity !== null && event.capacity !== undefined ? Math.max(0, event.capacity - regCount) : null;
      sendSuccess(res, {
        ...event,
        registeredCount: regCount,
        availableSeats,
        registrationRate: event.capacity ? Math.min(100, Math.round((regCount / event.capacity) * 100)) : 100,
      });
    } catch (err) {
      next(err);
    }
  }

  async getEventRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registrations = await eventsService.getEventRegistrations(req.params.id);
      sendSuccess(res, registrations, 200);
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // MEMBER CONTROLLER METHODS
  // ============================================================================

  async getMemberEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const query: EventQueryDto = {
        search: req.query.search as string,
        category: req.query.category as any,
        timeline: req.query.timeline as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
      };

      const result = await eventsService.getMemberEvents(req.user.id, query);
      sendSuccess(res, result.items, 200, {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMemberEventBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      const event = await eventsService.getMemberEventBySlug(req.params.slug, req.user.id);
      sendSuccess(res, event, 200);
    } catch (err) {
      next(err);
    }
  }

  async registerForEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      const registration = await eventsService.registerForEvent(
        req.params.eventId,
        req.user.id,
        isAuthorizedAdmin(req.user.email, req.user.role) ? 'admin' : req.user.role === 'admin' ? 'applicant' : req.user.role,
        req.headers['x-request-id'] as string
      );
      sendSuccess(res, registration, 201);
    } catch (err) {
      next(err);
    }
  }

  async cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      const updated = await eventsService.cancelRegistration(
        req.params.eventId,
        req.user.id,
        req.headers['x-request-id'] as string
      );
      sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  }

  async getMemberRegisteredEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      const data = await eventsService.getMemberRegisteredEvents(req.user.id);
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const eventsController = new EventsController();
