import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { eventsController } from './events.controller';
import {
  createEventSchema,
  updateEventSchema,
  cancelEventSchema,
  eventQuerySchema,
} from './events.validators';

// ============================================================================
// MEMBER EVENTS ROUTER (/api/v1/member/events)
// Requires authenticated session + active member or admin role
// ============================================================================
const memberRouter = Router();

memberRouter.use(authenticate);
memberRouter.use(requireRole(['member', 'admin']));

memberRouter.get('/', validate(eventQuerySchema), (req, res, next) => eventsController.getMemberEvents(req, res, next));
memberRouter.get('/registered', (req, res, next) => eventsController.getMemberRegisteredEvents(req, res, next));
memberRouter.get('/:slug', (req, res, next) => eventsController.getMemberEventBySlug(req, res, next));
memberRouter.post('/:eventId/register', (req, res, next) => eventsController.registerForEvent(req, res, next));
memberRouter.delete('/:eventId/registration', (req, res, next) => eventsController.cancelRegistration(req, res, next));
memberRouter.post('/:eventId/cancel-registration', (req, res, next) => eventsController.cancelRegistration(req, res, next));

// ============================================================================
// ADMIN EVENTS ROUTER (/api/v1/admin/events)
// Requires authenticated session + admin role
// ============================================================================
const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole(['admin']));

adminRouter.get('/', validate(eventQuerySchema), (req, res, next) => eventsController.getAdminEvents(req, res, next));
adminRouter.post('/', validate(createEventSchema), (req, res, next) => eventsController.createEvent(req, res, next));
adminRouter.get('/:id', (req, res, next) => eventsController.getAdminEventById(req, res, next));
adminRouter.patch('/:id', validate(updateEventSchema), (req, res, next) => eventsController.updateEvent(req, res, next));
adminRouter.post('/:id/publish', (req, res, next) => eventsController.publishEvent(req, res, next));
adminRouter.post('/:id/cancel', validate(cancelEventSchema), (req, res, next) => eventsController.cancelEvent(req, res, next));
adminRouter.get('/:id/registrations', (req, res, next) => eventsController.getEventRegistrations(req, res, next));

export const memberEventsRoutes = memberRouter;
export const adminEventsRoutes = adminRouter;
export const eventsRoutes = memberRouter;
