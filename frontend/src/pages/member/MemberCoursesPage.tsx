import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, BookOpen, Sparkles, Filter, AlertCircle, Compass } from 'lucide-react';
import { useCourses } from '@/features/courses/useCourses';
import { CourseCard, RecommendedCoursesSection } from '@/features/courses';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { CourseDifficulty } from '@/types/courses';

const DIFFICULTIES: { label: string; value?: CourseDifficulty }[] = [
  { label: 'All Levels' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export const MemberCoursesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    courses,
    categories,
    isLoading,
    error,
    category,
    setCategory,
    difficulty,
    setDifficulty,
    search,
    setSearch,
    refetch,
  } = useCourses({ initialSearch: searchParams.get('search')?.trim().slice(0, 100) });

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Top Editorial Banner */}
      <div className="p-8 sm:p-10 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="lavender">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            Member learning
          </Badge>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              AI CLUB Courses & Curriculum
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
              Explore the club’s published courses, choose a topic, and continue learning in your member workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/member/my-courses" className="public-action-secondary">
                <BookOpen className="h-4 w-4 mr-1.5" />
                <span>My courses</span>
            </Link>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 pt-2 border-t border-surface-border overflow-x-auto">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-card-sm text-xs font-semibold bg-ink text-canvas flex items-center gap-1.5"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Course Catalog</span>
          </button>

          <Link
            to="/member/my-courses"
            className="min-h-11 px-3.5 py-1.5 rounded-card-sm text-xs font-semibold text-ink-secondary hover:bg-canvas flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>My Learning</span>
          </Link>
        </div>
      </div>

      {/* AI External Course Recommendations */}
      <RecommendedCoursesSection />

      {/* Internal LMS Section Divider & Heading */}
      <div className="space-y-4 pt-4 border-t border-surface-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Internal Courses & Curriculum
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Browse currently published club courses and their available lessons.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 sm:p-6 rounded-card bg-surface border border-surface-border shadow-soft flex flex-col md:flex-row items-center gap-4 justify-between">

        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            aria-label="Search member courses"
            placeholder="Search courses by title, topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        {/* Filter Controls */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Filter className="h-3.5 w-3.5" />
            <select
              aria-label="Course category"
              value={category || ''}
              onChange={(e) => setCategory(e.target.value || undefined)}
              className="py-1.5 px-3 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <select
              aria-label="Course difficulty"
              value={difficulty || ''}
              onChange={(e) => setDifficulty((e.target.value as CourseDifficulty) || undefined)}
              className="py-1.5 px-3 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink transition-colors"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.label} value={d.value || ''}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Rendering Area */}
      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" label="Loading curriculum..." />
          <p className="text-xs text-ink-muted">Retrieving courses and modules from learning catalog...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-card bg-surface border border-surface-border text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-ink">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 rounded-card-lg bg-surface border border-surface-border text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-canvas border border-surface-border flex items-center justify-center mx-auto text-ink-muted">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">No courses found</h3>
            <p className="text-xs text-ink-secondary mt-1 max-w-sm mx-auto">
              No published courses match your current search and filter criteria. Try adjusting your search query or selecting a different category.
            </p>
          </div>
          {(category || difficulty || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategory(undefined);
                setDifficulty(undefined);
                setSearch('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

