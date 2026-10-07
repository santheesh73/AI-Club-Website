import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Menu,
  X,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useLearning } from '@/features/courses/useLearning';
import { ProgressBar } from '@/features/courses/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';

export const MemberLearningPage: React.FC = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLessonSlug = searchParams.get('lesson') || undefined;

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const {
    course,
    currentLesson,
    isLoadingCourse,
    isLoadingLesson,
    isUpdatingProgress,
    error,
    toggleComplete,
  } = useLearning(courseSlug, currentLessonSlug);

  const handleSelectLesson = (slug: string) => {
    setSearchParams({ lesson: slug });
  };

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-canvas text-ink">
        <Spinner size="lg" label="Loading learning workspace..." />
        <p className="text-xs text-ink-muted">Configuring syllabus and interactive materials...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-canvas text-ink">
        <div className="max-w-md w-full p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-ink">Course Not Found</h2>
          <p className="text-xs text-ink-muted">
            The course you are attempting to learn could not be located.
          </p>
          <Link to="/member/courses">
            <Button variant="primary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span>Back to Course Catalog</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Top Learning Navigation Bar */}
      <header className="h-16 border-b border-surface-border bg-surface px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 h-9 w-9 flex-shrink-0"
            title="Toggle Curriculum Sidebar"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>

          <Link
            to={`/member/courses/${course.slug}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Course Syllabus</span>
          </Link>

          <span className="text-surface-border text-sm hidden sm:inline">|</span>

          <h1 className="text-xs sm:text-sm font-bold text-ink truncate">
            {course.title}
          </h1>
        </div>

        {/* Right: Progress and Action */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {course.isEnrolled && (
            <div className="hidden md:flex items-center gap-3 w-48">
              <ProgressBar
                percentage={course.progressPercentage || 0}
                showLabel={true}
                size="sm"
                variant={course.enrollmentStatus === 'completed' ? 'success' : 'primary'}
              />
            </div>
          )}

          {course.enrollmentStatus === 'completed' && (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3 mr-1 inline" />
              Completed
            </Badge>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Curriculum Sidebar */}
        <aside
          className={cn(
            'w-80 border-r border-surface-border bg-surface flex-shrink-0 overflow-y-auto transition-all duration-200 z-30',
            sidebarOpen ? 'block' : 'hidden'
          )}
        >
          <div className="p-4 border-b border-surface-border bg-canvas/40">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Course Modules
            </h2>
            <p className="text-[11px] text-ink-muted mt-0.5">
              {course.completedLessonsCount || 0} of {course.totalLessons} lessons completed
            </p>
          </div>

          <div className="divide-y divide-surface-border/60">
            {course.modules.map((mod, modIdx) => (
              <div key={mod.id} className="py-2">
                <div className="px-4 py-2 text-xs font-bold text-ink-secondary flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-canvas border border-surface-border flex items-center justify-center text-[10px] font-mono">
                    {modIdx + 1}
                  </span>
                  <span className="truncate">{mod.title}</span>
                </div>

                <div className="space-y-0.5 px-2">
                  {mod.lessons.map((les) => {
                    const isActive = currentLesson?.slug === les.slug;
                    const isLocked = !course.isEnrolled && !les.isPreview;

                    return (
                      <button
                        key={les.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleSelectLesson(les.slug)}
                        className={cn(
                          'w-full text-left p-2.5 rounded-card-sm text-xs flex items-center justify-between gap-2 transition-colors',
                          isActive && 'bg-canvas font-bold border-l-2 border-l-ink shadow-subtle',
                          !isActive && !isLocked && 'hover:bg-canvas/50 text-ink-secondary',
                          isLocked && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {les.isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-accent-green flex-shrink-0" />
                          ) : isLocked ? (
                            <Lock className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
                          )}
                          <span className="truncate">{les.title}</span>
                        </div>

                        <span className="text-[10px] font-mono text-ink-muted flex-shrink-0">
                          {les.duration}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Viewer */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {isLoadingLesson ? (
              <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                <Spinner size="md" label="Loading lesson..." />
              </div>
            ) : error ? (
              <div className="p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4">
                <Lock className="h-10 w-10 text-ink-muted mx-auto" />
                <h3 className="text-base font-bold text-ink">Enrollment Required</h3>
                <p className="text-xs text-ink-secondary max-w-md mx-auto">
                  {error}
                </p>
                <Link to={`/member/courses/${course.slug}`}>
                  <Button variant="primary" size="sm">
                    <span>Enroll in Course</span>
                  </Button>
                </Link>
              </div>
            ) : currentLesson ? (
              <>
                {/* Lesson Header */}
                <div className="space-y-3 pb-6 border-b border-surface-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-ink-muted">
                      {currentLesson.moduleTitle}
                    </span>
                    {currentLesson.isPreview && !course.isEnrolled && (
                      <Badge variant="lavender">
                        Free Preview
                      </Badge>
                    )}
                    <span className="text-xs font-mono text-ink-muted">
                      • {currentLesson.duration} mins
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                    {currentLesson.title}
                  </h2>

                  {currentLesson.description && (
                    <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                      {currentLesson.description}
                    </p>
                  )}
                </div>

                {/* Video Container (if video URL provided) */}
                {currentLesson.videoUrl && (
                  <div className="rounded-card-lg overflow-hidden border border-surface-border bg-black aspect-video flex items-center justify-center relative shadow-soft">
                    {currentLesson.videoUrl.includes('youtube') || currentLesson.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={
                          currentLesson.videoUrl.includes('embed')
                            ? currentLesson.videoUrl
                            : currentLesson.videoUrl.replace('watch?v=', 'embed/')
                        }
                        title={currentLesson.title}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={currentLesson.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                )}

                {/* Lesson Main Content */}
                <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft prose prose-ink max-w-none">
                  <div className="text-sm leading-relaxed text-ink space-y-4 whitespace-pre-line font-sans">
                    {currentLesson.content}
                  </div>
                </div>

                {/* Bottom Action / Navigation Toolbar */}
                <div className="p-4 sm:p-6 rounded-card bg-surface border border-surface-border shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Previous Lesson */}
                  <div>
                    {currentLesson.previousLesson ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSelectLesson(currentLesson.previousLesson!.slug)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        <span>Previous: {currentLesson.previousLesson.title}</span>
                      </Button>
                    ) : (
                      <span />
                    )}
                  </div>

                  {/* Mark as Completed */}
                  {course.isEnrolled && (
                    <Button
                      variant={currentLesson.isCompleted ? 'secondary' : 'primary'}
                      size="md"
                      onClick={() => toggleComplete(!currentLesson.isCompleted)}
                      disabled={isUpdatingProgress}
                      className={cn(
                        currentLesson.isCompleted &&
                          'text-accent-green border-accent-green/40 hover:bg-accent-green-subtle'
                      )}
                    >
                      {currentLesson.isCompleted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5 text-accent-green" />
                          <span>Completed ✓</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          <span>{isUpdatingProgress ? 'Updating...' : 'Mark as Completed'}</span>
                        </>
                      )}
                    </Button>
                  )}

                  {/* Next Lesson */}
                  <div>
                    {currentLesson.nextLesson ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSelectLesson(currentLesson.nextLesson!.slug)}
                      >
                        <span>Next: {currentLesson.nextLesson.title}</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Link to={`/member/courses/${course.slug}`}>
                        <Button variant="ghost" size="sm">
                          <span>Return to Syllabus</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-ink-muted">
                Select a lesson from the sidebar to begin learning.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
