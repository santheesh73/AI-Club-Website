import React, { useState } from 'react';
import { useAchievements } from '@/features/achievements/useAchievements';
import { AchievementCard } from '@/features/achievements/AchievementCard';
import { AchievementModal } from '@/features/achievements/AchievementModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AchievementDto } from '@/types/community';
import { Award, Plus } from 'lucide-react';

export const MemberAchievementsPage: React.FC = () => {
  const {
    achievements,
    allCount,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    error,
    deleteAchievement,
    refetch,
  } = useAchievements({ isMemberOnly: true });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementDto | null>(null);

  const handleOpenAdd = () => {
    setEditingAchievement(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (achievement: AchievementDto) => {
    setEditingAchievement(achievement);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      await deleteAchievement(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-ink">
            My Credentials & Achievements
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Industry certifications, hackathon podiums, research preprints, and honors.
          </p>
        </div>

        <div>
          <Button variant="primary" size="sm" onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Achievement
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-pill tracking-wide transition-all ${
            selectedCategory === 'all'
              ? 'bg-ink text-canvas shadow-xs'
              : 'bg-surface-muted text-ink-muted hover:text-ink'
          }`}
        >
          All ({allCount})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-pill tracking-wide transition-all ${
              selectedCategory === cat.id
                ? 'bg-ink text-canvas shadow-xs'
                : 'bg-surface-muted text-ink-muted hover:text-ink'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner className="w-8 h-8 text-ink" />
          <p className="text-sm text-ink-muted">Loading achievements...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-card bg-red-50 text-red-700 border border-red-200 text-sm">
          {error}
        </div>
      ) : achievements.length === 0 ? (
        <div className="py-12 flex flex-col items-center">
          <EmptyState
            icon={<Award className="h-7 w-7 text-ink-muted" />}
            title="No credentials or achievements found"
            description="Add your first verified certification, award, or paper to your club showcase profile."
          />
          <div className="mt-4 flex justify-center">
            <Button variant="primary" onClick={handleOpenAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Credential
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((ach) => (
            <AchievementCard
              key={ach.id}
              achievement={ach}
              showActions
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AchievementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        achievement={editingAchievement}
        categories={categories}
        onSaved={refetch}
      />
    </div>
  );
};
