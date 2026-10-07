import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { notificationsController } from './notifications.controller';

const router = Router();

// Member / Authenticated user notification routes
router.use(authenticate);

// Get member notifications
router.get('/', (req, res, next) =>
  notificationsController.getMyNotifications(req, res, next)
);

// Get unread count
router.get('/unread-count', (req, res, next) =>
  notificationsController.getMyUnreadCount(req, res, next)
);

// Mark single notification as read
router.patch('/:id/read', (req, res, next) =>
  notificationsController.markAsRead(req, res, next)
);

// Mark all notifications as read
router.post('/read-all', (req, res, next) =>
  notificationsController.markAllAsRead(req, res, next)
);

// Get notification preferences
router.get('/preferences', (req, res, next) =>
  notificationsController.getPreferences(req, res, next)
);

// Update notification preferences
router.patch('/preferences', (req, res, next) =>
  notificationsController.updatePreferences(req, res, next)
);

export const notificationsRoutes = router;

// Admin notifications sub-router
const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(requireRole(['admin']));

adminRouter.get('/', (req, res, next) =>
  notificationsController.getAdminNotifications(req, res, next)
);

export const adminNotificationsRoutes = adminRouter;
