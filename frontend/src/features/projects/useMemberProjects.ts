import { useState, useEffect, useCallback } from 'react';
import { communityApi } from '@/services/communityApi';
import type { ProjectCardDto } from '@/types/community';

export function useMemberProjects() {
  const [projects, setProjects] = useState<ProjectCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchMemberProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communityApi.getMemberProjects();
      if (res.success) {
        setProjects(res.data);
      } else {
        setError(res.error.message || 'Failed to load member projects');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load member projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemberProjects();
  }, [fetchMemberProjects]);

  const publishProject = async (id: string) => {
    try {
      const res = await communityApi.publishProject(id);
      if (res.success) {
        await fetchMemberProjects();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const archiveProject = async (id: string) => {
    try {
      const res = await communityApi.archiveProject(id);
      if (res.success) {
        await fetchMemberProjects();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const res = await communityApi.deleteProject(id);
      if (res.success) {
        await fetchMemberProjects();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  return {
    projects: filteredProjects,
    allProjectsCount: projects.length,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    publishProject,
    archiveProject,
    deleteProject,
    refetch: fetchMemberProjects,
  };
}
