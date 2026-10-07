import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle2, ArrowRight, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from './ProgressBar';
import type { CourseCardDto } from '@/types/courses';

interface CourseCardProps {
  course: CourseCardDto;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const hrs = (mins / 60).toFixed(1).replace('.0', '');
    return `${hrs} hrs`;
  };

  const getDifficultyBadgeVariant = (diff: string) => {
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
      {/* Top Section */}
      <div className="p-6 space-y-4">
        {/* Badges / Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="lavender">{course.category.name}</Badge>
            <Badge variant={getDifficultyBadgeVariant(course.difficulty) as any}>
              {course.difficulty}
            </Badge>
          </div>

          {course.enrollmentStatus === 'completed' ? (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3 mr-1 inline" />
              Completed
            </Badge>
          ) : course.isEnrolled ? (
            <Badge variant="orange">In Progress</Badge>
          ) : (
            <span className="text-[11px] font-mono text-ink-muted flex items-center gap-1">
              <Clock className="h-3 w-3 inline" />
              {formatDuration(course.estimatedDuration)}
            </span>
          )}
        </div>

        {/* Title and Short Description */}
        <div className="space-y-1.5">
          <Link to={`/member/courses/${course.slug}`}>
            <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight group-hover:underline line-clamp-2">
              {course.title}
            </h3>
          </Link>
          <p className="text-xs sm:text-sm text-ink-secondary line-clamp-2 leading-relaxed">
            {course.shortDescription}
          </p>
        </div>

        {/* Course Metadata Meta-line */}
        <div className="pt-2 flex items-center gap-4 text-xs font-mono text-ink-muted border-t border-surface-border/60">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>{course.totalModules} modules</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{course.totalLessons} lessons</span>
          </div>
        </div>

        {/* Progress Bar (if enrolled) */}
        {course.isEnrolled && (
          <div className="pt-1">
            <ProgressBar
              percentage={course.progressPercentage || 0}
              showLabel={true}
              size="sm"
              variant={course.enrollmentStatus === 'completed' ? 'success' : 'primary'}
            />
          </div>
        )}
      </div>

      {/* Footer / CTA Actions */}
      <div className="p-4 bg-canvas/40 border-t border-surface-border flex items-center justify-between gap-3">
        {course.isEnrolled ? (
          <Link to={`/member/learn/${course.slug}`} className="w-full">
            <Button
              variant={course.enrollmentStatus === 'completed' ? 'secondary' : 'primary'}
              size="sm"
              className="w-full justify-center group-hover:shadow-subtle"
            >
              <span>{course.enrollmentStatus === 'completed' ? 'Review Course' : 'Continue Learning'}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        ) : (
          <Link to={`/member/courses/${course.slug}`} className="w-full">
            <Button variant="secondary" size="sm" className="w-full justify-center">
              <span>View Course Syllabus</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
