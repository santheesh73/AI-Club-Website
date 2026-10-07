import { useState, useEffect, useCallback, useContext } from 'react';
import { coursesApi } from '@/services/coursesApi';
import { AuthContext } from '@/features/auth/AuthContext';
import type { CourseDetailDto } from '@/types/courses';

export function useCourseDetail(slug: string | undefined) {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [course, setCourse] = useState<CourseDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!slug) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await coursesApi.getCourseBySlug(slug);

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
  }, [slug]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const enroll = async () => {
    if (!course || !isAuthenticated) return false;
    try {
      setIsEnrolling(true);
      setEnrollError(null);
      const res = await coursesApi.enrollInCourse(course.id);

      if (res.success) {
        await fetchCourse();
        return true;
      } else {
        setEnrollError(res.error.message || 'Failed to enroll in course');
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enrollment failed';
      setEnrollError(msg);
      return false;
    } finally {
      setIsEnrolling(false);
    }
  };

  return {
    course,
    isLoading,
    error,
    isEnrolling,
    enrollError,
    enroll,
    refetch: fetchCourse,
  };
}
