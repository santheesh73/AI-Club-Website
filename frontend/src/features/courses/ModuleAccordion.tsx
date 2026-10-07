import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PlayCircle, CheckCircle2, Lock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import type { ModuleSyllabusDto } from '@/types/courses';

interface ModuleAccordionProps {
  module: ModuleSyllabusDto;
  moduleIndex: number;
  isOpenDefault?: boolean;
  activeLessonSlug?: string;
  isEnrolled?: boolean;
  courseSlug?: string;
  onSelectLesson?: (lessonSlug: string) => void;
}

export const ModuleAccordion: React.FC<ModuleAccordionProps> = ({
  module,
  moduleIndex,
  isOpenDefault = true,
  activeLessonSlug,
  isEnrolled = false,
  onSelectLesson,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(isOpenDefault);

  const completedCount = module.lessons.filter((l) => l.isCompleted).length;

  return (
    <div className="rounded-card border border-surface-border bg-surface overflow-hidden">
      {/* Module Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-canvas/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="h-6 w-6 rounded-md bg-canvas border border-surface-border flex items-center justify-center text-xs font-mono font-bold text-ink-muted">
            {moduleIndex + 1}
          </span>
          <div>
            <h4 className="text-sm font-bold text-ink leading-snug">{module.title}</h4>
            {module.description && (
              <p className="text-xs text-ink-secondary mt-0.5 line-clamp-1">{module.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEnrolled && module.lessons.length > 0 && (
            <span className="text-[11px] font-mono text-ink-muted hidden sm:inline">
              {completedCount} / {module.lessons.length} done
            </span>
          )}
          <span className="text-xs font-mono text-ink-muted hidden md:inline">
            {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
          </span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-ink-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-ink-muted" />
          )}
        </div>
      </button>

      {/* Module Lessons List */}
      {isOpen && (
        <div className="border-t border-surface-border/60 bg-canvas/30 divide-y divide-surface-border/40">
          {module.lessons.length === 0 ? (
            <div className="p-4 text-xs text-ink-muted italic">No lessons in this module yet.</div>
          ) : (
            module.lessons.map((lesson) => {
              const isActive = activeLessonSlug === lesson.slug;
              const isLocked = !isEnrolled && !lesson.isPreview;

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    if (!isLocked && onSelectLesson) {
                      onSelectLesson(lesson.slug);
                    }
                  }}
                  className={cn(
                    'p-3.5 sm:px-4 flex items-center justify-between transition-colors',
                    !isLocked && 'cursor-pointer hover:bg-surface',
                    isActive && 'bg-surface font-semibold border-l-4 border-l-ink',
                    isLocked && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {/* Status Icon */}
                    {lesson.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-accent-green flex-shrink-0" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4 text-ink-muted flex-shrink-0" />
                    ) : lesson.isPreview ? (
                      <Eye className="h-4 w-4 text-accent-lavender flex-shrink-0" />
                    ) : (
                      <PlayCircle className="h-4 w-4 text-ink-muted flex-shrink-0" />
                    )}

                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-xs sm:text-sm text-ink truncate',
                          lesson.isCompleted && 'line-through text-ink-muted'
                        )}
                      >
                        {lesson.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {lesson.isPreview && !isEnrolled && (
                      <Badge variant="lavender">
                        Free Preview
                      </Badge>
                    )}
                    <span className="text-[11px] font-mono text-ink-muted">
                      {lesson.duration}m
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
