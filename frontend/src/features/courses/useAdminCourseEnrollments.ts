import { useState, useEffect, useCallback } from 'react';
import { coursesApi } from '@/services/coursesApi';
import type { AdminLearnerEnrollmentDto, CourseDetailDto } from '@/types/courses';

export function useAdminCourseEnrollments(courseId: string | undefined) {
  const [course, setCourse] = useState<CourseDetailDto | null>(null);
  const [enrollments, setEnrollments] = useState<AdminLearnerEnrollmentDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!courseId) return;
    try {
      setIsLoading(true);
      setError(null);

      const [courseRes, enrollmentsRes] = await Promise.all([
        coursesApi.getAdminCourseById(courseId),
        coursesApi.getAdminLearnerEnrollments(courseId),
      ]);

      if (courseRes.success) {
        setCourse(courseRes.data);
      }
      if (enrollmentsRes.success) {
        setEnrollments(enrollmentsRes.data);
      } else {
        setError(enrollmentsRes.error.message || 'Failed to retrieve enrollments');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading enrollments';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    course,
    enrollments,
    isLoading,
    error,
    refetch: fetchData,
  };
}
