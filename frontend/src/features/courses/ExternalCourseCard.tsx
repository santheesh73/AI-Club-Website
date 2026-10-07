import React from 'react';
import { ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { CourseRecommendationDto } from '@/types/externalCourses';
import { externalCoursesApi } from '@/services/externalCoursesApi';

interface ExternalCourseCardProps {
  recommendation: CourseRecommendationDto;
}

export const ExternalCourseCard: React.FC<ExternalCourseCardProps> = ({ recommendation }) => {
  const { course, reason, matchScore, skillGap } = recommendation;

  const handleCourseClick = () => {
    // Record analytics click event asynchronously
    externalCoursesApi.recordClick(course.id).catch((err) => {
      console.warn('Failed to record course click event', err);
    });
  };

  const getProviderBadgeColor = (providerKey: string) => {
    switch (providerKey) {
      case 'COURSERA':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'FREECODECAMP':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'UDEMY':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'UNSTOP':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'EDX':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-ink/5 text-ink border-surface-border';
    }
  };

  const getDifficultyVariant = (diff: string) => {
    switch (diff) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'orange';
      case 'advanced':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="rounded-card bg-surface border border-surface-border shadow-soft hover:border-ink/40 transition-all flex flex-col justify-between overflow-hidden group">
      {/* Top Banner / Card Body */}
      <div className="p-6 space-y-4">
        {/* Header badges: Provider, Match Score, Category */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getProviderBadgeColor(
                course.providerKey
              )}`}
            >
              {course.provider}
            </span>
            <Badge variant="lavender">{course.category.replace(/_/g, ' ')}</Badge>
            <Badge variant={getDifficultyVariant(course.difficulty) as any}>
              {course.difficulty}
            </Badge>
          </div>

          {matchScore > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-[11px] font-semibold font-mono">
              <Sparkles className="h-3 w-3" />
              <span>{Math.round(matchScore)}% Match</span>
            </div>
          )}
        </div>

        {/* Course Title & Short Description */}
        <div className="space-y-1.5">
          <a
            href={course.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCourseClick}
            className="group-hover:text-ink transition-colors"
          >
            <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight group-hover:underline line-clamp-2">
              {course.title}
            </h3>
          </a>
          <p className="text-xs sm:text-sm text-ink-secondary line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* AI Explainability Banner */}
        {reason && (
          <div className="p-3 rounded-card-sm bg-lavender/10 border border-lavender/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-lavender-dark">
              <Sparkles className="h-3.5 w-3.5 text-lavender" />
              <span>Why this is recommended</span>
            </div>
            <p className="text-xs text-ink-secondary leading-normal">{reason}</p>
            {skillGap && (
              <p className="text-[10px] font-mono text-ink-muted">
                Addresses skill gap: <span className="font-semibold text-ink">{skillGap}</span>
              </p>
            )}
          </div>
        )}

        {/* Skills Tag Pills */}
        {course.skills && course.skills.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5 border-t border-surface-border/60">
            {course.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded bg-canvas border border-surface-border text-[10px] font-medium text-ink-secondary"
              >
                {skill}
              </span>
            ))}
            {course.skills.length > 4 && (
              <span className="text-[10px] text-ink-muted self-center">
                +{course.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer / CTA Actions */}
      <div className="p-4 bg-canvas/40 border-t border-surface-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-[11px] text-ink-muted font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-green" />
          <span>Verified Official Provider</span>
        </div>

        <a
          href={course.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCourseClick}
          className="inline-flex"
        >
          <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
            <span>View Course</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>
    </div>
  );
};
