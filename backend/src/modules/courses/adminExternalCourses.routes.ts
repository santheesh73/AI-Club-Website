import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { courseRecommendationsService } from './courseRecommendations.service';
import { courseProviderRegistry } from './providers/providerRegistry';
import { sendSuccess, AppError } from '../../utils/response';
import { authenticate, requireRole } from '../../middleware/auth';
import { extractionRateLimiter } from '../../middleware/rateLimit';

const router = Router();
router.use(authenticate);
router.use(requireRole(['admin']));

// Validation schemas
const extractCourseSchema = z.object({
  url: z.string().url('A valid HTTPS course URL is required.').trim(),
});

const createCourseSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters long.').trim(),
  provider: z.string().min(2, 'Provider name is required.').trim(),
  officialUrl: z.string().url('A valid URL is required.').trim(),
  category: z.string().trim().optional().default('AI'),
  skills: z.array(z.string()).default([]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).default('beginner'),
  description: z.string().trim().optional().default(''),
  imageUrl: z.string().url().optional().or(z.literal('')),
  duration: z.string().optional(),
  language: z.string().default('English'),
  priceType: z.enum(['free', 'paid', 'freemium', 'subscription']).default('free'),
  rating: z.number().min(1).max(5).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  extractionMetadata: z.record(z.unknown()).optional(),
});

const updateCourseSchema = createCourseSchema.partial();

// GET /api/v1/admin/external-courses
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, category, status, search } = req.query;
    const courses = await courseRecommendationsService.listExternalCoursesForAdmin({
      provider: provider ? String(provider) : undefined,
      category: category ? String(category) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
    });
    sendSuccess(res, courses, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/external-courses/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await courseRecommendationsService.getExternalCoursesAnalytics();
    sendSuccess(res, stats, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/external-courses/providers
router.get('/providers', (_req: Request, res: Response) => {
  const providers = courseProviderRegistry.getAllDefinitions();
  sendSuccess(res, providers, 200);
});

// POST /api/v1/admin/external-courses/extract
router.post('/extract', extractionRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return next(new AppError('Admin authentication required', 401, 'UNAUTHORIZED'));

    const parsed = extractCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'A valid course URL is required.';
      return next(new AppError(firstError, 400, 'VALIDATION_ERROR', parsed.error.errors));
    }

    const result = await courseRecommendationsService.extractExternalCourseMetadata(
      parsed.data.url,
      user.id,
      req.requestId
    );

    sendSuccess(res, result, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/external-courses
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return next(new AppError('Admin authentication required', 401, 'UNAUTHORIZED'));

    const parsed = createCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid course input.';
      return next(new AppError(firstError, 400, 'VALIDATION_ERROR', parsed.error.errors));
    }

    const created = await courseRecommendationsService.createExternalCourse(
      {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl || undefined,
      },
      user.id
    );

    sendSuccess(res, created, 201, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/external-courses/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return next(new AppError('Admin authentication required', 401, 'UNAUTHORIZED'));

    const parsed = updateCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid course input.';
      return next(new AppError(firstError, 400, 'VALIDATION_ERROR', parsed.error.errors));
    }

    const updated = await courseRecommendationsService.updateExternalCourse(
      req.params.id,
      {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl || undefined,
      },
      user.id
    );

    sendSuccess(res, updated, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/external-courses/:id/verify
router.post('/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return next(new AppError('Admin authentication required', 401, 'UNAUTHORIZED'));

    const verified = await courseRecommendationsService.verifyExternalCourse(
      req.params.id,
      user.id
    );

    sendSuccess(res, verified, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/external-courses/:id/publish
router.post('/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return next(new AppError('Admin authentication required', 401, 'UNAUTHORIZED'));

    const published = await courseRecommendationsService.publishExternalCourse(
      req.params.id,
      user.id,
      req.requestId
    );

    sendSuccess(res, published, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/external-courses/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return next(new AppError('Admin authentication required', 401, 'UNAUTHORIZED'));

    await courseRecommendationsService.deleteExternalCourse(req.params.id, user.id);
    sendSuccess(res, { message: 'External course removed successfully.' }, 200, {
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

export const adminExternalCoursesRoutes = router;
