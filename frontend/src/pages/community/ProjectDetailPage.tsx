import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectDetail } from '@/features/projects/useProjectDetail';
import { ProjectReportModal } from '@/features/projects/ProjectReportModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Globe,
  FileText,
  Database,
  Video,
  Lock,
  Flag,
  Edit2,
  Calendar,
  Star,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { project, loading, error } = useProjectDetail(slug);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-3">
        <Spinner className="w-8 h-8 text-ink" />
        <p className="text-sm text-ink-muted">Loading project showcase dossier...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-display font-bold text-ink">Project Not Available</h2>
        <p className="text-sm text-ink-muted">
          {error || 'This project could not be found or has been restricted.'}
        </p>
        <Link to="/community/projects">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Community Showcase
          </Button>
        </Link>
      </div>
    );
  }

  const getLinkIcon = (linkType: string) => {
    switch (linkType) {
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'demo':
        return <Globe className="w-4 h-4" />;
      case 'paper':
      case 'docs':
        return <FileText className="w-4 h-4" />;
      case 'dataset':
        return <Database className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-in fade-in duration-300">
      {/* Top Navigation & Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/community/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Showcase
        </Link>

        <div className="flex items-center gap-3">
          {project.canEdit && (
            <Link to={`/member/projects/${project.id}/edit`}>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                Edit Project
              </Button>
            </Link>
          )}

          {project.canReport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              className="gap-1.5 text-ink-muted hover:text-red-600 hover:border-red-200"
            >
              <Flag className="w-3.5 h-3.5" />
              Report
            </Button>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="lavender">{project.category.name}</Badge>

          {project.visibility === 'members_only' ? (
            <Badge variant="neutral" className="gap-1">
              <Lock className="w-3 h-3" />
              Members Only
            </Badge>
          ) : (
            <Badge variant="neutral" className="gap-1">
              <Globe className="w-3 h-3" />
              Public
            </Badge>
          )}

          {project.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-semibold bg-accent-orange text-canvas">
              <Star className="w-3.5 h-3.5 fill-current" />
              Featured by AI CLUB
            </span>
          )}

          {project.status !== 'published' && (
            <Badge variant="outline" className="capitalize">
              {project.status}
            </Badge>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-ink leading-tight">
          {project.title}
        </h1>

        <p className="text-lg text-ink-muted leading-relaxed max-w-4xl">
          {project.shortDescription}
        </p>

        {/* Technologies Pills */}
        {project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {project.technologies.map((t) => (
              <span
                key={t.id}
                className="px-3 py-1 text-xs rounded-pill bg-surface-muted text-ink font-medium border border-surface-border shadow-2xs"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Content (8 cols) & Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Media, Architecture & Overview */}
        <div className="lg:col-span-8 space-y-8">
          {/* Cover / Feature Media Banner */}
          {project.coverImageUrl && (
            <div className="rounded-card overflow-hidden border border-surface-border bg-surface-muted aspect-video shadow-soft">
              <img
                src={project.coverImageUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Quick Links Bar */}
          {project.links && project.links.length > 0 && (
            <div className="flex flex-wrap gap-3 p-4 rounded-card bg-surface border border-surface-border shadow-xs">
              {project.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-card bg-surface-muted text-ink hover:bg-ink hover:text-canvas transition-colors border border-surface-border"
                >
                  {getLinkIcon(link.linkType)}
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          )}

          {/* Full Markdown / Description */}
          <Card className="space-y-4 border-surface-border">
            <h2 className="text-xl font-bold font-display text-ink border-b border-surface-border pb-3">
              Overview & Architecture
            </h2>
            <div className="text-ink leading-relaxed whitespace-pre-line text-sm sm:text-base space-y-4">
              {project.description}
            </div>
          </Card>

          {/* Screenshots Gallery */}
          {project.media && project.media.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-ink">Screenshots & Visuals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.media.map((m) => (
                  <div
                    key={m.id}
                    className="group rounded-card overflow-hidden border border-surface-border bg-surface-muted aspect-video shadow-xs"
                  >
                    <img
                      src={m.mediaUrl}
                      alt={m.altText || project.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    {m.altText && (
                      <p className="p-2 text-xs text-ink-muted bg-surface border-t border-surface-border">
                        {m.altText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Team & Author Dossier */}
        <div className="lg:col-span-4 space-y-6">
          {/* Creator / Lead Card */}
          <Card className="space-y-4 border-surface-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Project Lead
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent-lavender-subtle text-accent-lavender-dark font-bold text-lg flex items-center justify-center shrink-0">
                {project.owner.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-ink text-base truncate">
                  {project.owner.fullName}
                </h4>
                {project.owner.memberNumber && (
                  <p className="text-xs font-mono text-ink-muted">
                    {project.owner.memberNumber}
                  </p>
                )}
                <p className="text-xs text-ink-muted truncate">{project.owner.email}</p>
              </div>
            </div>

            {project.publishedAt && (
              <div className="pt-3 border-t border-surface-border flex items-center gap-2 text-xs text-ink-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span>Published on {new Date(project.publishedAt).toLocaleDateString()}</span>
              </div>
            )}
          </Card>

          {/* Contributors Roster */}
          <Card className="space-y-4 border-surface-border">
            <div className="flex items-center justify-between border-b border-surface-border pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Team Contributors
              </h3>
              <span className="text-xs font-bold text-ink">
                {project.contributors.length}
              </span>
            </div>

            <div className="space-y-3">
              {project.contributors.map((contrib) => (
                <div key={contrib.userId} className="flex items-start justify-between gap-2 text-xs">
                  <div>
                    <p className="font-semibold text-ink">{contrib.fullName}</p>
                    {contrib.department && (
                      <p className="text-ink-muted text-[11px]">{contrib.department}</p>
                    )}
                  </div>
                  <Badge variant={contrib.role === 'Owner' ? 'lavender' : 'neutral'} className="text-[10px]">
                    {contrib.role}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Report Modal */}
      <ProjectReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetId={project.id}
        targetTitle={project.title}
        targetType="project"
      />
    </div>
  );
};
