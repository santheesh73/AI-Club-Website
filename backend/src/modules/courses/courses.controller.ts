import { Request, Response } from 'express';
import { coursesService } from './courses.service';
import { sendSuccess } from '../../utils/response';
import { CourseQueryDto } from './courses.types';

export class CoursesController {
  // ============================================================================
  // PUBLIC & MEMBER DISCOVERY
  // ============================================================================

  async getCategories(_req: Request, res: Response) {
    const categories = await coursesService.getCategories();
    sendSuccess(res, categories);
  }

  async getMemberCourses(req: Request, res: Response) {
    const userId = req.user!.id;
    const query = req.query as unknown as CourseQueryDto;
    const { items, total } = await coursesService.getMemberCourses(userId, query);
    sendSuccess(res, items, 200, {
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    });
  }

  async getMemberEnrolledCourses(req: Request, res: Response) {
    const userId = req.user!.id;
    const data = await coursesService.getMemberEnrolledCourses(userId);
    sendSuccess(res, data);
  }

  async getMemberCourseDetail(req: Request, res: Response) {
    const userId = req.user!.id;
    const { slug } = req.params;
    const detail = await coursesService.getMemberCourseDetail(slug, userId);
    sendSuccess(res, detail);
  }

  async enrollInCourse(req: Request, res: Response) {
    const userId = req.user!.id;
    const actorRole = req.user!.role;
    const { courseId } = req.params;
    const requestId = req.headers['x-request-id'] as string | undefined;

    const enrollment = await coursesService.enrollMemberInCourse(
      courseId,
      userId,
      actorRole,
      requestId
    );
    sendSuccess(res, enrollment, 201);
  }

  // ============================================================================
  // LEARNING WORKSPACE & LESSON ENGINE
  // ============================================================================

  async getLesson(req: Request, res: Response) {
    const userId = req.user!.id;
    const { courseSlug, lessonSlug } = req.params;
    const lesson = await coursesService.getLessonForMember(courseSlug, lessonSlug, userId);
    sendSuccess(res, lesson);
  }

  async completeLesson(req: Request, res: Response) {
    const userId = req.user!.id;
    const { lessonId } = req.params;
    const requestId = req.headers['x-request-id'] as string | undefined;

    const progress = await coursesService.completeLesson(lessonId, userId, requestId);
    sendSuccess(res, progress);
  }

  async getCourseProgress(req: Request, res: Response) {
    const userId = req.user!.id;
    const { courseId } = req.params;

    const enrollment = await coursesService.getUserEnrollment(courseId, userId);
    if (!enrollment) {
      sendSuccess(res, null);
      return;
    }

    const progress = await coursesService.calculateCourseProgress(enrollment.id, courseId);
    sendSuccess(res, progress);
  }

  async getLearningDashboardStats(req: Request, res: Response) {
    const userId = req.user!.id;
    const stats = await coursesService.getMemberLearningDashboardStats(userId);
    sendSuccess(res, stats);
  }

  // ============================================================================
  // ADMIN COURSE MANAGEMENT
  // ============================================================================

  async getAdminCourses(req: Request, res: Response) {
    const query = req.query as unknown as CourseQueryDto;
    const { items, total } = await coursesService.getAdminCourses(query);
    sendSuccess(res, items, 200, {
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    });
  }

  async createCourse(req: Request, res: Response) {
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const course = await coursesService.createCourse(req.body, actorId, requestId);
    sendSuccess(res, course, 201);
  }

  async getAdminCourseById(req: Request, res: Response) {
    const { id } = req.params;
    const course = await coursesService.getCourseById(id);
    if (!course) {
      res.status(404).json({ success: false, error: { message: 'Course not found', code: 'COURSE_NOT_FOUND' } });
      return;
    }
    const cat = await coursesService.getCategoryById(course.categoryId);
    const modules = await coursesService.getCourseModules(course.id);
    const moduleSyllabus = await Promise.all(
      modules.map(async (m) => {
        const lessons = await coursesService.getModuleLessons(m.id);
        return {
          ...m,
          lessons,
        };
      })
    );

    sendSuccess(res, {
      ...course,
      categoryName: cat?.name || 'General',
      modules: moduleSyllabus,
    });
  }

  async updateCourse(req: Request, res: Response) {
    const { id } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const updated = await coursesService.updateCourse(id, req.body, actorId, requestId);
    sendSuccess(res, updated);
  }

  async publishCourse(req: Request, res: Response) {
    const { id } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const published = await coursesService.publishCourse(id, actorId, requestId);
    sendSuccess(res, published);
  }

  async unpublishCourse(req: Request, res: Response) {
    const { id } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const draft = await coursesService.unpublishCourse(id, actorId, requestId);
    sendSuccess(res, draft);
  }

  async archiveCourse(req: Request, res: Response) {
    const { id } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const archived = await coursesService.archiveCourse(id, actorId, requestId);
    sendSuccess(res, archived);
  }

  async createModule(req: Request, res: Response) {
    const { courseId } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const mod = await coursesService.createModule(courseId, req.body, actorId, requestId);
    sendSuccess(res, mod, 201);
  }

  async updateModule(req: Request, res: Response) {
    const { moduleId } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const mod = await coursesService.updateModule(moduleId, req.body, actorId, requestId);
    sendSuccess(res, mod);
  }

  async deleteModule(req: Request, res: Response) {
    const { moduleId } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    await coursesService.deleteModule(moduleId, actorId, requestId);
    sendSuccess(res, { message: 'Module deleted successfully' });
  }

  async reorderModules(req: Request, res: Response) {
    const { courseId } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const modules = await coursesService.reorderModules(courseId, req.body.items, actorId, requestId);
    sendSuccess(res, modules);
  }

  async createLesson(req: Request, res: Response) {
    const { moduleId } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const lesson = await coursesService.createLesson(moduleId, req.body, actorId, requestId);
    sendSuccess(res, lesson, 201);
  }

  async updateLesson(req: Request, res: Response) {
    const { lessonId } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const lesson = await coursesService.updateLesson(lessonId, req.body, actorId, requestId);
    sendSuccess(res, lesson);
  }

  async deleteLesson(req: Request, res: Response) {
    const { lessonId } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    await coursesService.deleteLesson(lessonId, actorId, requestId);
    sendSuccess(res, { message: 'Lesson deleted successfully' });
  }

  async reorderLessons(req: Request, res: Response) {
    const { moduleId } = req.params;
    const actorId = req.user!.id;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const lessons = await coursesService.reorderLessons(moduleId, req.body.items, actorId, requestId);
    sendSuccess(res, lessons);
  }

  async getAdminCourseEnrollments(req: Request, res: Response) {
    const { id } = req.params;
    const roster = await coursesService.getAdminCourseEnrollments(id);
    sendSuccess(res, roster);
  }
}

export const coursesController = new CoursesController();
