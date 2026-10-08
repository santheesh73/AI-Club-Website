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

      if (coursesRes && coursesRes.success && coursesRes.data) {
        if (Array.isArray(coursesRes.data)) {
          setEnrolledCourses(coursesRes.data);
        } else if (typeof coursesRes.data === 'object') {
          const raw = coursesRes.data as { active?: CourseCardDto[]; completed?: CourseCardDto[] };
          const combined = [
            ...(Array.isArray(raw.active) ? raw.active : []),
            ...(Array.isArray(raw.completed) ? raw.completed : []),
          ];
          setEnrolledCourses(combined);
        } else {
          setEnrolledCourses([]);
        }
      } else {
        setEnrolledCourses([]);
        if (coursesRes && !coursesRes.success && coursesRes.error) {
          setError(coursesRes.error.message || 'Failed to load enrolled courses');
        }
      }

      if (statsRes && statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading your courses';
      setError(msg);
      setEnrolledCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const safeEnrolled = Array.isArray(enrolledCourses) ? enrolledCourses : [];
  const activeCourses = safeEnrolled.filter((c) => c.enrollmentStatus === 'active');
  const completedCourses = safeEnrolled.filter((c) => c.enrollmentStatus === 'completed');

  return {
    enrolledCourses: safeEnrolled,
    activeCourses,
    completedCourses,
    stats,
    isLoading,
    error,
    refetch: fetchData,
  };
}
