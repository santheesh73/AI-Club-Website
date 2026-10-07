import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectEditor } from '@/features/projects/useProjectEditor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { ProjectLinkType } from '@/types/community';
import {
  ArrowLeft,
  Globe,
  Lock,
  Plus,
  Trash2,
  ExternalLink,
  Users,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const MemberProjectEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const {
    categories,
    technologies,
    title,
    setTitle,
    slug,
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
    links,
    addLink,
    deleteLink,
    media,
    addMedia,
    deleteMedia,
    contributors,
    addContributor,
    removeContributor,
    loading,
    saving,
    error,
    saveProject,
  } = useProjectEditor({ projectId: id });

  // Inline Link Adder state
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<ProjectLinkType>('github');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Inline Media Adder state
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaAlt, setNewMediaAlt] = useState('');
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Inline Contributor Adder state
  const [newContribUserId, setNewContribUserId] = useState('');
  const [newContribRole, setNewContribRole] = useState('Contributor');
  const [contribError, setContribError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner className="w-8 h-8 text-ink" />
        <p className="text-sm text-ink-muted">Loading project workspace...</p>
      </div>
    );
  }

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;

    if (!newLinkUrl.startsWith('http://') && !newLinkUrl.startsWith('https://')) {
      setLinkError('URL must begin with http:// or https://');
      return;
    }

    const ok = await addLink(newLinkLabel.trim(), newLinkUrl.trim(), newLinkType);
    if (ok) {
      setNewLinkLabel('');
      setNewLinkUrl('');
    } else {
      setLinkError('Failed to add link.');
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setMediaError(null);
    if (!newMediaUrl.trim()) return;

    const ok = await addMedia(newMediaUrl.trim(), 'image', newMediaAlt.trim() || undefined);
    if (ok) {
      setNewMediaUrl('');
      setNewMediaAlt('');
    } else {
      setMediaError('Failed to add media.');
    }
  };

  const handleAddContributor = async (e: React.FormEvent) => {
    e.preventDefault();
    setContribError(null);
    if (!newContribUserId.trim()) return;

    const ok = await addContributor(newContribUserId.trim(), newContribRole.trim());
    if (ok) {
      setNewContribUserId('');
      setNewContribRole('Contributor');
    } else {
      setContribError('Failed to add contributor. Verify active member ID.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/member/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Projects
        </Link>

        {slug && (
          <Link
            to={`/community/projects/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-lavender-dark hover:underline"
          >
            <span>Preview in Public Showcase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-3xl font-display font-bold tracking-tight text-ink">
          Edit Project: {title || 'Untitled'}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Manage project details, external repositories, media, and team contributors.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm rounded-card bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Core Metadata Card */}
      <Card className="space-y-6 border-surface-border">
        <h2 className="text-lg font-semibold text-ink border-b border-surface-border pb-2">
          General Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
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

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Short Description *
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Full Project Details & Architecture *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Cover Image URL
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Technology Stack
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
                        : 'bg-surface-muted text-ink-muted border border-surface-border hover:text-ink'
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. External Links Card */}
      <Card className="space-y-4 border-surface-border">
        <div className="flex items-center gap-2 border-b border-surface-border pb-2">
          <LinkIcon className="w-5 h-5 text-accent-lavender-dark" />
          <h2 className="text-lg font-semibold text-ink">External Links & Resources</h2>
        </div>

        {/* Existing Links List */}
        {links.length > 0 ? (
          <div className="space-y-2">
            {links.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between p-3 rounded-card bg-surface-muted border border-surface-border text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Badge variant="neutral" className="capitalize text-[10px]">
                    {l.linkType}
                  </Badge>
                  <span className="font-semibold text-ink">{l.label}</span>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-ink-muted hover:text-ink truncate max-w-[250px]"
                  >
                    {l.url}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => deleteLink(l.id)}
                  className="p-1 rounded text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-muted italic">No external links added yet.</p>
        )}

        {/* Add Link Form */}
        <form onSubmit={handleAddLink} className="pt-2 border-t border-surface-border space-y-3">
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
            Add Repository or Resource Link
          </h3>
          {linkError && <p className="text-xs text-red-600">{linkError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={newLinkType}
              onChange={(e) => setNewLinkType(e.target.value as ProjectLinkType)}
              className="px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink"
            >
              <option value="github">GitHub</option>
              <option value="demo">Live Deployment</option>
              <option value="docs">Documentation</option>
              <option value="paper">Research Paper</option>
              <option value="dataset">Dataset</option>
              <option value="video">Video Walkthrough</option>
              <option value="other">Other Link</option>
            </select>
            <input
              type="text"
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
              placeholder="Label (e.g. GitHub Repo)"
              className="px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink"
              required
            />
            <input
              type="url"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Link
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Media & Screenshots Card */}
      <Card className="space-y-4 border-surface-border">
        <div className="flex items-center gap-2 border-b border-surface-border pb-2">
          <ImageIcon className="w-5 h-5 text-accent-lavender-dark" />
          <h2 className="text-lg font-semibold text-ink">Screenshots & Architecture Media</h2>
        </div>

        {media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {media.map((m) => (
              <div
                key={m.id}
                className="relative group rounded-card overflow-hidden border border-surface-border bg-surface-muted aspect-video"
              >
                <img src={m.mediaUrl} alt={m.altText || ''} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => deleteMedia(m.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-ink/80 text-canvas hover:bg-red-600 transition-colors shadow-sm"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-muted italic">No media added yet.</p>
        )}

        <form onSubmit={handleAddMedia} className="pt-2 border-t border-surface-border space-y-3">
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">Add Screenshot</h3>
          {mediaError && <p className="text-xs text-red-600">{mediaError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="url"
              value={newMediaUrl}
              onChange={(e) => setNewMediaUrl(e.target.value)}
              placeholder="Image URL (https://...)"
              className="px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink"
              required
            />
            <input
              type="text"
              value={newMediaAlt}
              onChange={(e) => setNewMediaAlt(e.target.value)}
              placeholder="Alt text or caption (optional)"
              className="px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Media
            </Button>
          </div>
        </form>
      </Card>

      {/* 4. Team Contributors Card */}
      <Card className="space-y-4 border-surface-border">
        <div className="flex items-center gap-2 border-b border-surface-border pb-2">
          <Users className="w-5 h-5 text-accent-lavender-dark" />
          <h2 className="text-lg font-semibold text-ink">Project Team & Contributors</h2>
        </div>

        <div className="space-y-2">
          {contributors.map((c) => (
            <div
              key={c.userId}
              className="flex items-center justify-between p-3 rounded-card bg-surface-muted border border-surface-border text-sm"
            >
              <div className="flex items-center gap-2.5">
                <Badge variant={c.role === 'Owner' ? 'lavender' : 'neutral'} className="text-[10px]">
                  {c.role}
                </Badge>
                <span className="font-semibold text-ink">{c.fullName}</span>
                <span className="text-xs text-ink-muted">({c.email})</span>
              </div>
              {c.role !== 'Owner' && (
                <button
                  type="button"
                  onClick={() => removeContributor(c.userId)}
                  className="p-1 rounded text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove contributor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddContributor} className="pt-2 border-t border-surface-border space-y-3">
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
            Add Co-Contributor
          </h3>
          {contribError && <p className="text-xs text-red-600">{contribError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newContribUserId}
              onChange={(e) => setNewContribUserId(e.target.value)}
              placeholder="Active Member User ID (UUID or ID)"
              className="px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink"
              required
            />
            <input
              type="text"
              value={newContribRole}
              onChange={(e) => setNewContribRole(e.target.value)}
              placeholder="Role (e.g. Frontend Engineer, Model Tuning)"
              className="px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Contributor
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Save Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-surface-border">
        <Link to="/member/projects">
          <Button variant="outline" disabled={saving}>
            Cancel
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => saveProject(false)} disabled={saving}>
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button variant="primary" onClick={() => saveProject(true)} disabled={saving} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {saving ? 'Saving...' : 'Publish to Showcase'}
          </Button>
        </div>
      </div>
    </div>
  );
};
