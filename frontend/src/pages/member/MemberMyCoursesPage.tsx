import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, PlayCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useMyCourses } from '@/features/courses/useMyCourses';
import { CourseCard } from '@/features/courses/CourseCard';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const MemberMyCoursesPage: React.FC = () => {
  const { enrolledCourses, activeCourses, completedCourses, stats, isLoading } = useMyCourses();
  const [tab, setTab] = useState<'all' | 'in_progress' | 'completed'>('all');

  const displayedCourses =
    tab === 'in_progress' ? activeCourses : tab === 'completed' ? completedCourses : enrolledCourses;

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading your courses..." />
        <p className="text-xs text-ink-muted">Retrieving your enrollments and progress telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-8 sm:p-10 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="lavender">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            Personal Learning Dashboard
          </Badge>
          <span className="text-xs font-mono text-ink-muted">Milestone 7 Academy</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              My Enrolled Courses
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
              Track your active coursework, resume learning from your last accessed lesson, and view your completed technical certifications.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/member/courses">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Explore Catalog</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 pt-2 border-t border-surface-border overflow-x-auto">
          <Link
            to="/member/courses"
            className="px-3.5 py-1.5 rounded-card-sm text-xs font-semibold text-ink-secondary hover:bg-canvas flex items-center gap-1.5 transition-colors"
          >
            <span>Course Catalog</span>
          </Link>

          <button
            type="button"
            onClick={() => setTab('all')}
            className={`px-3.5 py-1.5 rounded-card-sm text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === 'all' ? 'bg-ink text-canvas' : 'text-ink-secondary hover:bg-canvas'
            }`}
          >
            <span>All Courses ({enrolledCourses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('in_progress')}
            className={`px-3.5 py-1.5 rounded-card-sm text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === 'in_progress' ? 'bg-ink text-canvas' : 'text-ink-secondary hover:bg-canvas'
            }`}
          >
            <span>In Progress ({activeCourses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('completed')}
            className={`px-3.5 py-1.5 rounded-card-sm text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === 'completed' ? 'bg-ink text-canvas' : 'text-ink-secondary hover:bg-canvas'
            }`}
          >
            <span>Completed ({completedCourses.length})</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft space-y-1">
            <span className="text-[10px] uppercase font-mono text-ink-muted">Enrolled Courses</span>
            <p className="text-2xl font-bold font-mono text-ink">{stats.enrolledCount}</p>
          </div>

          <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft space-y-1">
            <span className="text-[10px] uppercase font-mono text-ink-muted">In Progress</span>
            <p className="text-2xl font-bold font-mono text-accent-orange">{stats.inProgressCount}</p>
          </div>

          <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft space-y-1">
            <span className="text-[10px] uppercase font-mono text-ink-muted">Completed</span>
            <p className="text-2xl font-bold font-mono text-accent-green">{stats.completedCount}</p>
          </div>

          <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft space-y-1">
            <span className="text-[10px] uppercase font-mono text-ink-muted">Lessons Completed</span>
            <p className="text-2xl font-bold font-mono text-ink">{stats.totalLessonsCompleted}</p>
          </div>
        </div>
      )}

      {/* Resume Learning Spotlight Banner */}
      {stats?.continueLearning && (
        <div className="p-6 rounded-card-lg bg-surface border border-surface-border shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="orange">Resume Learning</Badge>
              <span className="text-xs font-semibold text-ink-muted">
                {stats.continueLearning.courseTitle}
              </span>
            </div>
            <h3 className="text-lg font-bold text-ink">
              Next up: {stats.continueLearning.lessonTitle}
            </h3>
            <p className="text-xs text-ink-secondary">
              Course Progress: {stats.continueLearning.progressPercentage}%
            </p>
          </div>

          <Link
            to={`/member/learn/${stats.continueLearning.courseSlug}?lesson=${stats.continueLearning.lessonSlug}`}
          >
            <Button variant="primary" size="md">
              <PlayCircle className="h-4 w-4 mr-2" />
              <span>Resume Lesson</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}

      {/* Courses Grid */}
      {displayedCourses.length === 0 ? (
        <div className="p-12 rounded-card-lg bg-surface border border-surface-border text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-canvas border border-surface-border flex items-center justify-center mx-auto text-ink-muted">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">
              {tab === 'completed'
                ? 'No completed courses yet'
                : tab === 'in_progress'
                ? 'No courses in progress'
                : 'You have not enrolled in any courses yet'}
            </h3>
            <p className="text-xs text-ink-secondary mt-1 max-w-sm mx-auto">
              Explore our comprehensive AI engineering curriculum and enroll in your first course to begin learning.
            </p>
          </div>
          <Link to="/member/courses">
            <Button variant="primary" size="sm">
              <Sparkles className="h-4 w-4 mr-1.5" />
              <span>Browse Course Catalog</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};
