import { Router } from 'express';
import { announcementsController } from './announcements.controller';
import { optionalAuthenticate, authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Public & member announcements list (adapts to user session if present)
router.get('/', optionalAuthenticate, (req, res, next) =>
  announcementsController.getAnnouncements(req, res, next)
);

// Admin dedicated routes
export const adminAnnouncementsRoutes = Router();
adminAnnouncementsRoutes.use(authenticate);
adminAnnouncementsRoutes.use(requireRole(['admin']));

adminAnnouncementsRoutes.get('/', (req, res, next) =>
  announcementsController.getAdminAnnouncements(req, res, next)
);
adminAnnouncementsRoutes.post('/', (req, res, next) =>
  announcementsController.createAnnouncement(req, res, next)
);
adminAnnouncementsRoutes.put('/:id', (req, res, next) =>
  announcementsController.updateAnnouncement(req, res, next)
);
adminAnnouncementsRoutes.delete('/:id', (req, res, next) =>
  announcementsController.archiveAnnouncement(req, res, next)
);

export const announcementsRoutes = router;
