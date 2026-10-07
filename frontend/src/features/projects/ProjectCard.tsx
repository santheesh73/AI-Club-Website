import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ProjectCardDto } from '@/types/community';
import { Star, Users, Lock, Globe, ExternalLink } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectCardDto;
  actionHref?: string;
  actionLabel?: string;
  showStatusBadge?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  actionHref,
  actionLabel = 'Explore Project',
  showStatusBadge = false,
}) => {
  const detailUrl = actionHref || `/community/projects/${project.slug}`;

  return (
    <Card className="flex flex-col h-full hover:shadow-card-hover transition-all duration-200 border-surface-border overflow-hidden group">
      {/* Cover / Header Banner */}
      <div className="relative h-44 -mx-6 -mt-6 bg-gradient-to-tr from-surface-muted via-accent-lavender-subtle/30 to-surface-muted overflow-hidden border-b border-surface-border">
        {project.coverImageUrl ? (
          <img
            src={project.coverImageUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted">
            <span className="text-3xl font-display font-bold tracking-tight text-ink/20 select-none">
              {project.title.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Featured Badge */}
        {project.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-semibold bg-accent-orange text-canvas shadow-sm">
              <Star className="w-3.5 h-3.5 fill-current" />
              Featured
            </span>
          </div>
        )}

        {/* Visibility Badge */}
        <div className="absolute top-3 left-3">
          {project.visibility === 'members_only' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-medium bg-ink/75 text-canvas backdrop-blur-sm">
              <Lock className="w-3 h-3" />
              Members Only
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-medium bg-surface/80 text-ink backdrop-blur-sm border border-surface-border/50">
              <Globe className="w-3 h-3" />
              Public
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col pt-4">
        {/* Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <Badge variant="lavender" className="text-[10px] tracking-wider">
            {project.category.name}
          </Badge>

          {showStatusBadge && (
            <Badge
              variant={
                project.status === 'published'
                  ? 'success'
                  : project.status === 'hidden'
                  ? 'error'
                  : 'neutral'
              }
              className="text-[10px]"
            >
              {project.status}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-ink group-hover:text-accent-lavender-dark transition-colors line-clamp-1 mb-1">
          <Link to={detailUrl}>{project.title}</Link>
        </h3>

        {/* Short Description */}
        <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed mb-4">
          {project.shortDescription}
        </p>

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
            {project.technologies.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="px-2 py-0.5 text-xs rounded bg-surface-muted text-ink-secondary border border-surface-border"
              >
                {t.name}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs text-ink-muted">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Card Footer Info */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs text-ink-muted mt-auto">
          <div className="flex items-center gap-1.5 truncate max-w-[60%]">
            <div className="w-5 h-5 rounded-full bg-accent-lavender-subtle text-accent-lavender-dark font-medium flex items-center justify-center text-[10px]">
              {project.owner.fullName.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{project.owner.fullName}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1" title={`${project.contributorCount} Contributors`}>
              <Users className="w-3.5 h-3.5" />
              {project.contributorCount}
            </span>

            <Link
              to={detailUrl}
              className="inline-flex items-center gap-0.5 font-medium text-ink hover:text-accent-orange-dark transition-colors"
            >
              {actionLabel}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
