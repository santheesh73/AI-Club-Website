import React, { useState } from 'react';
import { useProjects } from '@/features/projects/useProjects';
import { useAchievements } from '@/features/achievements/useAchievements';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { AchievementCard } from '@/features/achievements/AchievementCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Search,
  FolderGit2,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const CommunityProjectsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'achievements'>('projects');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    projects,
    categories: projectCategories,
    technologies,
    total,
    totalPages,
    currentPage,
    query,
    loading: projectsLoading,
    error: projectsError,
    updateFilter,
    setPage,
  } = useProjects();

  const {
    achievements,
    categories: achievementCategories,
    selectedCategory: achCategory,
    setSelectedCategory: setAchCategory,
    loading: achLoading,
    error: achError,
  } = useAchievements({ isMemberOnly: false });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter({ search: searchTerm.trim() || undefined });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-in fade-in duration-300">
      {/* Hero Showcase Banner */}
      <div className="relative rounded-card bg-surface border border-surface-border p-8 md:p-12 overflow-hidden shadow-soft">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-accent-lavender-subtle/60 via-accent-orange-subtle/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill text-xs font-semibold bg-accent-lavender-subtle text-accent-lavender-dark border border-accent-lavender/20">
            <Sparkles className="w-3.5 h-3.5" />
            AI CLUB Showcase & Community Ecosystem
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-ink">
            Discover student innovations and AI breakthroughs.
          </h1>

          <p className="text-base text-ink-muted leading-relaxed max-w-2xl">
            Explore verified applications, computer vision models, distributed systems, and certified achievements engineered by active AI CLUB researchers and builders.
          </p>
        </div>
      </div>

      {/* Showcase Mode Switcher */}
      <div className="flex items-center justify-between border-b border-surface-border pb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('projects')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-pill transition-all ${
              activeTab === 'projects'
                ? 'bg-ink text-canvas shadow-xs'
                : 'bg-surface-muted text-ink-muted hover:text-ink'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            Projects Showcase ({total})
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-pill transition-all ${
              activeTab === 'achievements'
                ? 'bg-ink text-canvas shadow-xs'
                : 'bg-surface-muted text-ink-muted hover:text-ink'
            }`}
          >
            <Award className="w-4 h-4" />
            Community Achievements
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PROJECTS SHOWCASE TAB */}
      {/* ===================================================================== */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Search & Filtering Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="md:col-span-5 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects by title, keywords, or architecture..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
              />
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
            </form>

            {/* Category Select */}
            <div className="md:col-span-3">
              <select
                value={query.category || ''}
                onChange={(e) => updateFilter({ category: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="">All Categories</option>
                {projectCategories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Select */}
            <div className="md:col-span-2">
              <select
                value={query.sortBy || 'newest'}
                onChange={(e) => updateFilter({ sortBy: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="newest">Newest First</option>
                <option value="updated">Recently Updated</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>

            {/* Technology filter reset / quick stats */}
            <div className="md:col-span-2 text-right text-xs text-ink-muted">
              {total} {total === 1 ? 'Project' : 'Projects'} found
            </div>
          </div>

          {/* Technology chips bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider mr-1 shrink-0">
              Tech:
            </span>
            <button
              onClick={() => updateFilter({ technology: undefined })}
              className={`px-2.5 py-1 text-xs rounded-pill shrink-0 font-medium transition-all ${
                !query.technology
                  ? 'bg-ink text-canvas'
                  : 'bg-surface-muted text-ink-muted hover:text-ink'
              }`}
            >
              All
            </button>
            {technologies.map((t) => (
              <button
                key={t.id}
                onClick={() => updateFilter({ technology: query.technology === t.slug ? undefined : t.slug })}
                className={`px-2.5 py-1 text-xs rounded-pill shrink-0 font-medium transition-all ${
                  query.technology === t.slug
                    ? 'bg-ink text-canvas'
                    : 'bg-surface-muted text-ink-muted hover:text-ink'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          {projectsLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Spinner className="w-8 h-8 text-ink" />
              <p className="text-sm text-ink-muted">Loading projects showcase...</p>
            </div>
          ) : projectsError ? (
            <div className="p-4 rounded-card bg-red-50 text-red-700 border border-red-200 text-sm">
              {projectsError}
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 flex flex-col items-center">
              <EmptyState
                icon={<FolderGit2 className="h-7 w-7 text-ink-muted" />}
                title="No projects match your filter"
                description="Try clearing your search term, selecting another category, or clearing technology filters."
              />
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    updateFilter({ search: undefined, category: undefined, technology: undefined });
                  }}
                >
                  Reset All Filters
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-surface-border pt-6">
                  <div className="text-xs text-ink-muted">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ACHIEVEMENTS TAB */}
      {/* ===================================================================== */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-surface-border pb-3 overflow-x-auto">
            <button
              onClick={() => setAchCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-pill tracking-wide transition-all ${
                achCategory === 'all'
                  ? 'bg-ink text-canvas shadow-xs'
                  : 'bg-surface-muted text-ink-muted hover:text-ink'
              }`}
            >
              All Categories
            </button>
            {achievementCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setAchCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-pill tracking-wide transition-all ${
                  achCategory === c.id
                    ? 'bg-ink text-canvas shadow-xs'
                    : 'bg-surface-muted text-ink-muted hover:text-ink'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {achLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Spinner className="w-8 h-8 text-ink" />
              <p className="text-sm text-ink-muted">Loading community credentials...</p>
            </div>
          ) : achError ? (
            <div className="p-4 rounded-card bg-red-50 text-red-700 border border-red-200 text-sm">
              {achError}
            </div>
          ) : achievements.length === 0 ? (
            <div className="py-12 flex flex-col items-center">
              <EmptyState
                icon={<Award className="h-7 w-7 text-ink-muted" />}
                title="No achievements in this category"
                description="Community members have not published credentials in this specific category yet."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((ach) => (
                <AchievementCard key={ach.id} achievement={ach} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
