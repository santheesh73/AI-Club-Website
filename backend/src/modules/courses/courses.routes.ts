import { Router } from 'express';
import { coursesController } from './courses.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createCourseSchema,
  updateCourseSchema,
  createModuleSchema,
  updateModuleSchema,
  reorderItemsSchema,
  createLessonSchema,
  updateLessonSchema,
  courseQuerySchema,
} from './courses.validators';

// ============================================================================
// MEMBER & PUBLIC COURSES ROUTER
// ============================================================================
const router = Router();

// Categories discovery
router.get('/categories', (req, res, next) => {
  coursesController.getCategories(req, res).catch(next);
});

// Member routes - protected by member/admin role
router.get(
  '/',
  authenticate,
  requireRole(['member', 'admin']),
  validate({ query: courseQuerySchema }),
  (req, res, next) => {
    coursesController.getMemberCourses(req, res).catch(next);
  }
);

router.get(
  '/enrolled',
  authenticate,
  requireRole(['member', 'admin']),
  (req, res, next) => {
    coursesController.getMemberEnrolledCourses(req, res).catch(next);
  }
);

router.get(
  ['/dashboard', '/dashboard/stats'],
  authenticate,
  requireRole(['member', 'admin']),
  (req, res, next) => {
    coursesController.getLearningDashboardStats(req, res).catch(next);
  }
);

router.get(
  '/:slug',
  authenticate,
  requireRole(['member', 'admin']),
  (req, res, next) => {
    coursesController.getMemberCourseDetail(req, res).catch(next);
  }
);

router.post(
  '/:courseId/enroll',
  authenticate,
  requireRole(['member', 'admin']),
  (req, res, next) => {
    coursesController.enrollInCourse(req, res).catch(next);
  }
);

router.get(
  '/:courseSlug/lessons/:lessonSlug',
  authenticate,
  requireRole(['member', 'admin']),
  (req, res, next) => {
    coursesController.getLesson(req, res).catch(next);
  }
);

router.post(
  '/lessons/:lessonId/complete',
  authenticate,
  requireRole(['member', 'admin']),
  (req, res, next) => {
    coursesController.completeLesson(req, res).catch(next);
  }
);

router.get(
  '/:courseId/progress',
  authenticate,
  requireRole(['member', 'admin']),
  (req, res, next) => {
    coursesController.getCourseProgress(req, res).catch(next);
  }
);

export const coursesRoutes = router;

// ============================================================================
// ADMIN COURSES ROUTER
// ============================================================================
const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole(['admin']));

adminRouter.get(
  '/',
  validate({ query: courseQuerySchema }),
  (req, res, next) => {
    coursesController.getAdminCourses(req, res).catch(next);
  }
);

adminRouter.post(
  '/',
  validate({ body: createCourseSchema }),
  (req, res, next) => {
    coursesController.createCourse(req, res).catch(next);
  }
);

adminRouter.get(
  '/:id',
  (req, res, next) => {
    coursesController.getAdminCourseById(req, res).catch(next);
  }
);

adminRouter.patch(
  '/:id',
  validate({ body: updateCourseSchema }),
  (req, res, next) => {
    coursesController.updateCourse(req, res).catch(next);
  }
);

adminRouter.post(
  '/:id/publish',
  (req, res, next) => {
    coursesController.publishCourse(req, res).catch(next);
  }
);

adminRouter.post(
  '/:id/unpublish',
  (req, res, next) => {
    coursesController.unpublishCourse(req, res).catch(next);
  }
);

adminRouter.post(
  '/:id/archive',
  (req, res, next) => {
    coursesController.archiveCourse(req, res).catch(next);
  }
);

// Modules
adminRouter.post(
  '/:courseId/modules',
  validate({ body: createModuleSchema }),
  (req, res, next) => {
    coursesController.createModule(req, res).catch(next);
  }
);

adminRouter.patch(
  '/modules/:moduleId',
  validate({ body: updateModuleSchema }),
  (req, res, next) => {
    coursesController.updateModule(req, res).catch(next);
  }
);

adminRouter.delete(
  '/modules/:moduleId',
  (req, res, next) => {
    coursesController.deleteModule(req, res).catch(next);
  }
);

adminRouter.put(
  '/:courseId/modules/reorder',
  validate({ body: reorderItemsSchema }),
  (req, res, next) => {
    coursesController.reorderModules(req, res).catch(next);
  }
);

// Lessons
adminRouter.post(
  '/modules/:moduleId/lessons',
  validate({ body: createLessonSchema }),
  (req, res, next) => {
    coursesController.createLesson(req, res).catch(next);
  }
);

adminRouter.patch(
  '/lessons/:lessonId',
  validate({ body: updateLessonSchema }),
  (req, res, next) => {
    coursesController.updateLesson(req, res).catch(next);
  }
);

adminRouter.delete(
  '/lessons/:lessonId',
  (req, res, next) => {
    coursesController.deleteLesson(req, res).catch(next);
  }
);

adminRouter.put(
  '/modules/:moduleId/lessons/reorder',
  validate({ body: reorderItemsSchema }),
  (req, res, next) => {
    coursesController.reorderLessons(req, res).catch(next);
  }
);

// Enrollments
adminRouter.get(
  '/:id/enrollments',
  (req, res, next) => {
    coursesController.getAdminCourseEnrollments(req, res).catch(next);
  }
);

export const adminCoursesRoutes = adminRouter;
