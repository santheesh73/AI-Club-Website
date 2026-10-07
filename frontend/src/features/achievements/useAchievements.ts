import { useState, useEffect, useCallback } from 'react';
import { communityApi } from '@/services/communityApi';
import type { AchievementDto, AchievementCategoryRecord } from '@/types/community';

interface UseAchievementsProps {
  isMemberOnly?: boolean;
}

export function useAchievements({ isMemberOnly = false }: UseAchievementsProps = {}) {
  const [achievements, setAchievements] = useState<AchievementDto[]>([]);
  const [categories, setCategories] = useState<AchievementCategoryRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxonomy = useCallback(async () => {
    try {
      const res = await communityApi.getAchievementCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isMemberOnly
        ? await communityApi.getMemberAchievements()
        : await communityApi.getAchievements();

      if (res.success) {
        setAchievements(res.data);
      } else {
        setError(res.error.message || 'Failed to load achievements');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [isMemberOnly]);

  useEffect(() => {
    fetchTaxonomy();
  }, [fetchTaxonomy]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const deleteAchievement = async (id: string) => {
    try {
      const res = await communityApi.deleteAchievement(id);
      if (res.success) {
        setAchievements((prev) => prev.filter((a) => a.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const filteredAchievements = achievements.filter((a) => {
    if (selectedCategory === 'all') return true;
    return a.category.id === selectedCategory || a.category.slug === selectedCategory;
  });

  return {
    achievements: filteredAchievements,
    allCount: achievements.length,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    error,
    deleteAchievement,
    refetch: fetchAchievements,
  };
}
