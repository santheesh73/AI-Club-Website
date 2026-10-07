import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '@/services/adminApi';
import type { AdminApplicationItem, AdminApplicationQuery } from '@/types/admin';

export function useAdminApplications(initialQuery: AdminApplicationQuery = {}) {
  const [applications, setApplications] = useState<AdminApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<string>(initialQuery.status || 'all');
  const [department, setDepartment] = useState<string>(initialQuery.department || 'all');
  const [searchTerm, setSearchTerm] = useState<string>(initialQuery.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialQuery.search || '');
  const [sortBy, setSortBy] = useState<'submitted_at' | 'assessment_score' | 'student_name' | 'application_number'>(
    initialQuery.sortBy || 'submitted_at'
  );
  const [order, setOrder] = useState<'asc' | 'desc'>(initialQuery.order || 'desc');
  const [page, setPage] = useState<number>(initialQuery.page || 1);
  const [pageSize] = useState<number>(initialQuery.pageSize || 20);
  const [total, setTotal] = useState<number>(0);

  // Debounce search input (300ms)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await adminApi.getApplications({
        status: status !== 'all' ? status : undefined,
        department: department !== 'all' ? department : undefined,
        search: debouncedSearch.trim() || undefined,
        sortBy,
        order,
        page,
        pageSize,
      });

      if (res.success && res.data) {
        setApplications(res.data);
        if (res.meta) {
          setTotal(res.meta.total || res.data.length);
        } else {
          setTotal(res.data.length);
        }
      } else if (!res.success) {
        setError(res.error.message || 'Failed to fetch applications');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading applications';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [status, department, debouncedSearch, sortBy, order, page, pageSize]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    applications,
    isLoading,
    error,
    status,
    department,
    searchTerm,
    sortBy,
    order,
    page,
    pageSize,
    total,
    totalPages,
    setStatus: handleStatusChange,
    setDepartment: handleDepartmentChange,
    setSearchTerm,
    setSortBy,
    setOrder,
    setPage,
    refresh: fetchApplications,
  };
}
