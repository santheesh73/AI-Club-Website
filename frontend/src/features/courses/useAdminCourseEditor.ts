import { useState, useEffect, useCallback } from 'react';
import { coursesApi } from '@/services/coursesApi';
import type {
  CourseDetailDto,
  CourseCategoryRecord,
  UpdateCourseDto,
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
  ReorderItemDto,
} from '@/types/courses';

export function useAdminCourseEditor(courseId: string | undefined) {
  const [course, setCourse] = useState<CourseDetailDto | null>(null);
  const [categories, setCategories] = useState<CourseCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    let isMounted = true;
    coursesApi.getCategories()
      .then((res) => {
        if (isMounted && res.success) {
          setCategories(res.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await coursesApi.getAdminCourseById(courseId);
      if (res.success) {
        setCourse(res.data);
      } else {
        setError(res.error.message || 'Course not found');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading course';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const updateCourse = async (data: UpdateCourseDto) => {
    if (!courseId) return false;
    const res = await coursesApi.updateCourse(courseId, data);
    if (res.success) {
      await fetchCourse();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to update course');
  };

  const createModule = async (data: CreateModuleDto) => {
    if (!courseId) return false;
    const res = await coursesApi.createModule(courseId, data);
    if (res.success) {
      await fetchCourse();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to create module');
  };

  const updateModule = async (moduleId: string, data: UpdateModuleDto) => {
    if (!courseId) return false;
    const res = await coursesApi.updateModule(courseId, moduleId, data);
    if (res.success) {
      await fetchCourse();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to update module');
  };

  const deleteModule = async (moduleId: string) => {
    if (!courseId) return false;
    const res = await coursesApi.deleteModule(courseId, moduleId);
    if (res.success) {
      await fetchCourse();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to delete module');
  };

  const reorderModules = async (items: ReorderItemDto[]) => {
    if (!courseId) return false;
    const res = await coursesApi.reorderModules(courseId, items);
    if (res.success) {
      await fetchCourse();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to reorder modules');
  };

  const createLesson = async (moduleId: string, data: CreateLessonDto) => {
    if (!courseId) return false;
    const res = await coursesApi.createLesson(courseId, moduleId, data);
    if (res.success) {
      await fetchCourse();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to create lesson');
  };

  const updateLesson = async (moduleId: string, lessonId: string, data: UpdateLessonDto) => {
    if (!courseId) return false;
    const res = await coursesApi.updateLesson(courseId, moduleId, lessonId, data);
    if (res.success) {
      await fetchCourse();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to update lesson');
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!courseId) return false;
    const res = await coursesApi.deleteLesson(courseId, moduleId, lessonId);
    if (res.success) {
      await fetchCourse();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to delete lesson');
  };

  const reorderLessons = async (moduleId: string, items: ReorderItemDto[]) => {
    if (!courseId) return false;
    const res = await coursesApi.reorderLessons(courseId, moduleId, items);
    if (res.success) {
      await fetchCourse();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to reorder lessons');
  };

  return {
    course,
    categories,
    isLoading,
    error,
    refetch: fetchCourse,
    updateCourse,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
  };
}
