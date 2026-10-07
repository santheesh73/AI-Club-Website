import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Send,
  Archive,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useAdminCourses } from '@/features/courses/useAdminCourses';
import { CoursePublishModal } from '@/features/courses/CoursePublishModal';
import { CourseArchiveModal } from '@/features/courses/CourseArchiveModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { AdminCourseSummaryDto, CourseDifficulty, CourseStatus } from '@/types/courses';

export const AdminCoursesPage: React.FC = () => {
  const {
    courses,
    categories,
    isLoading,
    error,
    category,
    setCategory,
    status,
    setStatus,
    difficulty,
    setDifficulty,
    search,
    setSearch,
    publishCourse,
    archiveCourse,
    deleteCourse,
  } = useAdminCourses();

  const [selectedCourseForPublish, setSelectedCourseForPublish] = useState<AdminCourseSummaryDto | null>(null);
  const [selectedCourseForArchive, setSelectedCourseForArchive] = useState<AdminCourseSummaryDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!selectedCourseForPublish) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await publishCourse(selectedCourseForPublish.id);
      setSelectedCourseForPublish(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Publishing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedCourseForArchive) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await archiveCourse(selectedCourseForArchive.id);
      setSelectedCourseForArchive(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Archiving failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (course: AdminCourseSummaryDto) => {
    if (!window.confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setActionError(null);
      await deleteCourse(course.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Deletion failed');
    }
  };

  const getStatusBadge = (s: CourseStatus) => {
    switch (s) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'draft':
        return <Badge variant="neutral">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Curriculum & Course Management
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Author, edit, sequence, publish, and oversee interactive learning modules and enrolled student progress.
          </p>
        </div>

        <Link to="/admin/courses/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Create Course</span>
          </Button>
        </Link>
      </div>

      {actionError && (
        <div className="p-4 rounded-card-sm bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={status || ''}
            onChange={(e) => setStatus((e.target.value as CourseStatus) || undefined)}
            className="py-1.5 px-3 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category Filter */}
          <select
            value={category || ''}
            onChange={(e) => setCategory(e.target.value || undefined)}
            className="py-1.5 px-3 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficulty || ''}
            onChange={(e) => setDifficulty((e.target.value as CourseDifficulty) || undefined)}
            className="py-1.5 px-3 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Courses Table */}
      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" label="Loading curriculum..." />
        </div>
      ) : error ? (
        <div className="p-8 rounded-card bg-surface border border-surface-border text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-ink">{error}</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 rounded-card bg-surface border border-surface-border text-center space-y-4">
          <BookOpen className="h-8 w-8 text-ink-muted mx-auto" />
          <h3 className="text-sm font-bold text-ink">No courses found</h3>
          <p className="text-xs text-ink-muted">Create a new course or adjust your filter query.</p>
        </div>
      ) : (
        <div className="rounded-card border border-surface-border bg-surface overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-canvas/40 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  <th className="p-4 font-semibold">Course Title</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Difficulty</th>
                  <th className="p-4 font-semibold">Structure</th>
                  <th className="p-4 font-semibold">Enrolled</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-canvas/30 transition-colors">
                    {/* Course Title */}
                    <td className="p-4 max-w-xs">
                      <Link
                        to={`/admin/courses/${course.id}`}
                        className="font-bold text-ink hover:underline line-clamp-1 block"
                      >
                        {course.title}
                      </Link>
                      <span className="text-[10px] font-mono text-ink-muted">{course.slug}</span>
                    </td>

                    {/* Category */}
                    <td className="p-4 font-medium text-ink-secondary">
                      {course.categoryName}
                    </td>

                    {/* Difficulty */}
                    <td className="p-4 uppercase font-mono text-[11px] text-ink-muted">
                      {course.difficulty}
                    </td>

                    {/* Structure */}
                    <td className="p-4 font-mono text-ink-muted">
                      {course.totalModules} mods • {course.totalLessons} lessons
                    </td>

                    {/* Enrolled Learners */}
                    <td className="p-4">
                      <Link
                        to={`/admin/courses/${course.id}/enrollments`}
                        className="hover:underline flex items-center gap-1.5 font-mono text-ink"
                      >
                        <Users className="h-3.5 w-3.5 text-ink-muted" />
                        <span>{course.enrolledLearnersCount}</span>
                        <span className="text-ink-muted text-[10px]">
                          ({course.completedLearnersCount} completed)
                        </span>
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="p-4">{getStatusBadge(course.status)}</td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/admin/courses/${course.id}/enrollments`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Learners">
                            <Users className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        <Link to={`/admin/courses/${course.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit Syllabus">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        {course.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-accent-green hover:text-accent-green"
                            title="Publish Course"
                            onClick={() => setSelectedCourseForPublish(course)}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {course.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-accent-orange hover:text-accent-orange"
                            title="Archive Course"
                            onClick={() => setSelectedCourseForArchive(course)}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {course.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                            title="Delete Course"
                            onClick={() => handleDelete(course)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CoursePublishModal
        isOpen={!!selectedCourseForPublish}
        onClose={() => setSelectedCourseForPublish(null)}
        onConfirm={handlePublish}
        courseTitle={selectedCourseForPublish?.title || ''}
        isSubmitting={isSubmitting}
      />

      <CourseArchiveModal
        isOpen={!!selectedCourseForArchive}
        onClose={() => setSelectedCourseForArchive(null)}
        onConfirm={handleArchive}
        courseTitle={selectedCourseForArchive?.title || ''}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
