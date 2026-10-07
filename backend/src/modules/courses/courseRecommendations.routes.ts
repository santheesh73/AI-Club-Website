import { Router, Request, Response, NextFunction } from 'express';
import { courseRecommendationsService } from './courseRecommendations.service';
import { sendSuccess, AppError } from '../../utils/response';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(requireRole(['member', 'admin']));

// GET /api/v1/member/courses/recommended
router.get('/recommended', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const recommendations = await courseRecommendationsService.getRecommendationsForMember(user.id);
    sendSuccess(res, recommendations, 200, { requestId: req.requestId });
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

export const courseRecommendationsRoutes = router;
