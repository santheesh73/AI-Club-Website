import React from 'react';
import { Link } from 'react-router-dom';
import { useProjectEditor } from '@/features/projects/useProjectEditor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, Sparkles, Globe, Lock, AlertCircle } from 'lucide-react';

export const MemberProjectCreatePage: React.FC = () => {
  const {
    categories,
    technologies,
    title,
    setTitle,
    shortDescription,
    setShortDescription,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    visibility,
    setVisibility,
    coverImageUrl,
    setCoverImageUrl,
    selectedTechIds,
    toggleTechnology,
    loading,
    saving,
    error,
    saveProject,
  } = useProjectEditor();

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner className="w-8 h-8 text-ink" />
        <p className="text-sm text-ink-muted">Initializing project workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <Link
          to="/member/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Projects
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-3xl font-display font-bold tracking-tight text-ink">
          Create New Project
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Share your work with the club, collaborate with peers, and showcase your achievements.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm rounded-card bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <Card className="space-y-6 border-surface-border">
        {/* Title & Slug */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vision Transformer for Satellite Land-Cover Classification"
              className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Visibility Setting *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-card border transition-all ${
                    visibility === 'public'
                      ? 'bg-ink text-canvas border-ink'
                      : 'bg-surface text-ink-muted border-surface-border hover:text-ink'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('members_only')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-card border transition-all ${
                    visibility === 'members_only'
                      ? 'bg-ink text-canvas border-ink'
                      : 'bg-surface text-ink-muted border-surface-border hover:text-ink'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Members Only
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
            Short Description (Teaser) *
          </label>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="A crisp 1-2 sentence overview shown in project cards and catalog listings..."
            className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
            required
          />
        </div>

        {/* Full Details */}
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
            Project Overview & Architecture Details *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the background, methodology, datasets used, benchmarks, and results..."
            rows={7}
            className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink leading-relaxed"
            required
          />
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
            Cover Image URL (Optional)
          </label>
          <input
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        {/* Technologies Selection */}
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
            Technology Stack & Frameworks
          </label>
          <div className="flex flex-wrap gap-2">
            {technologies.map((t) => {
              const selected = selectedTechIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTechnology(t.id)}
                  className={`px-3 py-1.5 text-xs rounded-pill font-medium transition-all ${
                    selected
                      ? 'bg-ink text-canvas border border-ink shadow-xs'
                      : 'bg-surface-muted text-ink-muted border border-surface-border hover:text-ink hover:bg-surface-border/50'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="pt-6 border-t border-surface-border flex items-center justify-end gap-3">
          <Link to="/member/projects">
            <Button variant="outline" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button variant="secondary" onClick={() => saveProject(false)} disabled={saving}>
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button variant="primary" onClick={() => saveProject(true)} disabled={saving} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {saving ? 'Publishing...' : 'Publish to Showcase'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
