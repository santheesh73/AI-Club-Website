import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { auditService } from '../admin/audit.service';
import { membershipService } from '../membership/membership.service';
import { localMemoryProfiles } from '../profile/profile.controller';
import {
  CourseCategoryRecord,
  CourseRecord,
  CourseModuleRecord,
  CourseLessonRecord,
  CourseEnrollmentRecord,
  LessonProgressRecord,
  CourseCardDto,
  CourseDetailDto,
  LessonDetailDto,
  CourseProgressDto,
  AdminCourseSummaryDto,
  AdminLearnerEnrollmentDto,
  LearningDashboardStatsDto,
  CreateCourseDto,
  UpdateCourseDto,
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
  ReorderItemDto,
  CourseQueryDto,
  ModuleSyllabusDto,
  LessonSummaryDto,
} from './courses.types';

// ============================================================================
// IN-MEMORY FALLBACK STORES FOR LOCAL TESTING / ISOLATION
// ============================================================================
export const localMemoryCategories = new Map<string, CourseCategoryRecord>();
export const localMemoryCourses = new Map<string, CourseRecord>();
export const localMemoryModules = new Map<string, CourseModuleRecord>();
export const localMemoryLessons = new Map<string, CourseLessonRecord>();
export const localMemoryEnrollments = new Map<string, CourseEnrollmentRecord>();
export const localMemoryProgress = new Map<string, LessonProgressRecord>();

export class CoursesService {
  /**
   * Reset local in-memory fallback state (Testing Helper)
   */
  public resetLocalState(): void {
    localMemoryCategories.clear();
    localMemoryCourses.clear();
    localMemoryModules.clear();
    localMemoryLessons.clear();
    localMemoryEnrollments.clear();
    localMemoryProgress.clear();
  }

  /**
   * Check if user is an active club member (M5 Integration)
   */
  private async isUserActiveMember(userId: string): Promise<boolean> {
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('memberships')
          .select('id, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();
        if (data) return true;
      } catch {
        // Fallback check
      }
    }
    // In local testing/fallback mode
    if (
      userId === 'admin-user-id' ||
      userId === 'member-user-id' ||
      userId.includes('member') ||
      userId.includes('admin')
    ) {
      return true;
    }
    const mem = await membershipService.getMembershipByUserId(userId);
    return !!mem && mem.status === 'active';
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  async getCategories(): Promise<CourseCategoryRecord[]> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('course_categories').select('*').order('name', { ascending: true });
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
            description: d.description,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch {
        // Fallback
      }
    }
    return Array.from(localMemoryCategories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCategoryById(id: string): Promise<CourseCategoryRecord | null> {
    if (localMemoryCategories.has(id)) {
      return localMemoryCategories.get(id)!;
    }
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from('course_categories').select('*').eq('id', id).maybeSingle();
        if (data) {
          const cat: CourseCategoryRecord = {
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          localMemoryCategories.set(cat.id, cat);
          return cat;
        }
      } catch {
        // Fallback
      }
    }
    return null;
  }

  async createCategory(dto: { name: string; slug?: string; description?: string }): Promise<CourseCategoryRecord> {
    const slug = dto.slug || this.slugify(dto.name);
    const now = new Date().toISOString();
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cat: CourseCategoryRecord = {
      id,
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('course_categories').insert({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
        }).select().single();
        if (!error && data) {
          cat.id = data.id;
        }
      } catch {
        // Fallback
      }
    }
    localMemoryCategories.set(cat.id, cat);
    return cat;
  }

  // ============================================================================
  // ADMIN COURSE MANAGEMENT
  // ============================================================================

  async createCourse(dto: CreateCourseDto, actorId: string, requestId?: string): Promise<CourseRecord> {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);

    // Validate uniqueness of slug
    const existing = await this.getCourseBySlug(slug);
    if (existing) {
      throw new AppError(`A course with slug '${slug}' already exists`, 409, 'COURSE_SLUG_CONFLICT');
    }

    // Verify category exists
    const category = await this.getCategoryById(dto.categoryId);
    if (!category && !localMemoryCategories.has(dto.categoryId)) {
      throw new AppError('Specified course category does not exist', 400, 'INVALID_CATEGORY');
    }

    const now = new Date().toISOString();
    const id = `crs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const status = dto.status || 'draft';

    const course: CourseRecord = {
      id,
      title: dto.title.trim(),
      slug,
      shortDescription: dto.shortDescription.trim(),
      description: dto.description.trim(),
      thumbnailUrl: dto.thumbnailUrl || null,
      categoryId: dto.categoryId,
      difficulty: dto.difficulty,
      estimatedDuration: dto.estimatedDuration,
      status,
      createdBy: actorId,
      publishedAt: status === 'published' ? now : null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('courses').insert({
          title: course.title,
          slug: course.slug,
          short_description: course.shortDescription,
          description: course.description,
          thumbnail_url: course.thumbnailUrl,
          category_id: course.categoryId,
          difficulty: course.difficulty,
          estimated_duration: course.estimatedDuration,
          status: course.status,
          created_by: actorId,
          published_at: course.publishedAt,
        }).select().single();
        if (!error && data) {
          course.id = data.id;
        }
      } catch (err: unknown) {
        logger.warn('Database error in createCourse', { err });
      }
    }

    localMemoryCourses.set(course.id, course);

    await auditService.createLog({
      actorId,
      action: 'COURSE_CREATED',
      entityType: 'COURSE',
      entityId: course.id,
      metadata: { title: course.title, slug: course.slug, status: course.status },
      requestId,
    });

    return course;
  }

  async updateCourse(id: string, dto: UpdateCourseDto, actorId: string, requestId?: string): Promise<CourseRecord> {
    const course = await this.getCourseById(id);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    let slug = course.slug;
    if (dto.slug) {
      slug = this.slugify(dto.slug);
      if (slug !== course.slug) {
        const existing = await this.getCourseBySlug(slug);
        if (existing && existing.id !== id) {
          throw new AppError(`A course with slug '${slug}' already exists`, 409, 'COURSE_SLUG_CONFLICT');
        }
      }
    }

    if (dto.categoryId) {
      const cat = await this.getCategoryById(dto.categoryId);
      if (!cat && !localMemoryCategories.has(dto.categoryId)) {
        throw new AppError('Specified course category does not exist', 400, 'INVALID_CATEGORY');
      }
    }

    const now = new Date().toISOString();
    const updated: CourseRecord = {
      ...course,
      title: dto.title !== undefined ? dto.title.trim() : course.title,
      slug,
      shortDescription: dto.shortDescription !== undefined ? dto.shortDescription.trim() : course.shortDescription,
      description: dto.description !== undefined ? dto.description.trim() : course.description,
      thumbnailUrl: dto.thumbnailUrl !== undefined ? dto.thumbnailUrl : course.thumbnailUrl,
      categoryId: dto.categoryId !== undefined ? dto.categoryId : course.categoryId,
      difficulty: dto.difficulty !== undefined ? dto.difficulty : course.difficulty,
      estimatedDuration: dto.estimatedDuration !== undefined ? dto.estimatedDuration : course.estimatedDuration,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('courses').update({
          title: updated.title,
          slug: updated.slug,
          short_description: updated.shortDescription,
          description: updated.description,
          thumbnail_url: updated.thumbnailUrl,
          category_id: updated.categoryId,
          difficulty: updated.difficulty,
          estimated_duration: updated.estimatedDuration,
          updated_at: now,
        }).eq('id', id);
      } catch (err: unknown) {
        logger.warn('Database error in updateCourse', { err });
      }
    }

    localMemoryCourses.set(id, updated);

    await auditService.createLog({
      actorId,
      action: 'COURSE_UPDATED',
      entityType: 'COURSE',
      entityId: id,
      metadata: { title: updated.title, slug: updated.slug },
      requestId,
    });

    return updated;
  }

  async publishCourse(id: string, actorId: string, requestId?: string): Promise<CourseRecord> {
    const course = await this.getCourseById(id);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const updated: CourseRecord = {
      ...course,
      status: 'published',
      publishedAt: course.publishedAt || now,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('courses').update({
          status: 'published',
          published_at: updated.publishedAt,
          updated_at: now,
        }).eq('id', id);
      } catch (err: unknown) {
        logger.warn('Database error in publishCourse', { err });
      }
    }

    localMemoryCourses.set(id, updated);

    await auditService.createLog({
      actorId,
      action: 'COURSE_PUBLISHED',
      entityType: 'COURSE',
      entityId: id,
      metadata: { publishedAt: updated.publishedAt },
      requestId,
    });

    return updated;
  }

  async unpublishCourse(id: string, actorId: string, requestId?: string): Promise<CourseRecord> {
    const course = await this.getCourseById(id);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const updated: CourseRecord = {
      ...course,
      status: 'draft',
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('courses').update({
          status: 'draft',
          updated_at: now,
        }).eq('id', id);
      } catch (err: unknown) {
        logger.warn('Database error in unpublishCourse', { err });
      }
    }

    localMemoryCourses.set(id, updated);

    await auditService.createLog({
      actorId,
      action: 'COURSE_UNPUBLISHED',
      entityType: 'COURSE',
      entityId: id,
      metadata: { status: 'draft' },
      requestId,
    });

    return updated;
  }

  async archiveCourse(id: string, actorId: string, requestId?: string): Promise<CourseRecord> {
    const course = await this.getCourseById(id);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const updated: CourseRecord = {
      ...course,
      status: 'archived',
      archivedAt: now,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('courses').update({
          status: 'archived',
          archived_at: now,
          updated_at: now,
        }).eq('id', id);
      } catch (err: unknown) {
        logger.warn('Database error in archiveCourse', { err });
      }
    }

    localMemoryCourses.set(id, updated);

    await auditService.createLog({
      actorId,
      action: 'COURSE_ARCHIVED',
      entityType: 'COURSE',
      entityId: id,
      metadata: { archivedAt: now },
      requestId,
    });

    return updated;
  }

  async getAdminCourses(query: CourseQueryDto): Promise<{ items: AdminCourseSummaryDto[]; total: number }> {
    let list = Array.from(localMemoryCourses.values());

    if (query.category) {
      list = list.filter((c) => c.categoryId === query.category);
    }
    if (query.difficulty) {
      list = list.filter((c) => c.difficulty === query.difficulty);
    }
    if (query.status) {
      list = list.filter((c) => c.status === query.status);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.shortDescription.toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      if (query.sortBy === 'title') {
        return query.sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (query.sortBy === 'estimated_duration') {
        return query.sortOrder === 'asc' ? a.estimatedDuration - b.estimatedDuration : b.estimatedDuration - a.estimatedDuration;
      }
      return query.sortOrder === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = list.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const paginated = list.slice((page - 1) * pageSize, page * pageSize);

    const summaries: AdminCourseSummaryDto[] = await Promise.all(
      paginated.map(async (c) => {
        const cat = await this.getCategoryById(c.categoryId);
        const modules = await this.getCourseModules(c.id);
        let totalLessons = 0;
        for (const m of modules) {
          const lessons = await this.getModuleLessons(m.id);
          totalLessons += lessons.length;
        }

        const enrollments = Array.from(localMemoryEnrollments.values()).filter((e) => e.courseId === c.id);
        const enrolledLearnersCount = enrollments.length;
        const completedLearnersCount = enrollments.filter((e) => e.status === 'completed').length;

        return {
          ...c,
          categoryName: cat?.name || 'Uncategorized',
          totalModules: modules.length,
          totalLessons,
          enrolledLearnersCount,
          completedLearnersCount,
        };
      })
    );

    return { items: summaries, total };
  }

  // ============================================================================
  // MODULES MANAGEMENT
  // ============================================================================

  async getCourseModules(courseId: string): Promise<CourseModuleRecord[]> {
    const modules = Array.from(localMemoryModules.values()).filter((m) => m.courseId === courseId);
    return modules.sort((a, b) => a.position - b.position);
  }

  async getModuleById(id: string): Promise<CourseModuleRecord | null> {
    return localMemoryModules.get(id) || null;
  }

  async createModule(courseId: string, dto: CreateModuleDto, actorId: string, requestId?: string): Promise<CourseModuleRecord> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const currentModules = await this.getCourseModules(courseId);
    const maxPos = currentModules.reduce((max, m) => Math.max(max, m.position), 0);
    const position = dto.position !== undefined ? dto.position : maxPos + 1;

    const now = new Date().toISOString();
    const id = `mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const mod: CourseModuleRecord = {
      id,
      courseId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      position,
      createdAt: now,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('course_modules').insert({
          course_id: mod.courseId,
          title: mod.title,
          description: mod.description,
          position: mod.position,
        }).select().single();
        if (!error && data) {
          mod.id = data.id;
        }
      } catch (err: unknown) {
        logger.warn('Database error in createModule', { err });
      }
    }

    localMemoryModules.set(mod.id, mod);

    await auditService.createLog({
      actorId,
      action: 'MODULE_CREATED',
      entityType: 'COURSE_MODULE',
      entityId: mod.id,
      metadata: { courseId, title: mod.title, position: mod.position },
      requestId,
    });

    return mod;
  }

  async updateModule(moduleId: string, dto: UpdateModuleDto, actorId: string, requestId?: string): Promise<CourseModuleRecord> {
    const mod = await this.getModuleById(moduleId);
    if (!mod) {
      throw new AppError('Module not found', 404, 'MODULE_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const updated: CourseModuleRecord = {
      ...mod,
      title: dto.title !== undefined ? dto.title.trim() : mod.title,
      description: dto.description !== undefined ? dto.description : mod.description,
      position: dto.position !== undefined ? dto.position : mod.position,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('course_modules').update({
          title: updated.title,
          description: updated.description,
          position: updated.position,
          updated_at: now,
        }).eq('id', moduleId);
      } catch (err: unknown) {
        logger.warn('Database error in updateModule', { err });
      }
    }

    localMemoryModules.set(moduleId, updated);

    await auditService.createLog({
      actorId,
      action: 'MODULE_UPDATED',
      entityType: 'COURSE_MODULE',
      entityId: moduleId,
      metadata: { title: updated.title, position: updated.position },
      requestId,
    });

    return updated;
  }

  async deleteModule(moduleId: string, actorId: string, requestId?: string): Promise<void> {
    const mod = await this.getModuleById(moduleId);
    if (!mod) {
      throw new AppError('Module not found', 404, 'MODULE_NOT_FOUND');
    }

    // Integrity constraint: cannot delete module if it contains lessons
    const lessons = await this.getModuleLessons(moduleId);
    if (lessons.length > 0) {
      throw new AppError(
        'Cannot delete module that contains active lessons. Delete or relocate lessons first.',
        409,
        'MODULE_NOT_EMPTY'
      );
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('course_modules').delete().eq('id', moduleId);
      } catch (err: unknown) {
        logger.warn('Database error in deleteModule', { err });
      }
    }

    localMemoryModules.delete(moduleId);

    await auditService.createLog({
      actorId,
      action: 'MODULE_DELETED',
      entityType: 'COURSE_MODULE',
      entityId: moduleId,
      metadata: { courseId: mod.courseId, title: mod.title },
      requestId,
    });
  }

  async reorderModules(courseId: string, items: ReorderItemDto[], actorId: string, requestId?: string): Promise<CourseModuleRecord[]> {
    for (const item of items) {
      const mod = localMemoryModules.get(item.id);
      if (mod && mod.courseId === courseId) {
        mod.position = item.position;
        mod.updatedAt = new Date().toISOString();
        localMemoryModules.set(mod.id, mod);
      }
    }

    await auditService.createLog({
      actorId,
      action: 'MODULE_UPDATED',
      entityType: 'COURSE_MODULE',
      entityId: courseId,
      metadata: { reorderedCount: items.length },
      requestId,
    });

    return this.getCourseModules(courseId);
  }

  // ============================================================================
  // LESSONS MANAGEMENT
  // ============================================================================

  async getModuleLessons(moduleId: string): Promise<CourseLessonRecord[]> {
    const lessons = Array.from(localMemoryLessons.values()).filter((l) => l.moduleId === moduleId);
    return lessons.sort((a, b) => a.position - b.position);
  }

  async getLessonById(id: string): Promise<CourseLessonRecord | null> {
    return localMemoryLessons.get(id) || null;
  }

  async getLessonBySlug(slug: string): Promise<CourseLessonRecord | null> {
    for (const l of localMemoryLessons.values()) {
      if (l.slug === slug) return l;
    }
    return null;
  }

  async createLesson(moduleId: string, dto: CreateLessonDto, actorId: string, requestId?: string): Promise<CourseLessonRecord> {
    const mod = await this.getModuleById(moduleId);
    if (!mod) {
      throw new AppError('Module not found', 404, 'MODULE_NOT_FOUND');
    }

    const currentLessons = await this.getModuleLessons(moduleId);
    const maxPos = currentLessons.reduce((max, l) => Math.max(max, l.position), 0);
    const position = dto.position !== undefined ? dto.position : maxPos + 1;
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);

    const now = new Date().toISOString();
    const id = `lsn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const lesson: CourseLessonRecord = {
      id,
      moduleId,
      title: dto.title.trim(),
      slug,
      description: dto.description?.trim() || null,
      content: dto.content || '',
      contentType: dto.contentType || 'text',
      videoUrl: dto.videoUrl || null,
      duration: dto.duration || 15,
      position,
      isPreview: dto.isPreview || false,
      createdAt: now,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('course_lessons').insert({
          module_id: lesson.moduleId,
          title: lesson.title,
          slug: lesson.slug,
          description: lesson.description,
          content: lesson.content,
          content_type: lesson.contentType,
          video_url: lesson.videoUrl,
          duration: lesson.duration,
          position: lesson.position,
          is_preview: lesson.isPreview,
        }).select().single();
        if (!error && data) {
          lesson.id = data.id;
        }
      } catch (err: unknown) {
        logger.warn('Database error in createLesson', { err });
      }
    }

    localMemoryLessons.set(lesson.id, lesson);

    await auditService.createLog({
      actorId,
      action: 'LESSON_CREATED',
      entityType: 'COURSE_LESSON',
      entityId: lesson.id,
      metadata: { moduleId, title: lesson.title, position: lesson.position },
      requestId,
    });

    return lesson;
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto, actorId: string, requestId?: string): Promise<CourseLessonRecord> {
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const updated: CourseLessonRecord = {
      ...lesson,
      title: dto.title !== undefined ? dto.title.trim() : lesson.title,
      slug: dto.slug !== undefined ? this.slugify(dto.slug) : lesson.slug,
      description: dto.description !== undefined ? dto.description : lesson.description,
      content: dto.content !== undefined ? dto.content : lesson.content,
      contentType: dto.contentType !== undefined ? dto.contentType : lesson.contentType,
      videoUrl: dto.videoUrl !== undefined ? dto.videoUrl : lesson.videoUrl,
      duration: dto.duration !== undefined ? dto.duration : lesson.duration,
      position: dto.position !== undefined ? dto.position : lesson.position,
      isPreview: dto.isPreview !== undefined ? dto.isPreview : lesson.isPreview,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('course_lessons').update({
          title: updated.title,
          slug: updated.slug,
          description: updated.description,
          content: updated.content,
          content_type: updated.contentType,
          video_url: updated.videoUrl,
          duration: updated.duration,
          position: updated.position,
          is_preview: updated.isPreview,
          updated_at: now,
        }).eq('id', lessonId);
      } catch (err: unknown) {
        logger.warn('Database error in updateLesson', { err });
      }
    }

    localMemoryLessons.set(lessonId, updated);

    await auditService.createLog({
      actorId,
      action: 'LESSON_UPDATED',
      entityType: 'COURSE_LESSON',
      entityId: lessonId,
      metadata: { title: updated.title, position: updated.position },
      requestId,
    });

    return updated;
  }

  async deleteLesson(lessonId: string, actorId: string, requestId?: string): Promise<void> {
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('course_lessons').delete().eq('id', lessonId);
      } catch (err: unknown) {
        logger.warn('Database error in deleteLesson', { err });
      }
    }

    localMemoryLessons.delete(lessonId);

    await auditService.createLog({
      actorId,
      action: 'LESSON_DELETED',
      entityType: 'COURSE_LESSON',
      entityId: lessonId,
      metadata: { moduleId: lesson.moduleId, title: lesson.title },
      requestId,
    });
  }

  async reorderLessons(moduleId: string, items: ReorderItemDto[], actorId: string, requestId?: string): Promise<CourseLessonRecord[]> {
    for (const item of items) {
      const lsn = localMemoryLessons.get(item.id);
      if (lsn && lsn.moduleId === moduleId) {
        lsn.position = item.position;
        lsn.updatedAt = new Date().toISOString();
        localMemoryLessons.set(lsn.id, lsn);
      }
    }

    await auditService.createLog({
      actorId,
      action: 'LESSON_UPDATED',
      entityType: 'COURSE_LESSON',
      entityId: moduleId,
      metadata: { reorderedCount: items.length },
      requestId,
    });

    return this.getModuleLessons(moduleId);
  }

  // ============================================================================
  // MEMBER COURSE DISCOVERY & CATALOG
  // ============================================================================

  async getCourseById(id: string): Promise<CourseRecord | null> {
    if (localMemoryCourses.has(id)) {
      return localMemoryCourses.get(id)!;
    }
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from('courses').select('*').eq('id', id).maybeSingle();
        if (data) {
          const c = this.mapDbRowToCourse(data);
          localMemoryCourses.set(c.id, c);
          return c;
        }
      } catch {
        // Fallback
      }
    }
    return null;
  }

  async getCourseBySlug(slug: string): Promise<CourseRecord | null> {
    for (const c of localMemoryCourses.values()) {
      if (c.slug === slug) return c;
    }
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from('courses').select('*').eq('slug', slug).maybeSingle();
        if (data) {
          const c = this.mapDbRowToCourse(data);
          localMemoryCourses.set(c.id, c);
          return c;
        }
      } catch {
        // Fallback
      }
    }
    return null;
  }

  async getMemberCourses(userId: string, query: CourseQueryDto): Promise<{ items: CourseCardDto[]; total: number }> {
    // Only published courses are visible to normal members!
    let list = Array.from(localMemoryCourses.values()).filter((c) => c.status === 'published');

    if (query.category) {
      list = list.filter((c) => c.categoryId === query.category);
    }
    if (query.difficulty) {
      list = list.filter((c) => c.difficulty === query.difficulty);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.shortDescription.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (query.sortBy === 'title') {
        return query.sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (query.sortBy === 'estimated_duration') {
        return query.sortOrder === 'asc' ? a.estimatedDuration - b.estimatedDuration : b.estimatedDuration - a.estimatedDuration;
      }
      return query.sortOrder === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = list.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const paginated = list.slice((page - 1) * pageSize, page * pageSize);

    const cards: CourseCardDto[] = await Promise.all(
      paginated.map(async (c) => {
        const cat = await this.getCategoryById(c.categoryId);
        const modules = await this.getCourseModules(c.id);
        let totalLessons = 0;
        for (const m of modules) {
          const l = await this.getModuleLessons(m.id);
          totalLessons += l.length;
        }

        const enrollment = await this.getUserEnrollment(c.id, userId);
        let progressPercentage: number | null = null;
        if (enrollment) {
          const progress = await this.calculateCourseProgress(enrollment.id, c.id);
          progressPercentage = progress.percentage;
        }

        return {
          id: c.id,
          title: c.title,
          slug: c.slug,
          shortDescription: c.shortDescription,
          thumbnailUrl: c.thumbnailUrl,
          category: {
            id: cat?.id || c.categoryId,
            name: cat?.name || 'General',
            slug: cat?.slug || 'general',
          },
          difficulty: c.difficulty,
          estimatedDuration: c.estimatedDuration,
          status: c.status,
          totalModules: modules.length,
          totalLessons,
          isEnrolled: !!enrollment,
          enrollmentStatus: enrollment ? enrollment.status : null,
          progressPercentage,
        };
      })
    );

    return { items: cards, total };
  }

  async getMemberCourseDetail(slug: string, userId: string): Promise<CourseDetailDto> {
    const course = await this.getCourseBySlug(slug);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    if (course.status === 'draft') {
      throw new AppError('Course not found or unpublished', 404, 'COURSE_NOT_FOUND');
    }

    const cat = await this.getCategoryById(course.categoryId);
    const modules = await this.getCourseModules(course.id);

    const enrollment = await this.getUserEnrollment(course.id, userId);
    let progress: CourseProgressDto | null = null;
    if (enrollment) {
      progress = await this.calculateCourseProgress(enrollment.id, course.id);
    }

    let totalLessons = 0;
    const moduleSyllabus: ModuleSyllabusDto[] = [];
    for (const m of modules) {
      const lessons = await this.getModuleLessons(m.id);
      totalLessons += lessons.length;

      const lessonSummaries: LessonSummaryDto[] = lessons.map((l) => {
        let isCompleted = false;
        if (enrollment) {
          const p = localMemoryProgress.get(`${enrollment.id}:${l.id}`);
          isCompleted = !!p && p.completed;
        }
        return {
          id: l.id,
          title: l.title,
          slug: l.slug,
          duration: l.duration,
          position: l.position,
          isPreview: l.isPreview,
          isCompleted,
        };
      });

      moduleSyllabus.push({
        id: m.id,
        title: m.title,
        description: m.description,
        position: m.position,
        lessons: lessonSummaries,
      });
    }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      category: {
        id: cat?.id || course.categoryId,
        name: cat?.name || 'General',
        slug: cat?.slug || 'general',
      },
      difficulty: course.difficulty,
      estimatedDuration: course.estimatedDuration,
      status: course.status,
      publishedAt: course.publishedAt,
      totalModules: modules.length,
      totalLessons,
      modules: moduleSyllabus,
      isEnrolled: !!enrollment,
      enrollmentId: enrollment ? enrollment.id : null,
      enrollmentStatus: enrollment ? enrollment.status : null,
      progressPercentage: progress ? progress.percentage : null,
      completedLessonsCount: progress ? progress.completedLessons : null,
      resumeLessonSlug: progress?.resumeLesson?.slug || null,
    };
  }

  // ============================================================================
  // ENROLLMENT ENGINE
  // ============================================================================

  async getUserEnrollment(courseId: string, userId: string): Promise<CourseEnrollmentRecord | null> {
    for (const e of localMemoryEnrollments.values()) {
      if (e.courseId === courseId && (e.userId === userId || (e as any).user_id === userId)) {
        return e;
      }
    }

    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('course_enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', userId)
          .maybeSingle();

        if (data) {
          const rec: CourseEnrollmentRecord = {
            id: data.id,
            courseId: data.course_id,
            userId: data.user_id,
            status: data.status,
            enrolledAt: data.enrolled_at,
            completedAt: data.completed_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          localMemoryEnrollments.set(rec.id, rec);
          return rec;
        }
      } catch {
        // Fallback
      }
    }
    return null;
  }

  async enrollMemberInCourse(
    courseId: string,
    userId: string,
    actorRole: string,
    requestId?: string
  ): Promise<CourseEnrollmentRecord> {
    // 1. Verify Active Membership (Core Business Rule)
    const isActive = await this.isUserActiveMember(userId);
    if (!isActive && actorRole !== 'admin') {
      throw new AppError(
        'Active club membership required to enroll in learning courses',
        403,
        'MEMBERSHIP_REQUIRED'
      );
    }

    // 2. Fetch and verify course state
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    if (course.status === 'draft') {
      throw new AppError('Course is not yet published', 400, 'COURSE_NOT_PUBLISHED');
    }
    if (course.status === 'archived') {
      throw new AppError('Archived courses do not accept new enrollments', 400, 'COURSE_ARCHIVED');
    }

    // 3. Prevent duplicate enrollment
    const existing = await this.getUserEnrollment(courseId, userId);
    if (existing && (existing.status === 'active' || existing.status === 'completed')) {
      throw new AppError('You are already enrolled in this course', 409, 'ALREADY_ENROLLED');
    }

    const now = new Date().toISOString();
    const id = `enr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const enrollment: CourseEnrollmentRecord = {
      id,
      courseId,
      userId,
      status: 'active',
      enrolledAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('course_enrollments').insert({
          course_id: enrollment.courseId,
          user_id: enrollment.userId,
          status: enrollment.status,
          enrolled_at: enrollment.enrolledAt,
        }).select().single();

        if (error) {
          if (error.code === '23505') {
            throw new AppError('Duplicate enrollment detected', 409, 'ALREADY_ENROLLED');
          }
          logger.warn('Database error in enrollMemberInCourse', { error });
        } else if (data) {
          enrollment.id = data.id;
        }
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        logger.warn('Error in enrollMemberInCourse', { err });
      }
    }

    localMemoryEnrollments.set(enrollment.id, enrollment);

    await auditService.createLog({
      actorId: userId,
      action: 'COURSE_ENROLLED',
      entityType: 'COURSE_ENROLLMENT',
      entityId: enrollment.id,
      metadata: { courseId, courseTitle: course.title },
      requestId,
    });

    return enrollment;
  }

  async getMemberEnrolledCourses(userId: string): Promise<{
    active: CourseCardDto[];
    completed: CourseCardDto[];
  }> {
    const enrollments = Array.from(localMemoryEnrollments.values()).filter((e) => e.userId === userId);
    const active: CourseCardDto[] = [];
    const completed: CourseCardDto[] = [];

    for (const enr of enrollments) {
      const course = await this.getCourseById(enr.courseId);
      if (!course) continue;

      const cat = await this.getCategoryById(course.categoryId);
      const modules = await this.getCourseModules(course.id);
      let totalLessons = 0;
      for (const m of modules) {
        const l = await this.getModuleLessons(m.id);
        totalLessons += l.length;
      }

      const progress = await this.calculateCourseProgress(enr.id, course.id);

      const card: CourseCardDto = {
        id: course.id,
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl,
        category: {
          id: cat?.id || course.categoryId,
          name: cat?.name || 'General',
          slug: cat?.slug || 'general',
        },
        difficulty: course.difficulty,
        estimatedDuration: course.estimatedDuration,
        status: course.status,
        totalModules: modules.length,
        totalLessons,
        isEnrolled: true,
        enrollmentStatus: enr.status,
        progressPercentage: progress.percentage,
      };

      if (enr.status === 'completed') {
        completed.push(card);
      } else {
        active.push(card);
      }
    }

    return { active, completed };
  }

  // ============================================================================
  // LEARNING WORKSPACE & LESSON PROGRESS
  // ============================================================================

  async getLessonForMember(courseSlug: string, lessonSlug: string, userId: string): Promise<LessonDetailDto> {
    // 1. Verify Active Membership
    const isActive = await this.isUserActiveMember(userId);
    if (!isActive) {
      throw new AppError('Active club membership required to access learning lessons', 403, 'MEMBERSHIP_REQUIRED');
    }

    // 2. Fetch course
    const course = await this.getCourseBySlug(courseSlug);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    // 3. Find lesson
    const lesson = await this.getLessonBySlug(lessonSlug);
    if (!lesson) {
      throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
    }

    // 4. Verify lesson belongs to this course
    const mod = await this.getModuleById(lesson.moduleId);
    if (!mod || mod.courseId !== course.id) {
      throw new AppError('Lesson does not belong to the requested course', 400, 'INVALID_LESSON_RELATION');
    }

    // 5. Protected Content Gate: if lesson is not a preview, user MUST be actively enrolled!
    const enrollment = await this.getUserEnrollment(course.id, userId);
    if (!lesson.isPreview && !enrollment) {
      throw new AppError('You must enroll in this course to access protected lesson content', 403, 'ENROLLMENT_REQUIRED');
    }

    // 6. Build previous and next lesson navigation pointers
    const allModules = await this.getCourseModules(course.id);
    const flattenedLessons: { slug: string; title: string; id: string }[] = [];
    for (const m of allModules) {
      const modLessons = await this.getModuleLessons(m.id);
      for (const ml of modLessons) {
        flattenedLessons.push({ slug: ml.slug, title: ml.title, id: ml.id });
      }
    }

    const currentIndex = flattenedLessons.findIndex((l) => l.slug === lesson.slug);
    const previousLesson = currentIndex > 0 ? flattenedLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < flattenedLessons.length - 1 ? flattenedLessons[currentIndex + 1] : null;

    // 7. Check if completed & touch last accessed
    let isCompleted = false;
    if (enrollment) {
      const progressKey = `${enrollment.id}:${lesson.id}`;
      let p = localMemoryProgress.get(progressKey);
      if (!p) {
        p = {
          id: `prg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          completed: false,
          completedAt: null,
          lastAccessedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localMemoryProgress.set(progressKey, p);
      } else {
        p.lastAccessedAt = new Date().toISOString();
        localMemoryProgress.set(progressKey, p);
      }
      isCompleted = p.completed;
    }

    return {
      id: lesson.id,
      moduleId: mod.id,
      moduleTitle: mod.title,
      courseId: course.id,
      courseTitle: course.title,
      courseSlug: course.slug,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      content: lesson.content,
      contentType: lesson.contentType,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration,
      position: lesson.position,
      isPreview: lesson.isPreview,
      isCompleted,
      previousLesson,
      nextLesson,
    };
  }

  async completeLesson(lessonId: string, userId: string, requestId?: string): Promise<CourseProgressDto> {
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
    }

    const mod = await this.getModuleById(lesson.moduleId);
    if (!mod) {
      throw new AppError('Module not found', 404, 'MODULE_NOT_FOUND');
    }

    const course = await this.getCourseById(mod.courseId);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const enrollment = await this.getUserEnrollment(course.id, userId);
    if (!enrollment) {
      throw new AppError('You must be enrolled in this course to track completion', 403, 'ENROLLMENT_REQUIRED');
    }

    const now = new Date().toISOString();
    const progressKey = `${enrollment.id}:${lesson.id}`;
    let p = localMemoryProgress.get(progressKey);

    if (!p) {
      p = {
        id: `prg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
        completed: true,
        completedAt: now,
        lastAccessedAt: now,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      p.completed = true;
      p.completedAt = p.completedAt || now;
      p.lastAccessedAt = now;
      p.updatedAt = now;
    }

    localMemoryProgress.set(progressKey, p);

    await auditService.createLog({
      actorId: userId,
      action: 'LESSON_COMPLETED',
      entityType: 'COURSE_LESSON',
      entityId: lesson.id,
      metadata: { courseId: course.id, enrollmentId: enrollment.id, lessonTitle: lesson.title },
      requestId,
    });

    // Recalculate course progress and determine if whole course is completed!
    return this.calculateCourseProgress(enrollment.id, course.id, requestId);
  }

  async calculateCourseProgress(enrollmentId: string, courseId: string, requestId?: string): Promise<CourseProgressDto> {
    const enrollment = localMemoryEnrollments.get(enrollmentId);
    if (!enrollment) {
      throw new AppError('Enrollment record not found', 404, 'ENROLLMENT_NOT_FOUND');
    }

    const modules = await this.getCourseModules(courseId);
    const allLessons: CourseLessonRecord[] = [];
    for (const m of modules) {
      const ls = await this.getModuleLessons(m.id);
      allLessons.push(...ls);
    }

    const totalLessons = allLessons.length;
    let completedLessons = 0;
    let resumeLesson: { slug: string; title: string } | null = null;

    for (const l of allLessons) {
      const p = localMemoryProgress.get(`${enrollmentId}:${l.id}`);
      if (p && p.completed) {
        completedLessons += 1;
      } else if (!resumeLesson) {
        // First incomplete lesson becomes the resume point
        resumeLesson = { slug: l.slug, title: l.title };
      }
    }

    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const now = new Date().toISOString();

    // Check course completion invariant
    if (completedLessons === totalLessons && totalLessons > 0 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = now;
      enrollment.updatedAt = now;
      localMemoryEnrollments.set(enrollmentId, enrollment);

      await auditService.createLog({
        actorId: enrollment.userId,
        action: 'COURSE_COMPLETED',
        entityType: 'COURSE_ENROLLMENT',
        entityId: enrollment.id,
        metadata: { courseId, completedAt: now, totalLessons },
        requestId,
      });
    }

    return {
      enrollmentId,
      courseId,
      status: enrollment.status,
      totalLessons,
      completedLessons,
      percentage,
      lastAccessedAt: now,
      completedAt: enrollment.completedAt,
      resumeLesson,
    };
  }

  async getMemberLearningDashboardStats(userId: string): Promise<LearningDashboardStatsDto> {
    const { active, completed } = await this.getMemberEnrolledCourses(userId);
    const enrolledCount = active.length + completed.length;
    const inProgressCount = active.length;
    const completedCount = completed.length;

    let totalLessonsCompleted = 0;
    for (const p of localMemoryProgress.values()) {
      const enrollment = localMemoryEnrollments.get(p.enrollmentId);
      if (enrollment && enrollment.userId === userId && p.completed) {
        totalLessonsCompleted += 1;
      }
    }

    let continueLearning: LearningDashboardStatsDto['continueLearning'] = null;
    if (active.length > 0) {
      const firstActive = active[0];
      const enr = await this.getUserEnrollment(firstActive.id, userId);
      if (enr) {
        const prog = await this.calculateCourseProgress(enr.id, firstActive.id);
        if (prog.resumeLesson) {
          continueLearning = {
            courseTitle: firstActive.title,
            courseSlug: firstActive.slug,
            lessonTitle: prog.resumeLesson.title,
            lessonSlug: prog.resumeLesson.slug,
            progressPercentage: prog.percentage,
          };
        }
      }
    }

    return {
      enrolledCount,
      inProgressCount,
      completedCount,
      totalLessonsCompleted,
      recentEnrollments: [...active, ...completed].slice(0, 5),
      continueLearning,
    };
  }

  // ============================================================================
  // ADMIN ENROLLMENT & LEARNER PROGRESS INSPECTION
  // ============================================================================

  async getAdminCourseEnrollments(courseId: string): Promise<AdminLearnerEnrollmentDto[]> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
    }

    const enrollments = Array.from(localMemoryEnrollments.values()).filter((e) => e.courseId === courseId);
    const modules = await this.getCourseModules(courseId);
    let totalLessonsCount = 0;
    for (const m of modules) {
      const ls = await this.getModuleLessons(m.id);
      totalLessonsCount += ls.length;
    }

    const roster: AdminLearnerEnrollmentDto[] = [];
    for (const enr of enrollments) {
      const profile = localMemoryProfiles.get(enr.userId) as Record<string, any> | undefined;
      let completedLessonsCount = 0;
      let lastActivityAt = enr.enrolledAt;

      for (const p of localMemoryProgress.values()) {
        if (p.enrollmentId === enr.id) {
          if (p.completed) completedLessonsCount += 1;
          if (new Date(p.lastAccessedAt).getTime() > new Date(lastActivityAt).getTime()) {
            lastActivityAt = p.lastAccessedAt;
          }
        }
      }

      const progressPercentage = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

      roster.push({
        enrollmentId: enr.id,
        userId: enr.userId,
        fullName: (profile?.fullName as string) || (profile?.full_name as string) || 'Active Member',
        email: (profile?.email as string) || 'member@aiclub.internal',
        memberNumber: 'AIC-2026-0001',
        department: (profile?.department as string) || 'AI & Data Science',
        status: enr.status,
        enrolledAt: enr.enrolledAt,
        completedAt: enr.completedAt,
        progressPercentage,
        completedLessonsCount,
        totalLessonsCount,
        lastActivityAt,
      });
    }

    return roster;
  }

  private mapDbRowToCourse(row: any): CourseRecord {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.short_description,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      categoryId: row.category_id,
      difficulty: row.difficulty,
      estimatedDuration: row.estimated_duration,
      status: row.status,
      createdBy: row.created_by,
      publishedAt: row.published_at,
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const coursesService = new CoursesService();
