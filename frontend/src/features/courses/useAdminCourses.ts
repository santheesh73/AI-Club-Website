import { useState, useEffect, useCallback } from 'react';
import { coursesApi } from '@/services/coursesApi';
import type { AdminCourseSummaryDto, CourseCategoryRecord, CourseDifficulty, CourseStatus } from '@/types/courses';

export function useAdminCourses() {
  const [courses, setCourses] = useState<AdminCourseSummaryDto[]>([]);
  const [categories, setCategories] = useState<CourseCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<CourseStatus | undefined>();
  const [difficulty, setDifficulty] = useState<CourseDifficulty | undefined>();
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

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

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await coursesApi.getAdminCourses({
        category,
        status,
        difficulty,
        search: search.trim() || undefined,
        page,
        pageSize: 15,
      });

      if (res.success) {
        setCourses(res.data);
        setTotal((res.meta?.total as number) || res.data.length);
      } else {
        setError(res.error.message || 'Failed to retrieve courses');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading courses';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [category, status, difficulty, search, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const publishCourse = async (id: string) => {
    const res = await coursesApi.publishCourse(id);
    if (res.success) {
      await fetchCourses();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to publish course');
  };

  const unpublishCourse = async (id: string) => {
    const res = await coursesApi.unpublishCourse(id);
    if (res.success) {
      await fetchCourses();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to unpublish course');
  };

  const archiveCourse = async (id: string) => {
    const res = await coursesApi.archiveCourse(id);
    if (res.success) {
      await fetchCourses();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to archive course');
  };

  const deleteCourse = async (id: string) => {
    const res = await coursesApi.deleteCourse(id);
    if (res.success) {
      await fetchCourses();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to delete course');
  };

  return {
    courses,
    categories,
    isLoading,
    error,
    total,
    category,
    setCategory,
    status,
    setStatus,
    difficulty,
    setDifficulty,
    search,
    setSearch,
    page,
    setPage,
    refetch: fetchCourses,
    publishCourse,
    unpublishCourse,
    archiveCourse,
    deleteCourse,
  };
}
