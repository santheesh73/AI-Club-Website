import { Router, Request, Response, NextFunction } from 'express';
import { courseRecommendationsService } from './courseRecommendations.service';
import { courseProviderRegistry } from './providers/providerRegistry';
import { sendSuccess, AppError } from '../../utils/response';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(requireRole(['member', 'admin']));

// GET /api/v1/member/courses/recommendations / recommended
router.get(['/recommended', '/recommendations'], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const forceRefresh = req.query.refresh === 'true';
    const result = await courseRecommendationsService.getRecommendationsForMember(user.id, {
      forceRefresh,
    });

    sendSuccess(res, result, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/member/courses/external
router.get('/external', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await courseRecommendationsService.getPublishedExternalCourses();
    sendSuccess(res, courses, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/member/courses/providers
router.get('/providers', (_req: Request, res: Response) => {
  const providers = courseProviderRegistry.getAllDefinitions();
  sendSuccess(res, providers, 200);
});

// POST /api/v1/member/courses/external/:id/click
router.post('/external/:id/click', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const clickResult = await courseRecommendationsService.recordExternalCourseClick(
      user.id,
      req.params.id
    );

    sendSuccess(res, clickResult, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

export const courseRecommendationsRoutes = router;
