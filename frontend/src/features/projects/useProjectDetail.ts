import { useState, useEffect, useCallback } from 'react';
import { communityApi } from '@/services/communityApi';
import type { ProjectDetailDto } from '@/types/community';

export function useProjectDetail(slug: string | undefined) {
  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await communityApi.getProjectDetail(slug);
      if (res.success) {
        setProject(res.data);
      } else {
        setError(res.error.message || 'Project not found');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const publishProject = async () => {
    if (!project) return false;
    setActionLoading(true);
    try {
      const res = await communityApi.publishProject(project.id);
      if (res.success && res.data) {
        setProject(res.data);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const archiveProject = async () => {
    if (!project) return false;
    setActionLoading(true);
    try {
      const res = await communityApi.archiveProject(project.id);
      if (res.success && res.data) {
        setProject(res.data);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProject = async () => {
    if (!project) return false;
    setActionLoading(true);
    try {
      const res = await communityApi.deleteProject(project.id);
      return res.success;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    project,
    loading,
    actionLoading,
    error,
    publishProject,
    archiveProject,
    deleteProject,
    refetch: fetchDetail,
  };
}
