import { useState, useEffect, useCallback, useContext } from 'react';
import { coursesApi } from '@/services/coursesApi';
import { AuthContext } from '@/features/auth/AuthContext';
import type { CourseCardDto, LearningDashboardStatsDto } from '@/types/courses';

export function useMyCourses() {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [enrolledCourses, setEnrolledCourses] = useState<CourseCardDto[]>([]);
  const [stats, setStats] = useState<LearningDashboardStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setEnrolledCourses([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [coursesRes, statsRes] = await Promise.all([
        coursesApi.getEnrolledCourses(),
        coursesApi.getLearningDashboardStats(),
      ]);

      if (coursesRes.success) {
        setEnrolledCourses(coursesRes.data);
      } else {
        setError(coursesRes.error.message || 'Failed to load enrolled courses');
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading your courses';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeCourses = enrolledCourses.filter((c) => c.enrollmentStatus === 'active');
  const completedCourses = enrolledCourses.filter((c) => c.enrollmentStatus === 'completed');

  return {
    enrolledCourses,
    activeCourses,
    completedCourses,
    stats,
    isLoading,
    error,
    refetch: fetchData,
  };
}
