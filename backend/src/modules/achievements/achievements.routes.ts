import { Router } from 'express';
import { authenticate, requireRole, optionalAuthenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { achievementsController } from './achievements.controller';
import {
  createAchievementSchema,
  updateAchievementSchema,
  adminHideAchievementSchema,
} from './achievements.validators';

// ============================================================================
// PUBLIC & SHOWCASE ACHIEVEMENTS ROUTER (/api/v1/achievements)
// ============================================================================
const router = Router();

router.get('/categories', (req, res, next) => achievementsController.getCategories(req, res, next));

router.get(
  '/',
  optionalAuthenticate,
  (req, res, next) => achievementsController.getAchievements(req, res, next)
);

router.get(
  '/member',
  authenticate,
  requireRole(['member', 'admin']),
  (req, res, next) => achievementsController.getMemberAchievements(req, res, next)
);

export const achievementsRoutes = router;

// ============================================================================
// MEMBER ACHIEVEMENTS ROUTER (/api/v1/member/achievements)
// ============================================================================
const memberRouter = Router();

memberRouter.use(authenticate);
memberRouter.use(requireRole(['member', 'admin']));

memberRouter.get('/', (req, res, next) => achievementsController.getMemberAchievements(req, res, next));

memberRouter.post(
  '/',
  validate({ body: createAchievementSchema }),
  (req, res, next) => achievementsController.createAchievement(req, res, next)
);

memberRouter.patch(
  '/:id',
  validate({ body: updateAchievementSchema }),
  (req, res, next) => achievementsController.updateAchievement(req, res, next)
);

memberRouter.delete(
  '/:id',
  (req, res, next) => achievementsController.deleteAchievement(req, res, next)
);

export const memberAchievementsRoutes = memberRouter;

// ============================================================================
// ADMIN ACHIEVEMENTS ROUTER (/api/v1/admin/achievements)
// ============================================================================
const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole(['admin']));

adminRouter.post(
  '/:id/hide',
  validate({ body: adminHideAchievementSchema }),
  (req, res, next) => achievementsController.hideAchievement(req, res, next)
);

adminRouter.post(
  '/:id/restore',
  (req, res, next) => achievementsController.restoreAchievement(req, res, next)
);

export const adminAchievementsRoutes = adminRouter;
