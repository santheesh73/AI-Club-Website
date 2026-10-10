import { useState, useEffect, useCallback, useContext } from 'react';
import { coursesApi } from '@/services/coursesApi';
import { AuthContext } from '@/features/auth/AuthContext';
import type { CourseCardDto, CourseCategoryRecord, CourseDifficulty } from '@/types/courses';

interface UseCoursesParams {
  initialCategory?: string;
  initialDifficulty?: CourseDifficulty;
  initialSearch?: string;
}

export function useCourses(params: UseCoursesParams = {}) {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [courses, setCourses] = useState<CourseCardDto[]>([]);
  const [categories, setCategories] = useState<CourseCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const [category, setCategory] = useState<string | undefined>(params.initialCategory);
  const [difficulty, setDifficulty] = useState<CourseDifficulty | undefined>(params.initialDifficulty);
  const [search, setSearch] = useState<string>(params.initialSearch?.slice(0, 100) || '');
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
      .catch(() => {
        // Non-blocking fallback
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchCourses = useCallback(async () => {
    if (!isAuthenticated) {
      setCourses([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await coursesApi.getMemberCourses({
        category,
        difficulty,
        search: search.trim() || undefined,
        page,
        pageSize: 12,
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
  }, [isAuthenticated, category, difficulty, search, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    categories,
    isLoading,
    error,
    total,
    category,
    setCategory,
    difficulty,
    setDifficulty,
    search,
    setSearch,
    page,
    setPage,
    refetch: fetchCourses,
  };
}
