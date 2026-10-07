import { useState, useEffect, useCallback } from 'react';
import { communityApi } from '@/services/communityApi';
import type {
  ProjectCardDto,
  ProjectCategoryRecord,
  TechnologyRecord,
  ProjectQueryInput,
} from '@/types/community';

export function useProjects(initialQuery: ProjectQueryInput = {}) {
  const [projects, setProjects] = useState<ProjectCardDto[]>([]);
  const [categories, setCategories] = useState<ProjectCategoryRecord[]>([]);
  const [technologies, setTechnologies] = useState<TechnologyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState<ProjectQueryInput>({
    page: 1,
    pageSize: 12,
    sortBy: 'newest',
    sortOrder: 'desc',
    ...initialQuery,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxonomy = useCallback(async () => {
    try {
      const [catRes, techRes] = await Promise.all([
        communityApi.getCategories(),
        communityApi.getTechnologies(),
      ]);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (techRes.success && techRes.data) setTechnologies(techRes.data);
    } catch {
      // Non-fatal taxonomy fetch error
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communityApi.getProjects(query);
      if (res.success) {
        setProjects(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        setError(res.error.message || 'Failed to fetch showcase projects');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to fetch showcase projects');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchTaxonomy();
  }, [fetchTaxonomy]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const updateFilter = (newFilters: Partial<ProjectQueryInput>) => {
    setQuery((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // Reset page on filter changes unless explicitly paging
    }));
  };

  const setPage = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  return {
    projects,
    categories,
    technologies,
    total,
    totalPages,
    currentPage: query.page || 1,
    query,
    loading,
    error,
    updateFilter,
    setPage,
    refetch: fetchProjects,
  };
}
