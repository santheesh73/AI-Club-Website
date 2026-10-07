import { useState, useEffect, useCallback } from 'react';
import { coursesApi } from '@/services/coursesApi';
import type { CourseDetailDto, LessonDetailDto, CourseProgressDto } from '@/types/courses';

export function useLearning(courseSlug: string | undefined, lessonSlug: string | undefined) {
  const [course, setCourse] = useState<CourseDetailDto | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonDetailDto | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState<boolean>(true);
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<CourseProgressDto | null>(null);

  // Load Course and Syllabus structure
  const fetchCourse = useCallback(async () => {
    if (!courseSlug) return;
    try {
      setIsLoadingCourse(true);
      setError(null);
      const res = await coursesApi.getCourseBySlug(courseSlug);
      if (res.success) {
        setCourse(res.data);
      } else {
        setError(res.error.message || 'Course not found');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading course';
      setError(msg);
    } finally {
      setIsLoadingCourse(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Load Lesson Content
  const fetchLesson = useCallback(async (targetSlug: string) => {
    if (!courseSlug || !targetSlug) return;
    try {
      setIsLoadingLesson(true);
      setError(null);
      const res = await coursesApi.getLesson(courseSlug, targetSlug);
      if (res.success) {
        setCurrentLesson(res.data);
      } else {
        setError(res.error.message || 'Failed to load lesson content');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading lesson';
      setError(msg);
    } finally {
      setIsLoadingLesson(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    if (lessonSlug) {
      fetchLesson(lessonSlug);
    } else if (course && course.modules.length > 0) {
      // If no lesson specified in URL, pick resumeLessonSlug or first lesson
      const defaultLessonSlug = course.resumeLessonSlug || course.modules[0]?.lessons[0]?.slug;
      if (defaultLessonSlug) {
        fetchLesson(defaultLessonSlug);
      }
    }
  }, [lessonSlug, course, fetchLesson]);

  // Toggle or Mark Lesson Completion
  const toggleComplete = async (completed: boolean = true) => {
    if (!courseSlug || !currentLesson) return;
    try {
      setIsUpdatingProgress(true);
      const res = await coursesApi.updateLessonProgress(courseSlug, currentLesson.slug, completed);
      if (res.success) {
        setProgress(res.data);
        setCurrentLesson((prev) => (prev ? { ...prev, isCompleted: completed } : null));

        // Update syllabus in course state
        setCourse((prev) => {
          if (!prev) return null;
          const updatedModules = prev.modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === currentLesson.id ? { ...l, isCompleted: completed } : l
            ),
          }));
          return {
            ...prev,
            progressPercentage: res.data.percentage,
            enrollmentStatus: res.data.status,
            completedLessonsCount: res.data.completedLessons,
            modules: updatedModules,
          };
        });
      } else {
        setError(res.error.message || 'Failed to update lesson progress');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating progress';
      setError(msg);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  return {
    course,
    currentLesson,
    isLoadingCourse,
    isLoadingLesson,
    isUpdatingProgress,
    error,
    progress,
    toggleComplete,
    fetchLesson,
    refetchCourse: fetchCourse,
  };
}
