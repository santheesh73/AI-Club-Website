import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Layers,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  PlayCircle,
  Check,
} from 'lucide-react';
import { useCourseDetail } from '@/features/courses/useCourseDetail';
import { ModuleAccordion } from '@/features/courses/ModuleAccordion';
import { ProgressBar } from '@/features/courses/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export const MemberCourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { course, isLoading, error, isEnrolling, enrollError, enroll, refetch } = useCourseDetail(slug);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading course syllabus..." />
        <p className="text-xs text-ink-muted">Retrieving course modules and lessons...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-ink">Course Not Found</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {error || 'The requested course does not exist or may have been unlisted.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/member/courses">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span>Back to Course Catalog</span>
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const hrs = (mins / 60).toFixed(1).replace('.0', '');
    return `${hrs} hours`;
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

  const handleLessonSelect = (lessonSlug: string) => {
    navigate(`/member/learn/${course.slug}?lesson=${lessonSlug}`);
  };

  const handleEnroll = async () => {
    const success = await enroll();
    if (success) {
      navigate(`/member/learn/${course.slug}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back Link */}
      <div>
        <Link
          to="/member/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Courses</span>
        </Link>
      </div>

      {/* Hero Course Header */}
      <div className="p-6 sm:p-10 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="lavender">{course.category.name}</Badge>
          <Badge variant={getDifficultyBadgeVariant(course.difficulty) as any}>
            {course.difficulty}
          </Badge>
          {course.enrollmentStatus === 'completed' && (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3 mr-1 inline" />
              Completed
            </Badge>
          )}
          {course.isEnrolled && course.enrollmentStatus === 'active' && (
            <Badge variant="orange">Enrolled</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
              {course.shortDescription}
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-ink-muted border-t border-surface-border/60">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(course.estimatedDuration)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                <span>{course.totalModules} modules</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>{course.totalLessons} lessons</span>
              </div>
            </div>
          </div>

          {/* Enrollment / Action Card */}
          <div className="p-6 rounded-card bg-canvas border border-surface-border flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                Enrollment Status
              </h3>

              {course.isEnrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">Your Learning Progress</span>
                    <span className="font-mono text-ink-muted">
                      {course.completedLessonsCount || 0} / {course.totalLessons}
                    </span>
                  </div>
                  <ProgressBar
                    percentage={course.progressPercentage || 0}
                    showLabel={true}
                    size="md"
                    variant={course.enrollmentStatus === 'completed' ? 'success' : 'primary'}
                  />
                  <p className="text-[11px] text-ink-muted">
                    {course.enrollmentStatus === 'completed'
                      ? 'Congratulations! You have completed all lessons in this course.'
                      : 'You are enrolled in this course. Continue right where you left off.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Access is open to all active AI CLUB members. Enroll now to unlock all modules, lessons, and interactive learning workspaces.
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 text-xs text-ink-secondary">
                      <Check className="h-3.5 w-3.5 text-accent-green" />
                      <span>Distraction-free learning environment</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-secondary">
                      <Check className="h-3.5 w-3.5 text-accent-green" />
                      <span>Persistent progress tracking</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-secondary">
                      <Check className="h-3.5 w-3.5 text-accent-green" />
                      <span>Complete technical syllabus</span>
                    </div>
                  </div>
                </div>
              )}

              {enrollError && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{enrollError}</p>
              )}
            </div>

            <div>
              {course.isEnrolled ? (
                <Link to={`/member/learn/${course.slug}`}>
                  <Button variant="primary" size="md" className="w-full justify-center">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    <span>
                      {course.enrollmentStatus === 'completed'
                        ? 'Review Course'
                        : course.resumeLessonSlug
                        ? 'Resume Learning'
                        : 'Start Learning'}
                    </span>
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>{isEnrolling ? 'Enrolling...' : 'Enroll in Course'}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Syllabus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Course Overview / Description */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink font-mono">
              About This Course
            </h3>
            <div className="text-xs sm:text-sm text-ink-secondary leading-relaxed whitespace-pre-line">
              {course.description}
            </div>
          </div>
        </div>

        {/* Right Column: Complete Syllabus Tree */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Course Syllabus</h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  {course.totalModules} modules • {course.totalLessons} lessons
                </p>
              </div>
              {!course.isEnrolled && (
                <span className="text-[11px] font-mono text-ink-muted">
                  Preview lessons are unlocked
                </span>
              )}
            </div>

            <div className="space-y-3">
              {course.modules.length === 0 ? (
                <p className="text-xs text-ink-muted italic">No modules published yet.</p>
              ) : (
                course.modules.map((module, idx) => (
                  <ModuleAccordion
                    key={module.id}
                    module={module}
                    moduleIndex={idx}
                    isOpenDefault={idx === 0}
                    isEnrolled={course.isEnrolled}
                    courseSlug={course.slug}
                    onSelectLesson={handleLessonSelect}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
