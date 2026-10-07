import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { coursesApi } from '@/services/coursesApi';
import { Button } from '@/components/ui/Button';
import type { CourseCategoryRecord, CourseDifficulty, CourseStatus } from '@/types/courses';

export const AdminCourseCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CourseCategoryRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState<CourseDifficulty>('intermediate');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(120);
  const [status, setStatus] = useState<CourseStatus>('draft');

  useEffect(() => {
    coursesApi.getCategories().then((res) => {
      if (res.success && res.data.length > 0) {
        setCategories(res.data);
        setCategoryId(res.data[0].id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortDescription.trim() || !description.trim() || !categoryId) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await coursesApi.createCourse({
        title: title.trim(),
        slug: slug.trim() || undefined,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        categoryId,
        difficulty,
        estimatedDuration: Number(estimatedDuration) || 60,
        status,
      });

      if (res.success) {
        navigate(`/admin/courses/${res.data.id}`);
      } else {
        setError(res.error?.message || 'Failed to create course');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-4 pb-4 border-b border-surface-border">
        <Link
          to="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Courses</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ink text-canvas flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              Create New Course
            </h1>
            <p className="text-xs text-ink-secondary">
              Initialize a curriculum pathway and configure modules and lessons.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card-sm bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Advanced Multi-Agent Orchestration with LangGraph"
              className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              URL Slug <span className="text-ink-muted">(Optional, auto-generated from title if omitted)</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., multi-agent-orchestration-langgraph"
              className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs font-mono text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as CourseDifficulty)}
                className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Estimated Duration (mins) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Short Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="1-2 sentences summarizing the course value proposition."
              className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Comprehensive Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed syllabus overview, prerequisites, target outcomes, and technical stack."
              className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Initial Publication Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CourseStatus)}
              className="w-full sm:w-60 px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink"
            >
              <option value="draft">Draft (Private to admins)</option>
              <option value="published">Published (Visible to members)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
          <Link to="/admin/courses">
            <Button type="button" variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Creating Course...' : 'Create & Open Syllabus Editor'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
