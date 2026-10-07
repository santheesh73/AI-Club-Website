import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Users,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useAdminCourseEditor } from '@/features/courses/useAdminCourseEditor';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type {
  LessonContentType,
  CourseDifficulty,
  ModuleSyllabusDto,
  LessonSummaryDto,
} from '@/types/courses';

export const AdminCourseEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    course,
    categories,
    isLoading,
    error,
    updateCourse,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
  } = useAdminCourseEditor(id);

  // Course Meta Edit State
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaShortDescription, setMetaShortDescription] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaCategoryId, setMetaCategoryId] = useState('');
  const [metaDifficulty, setMetaDifficulty] = useState<CourseDifficulty>('intermediate');
  const [metaDuration, setMetaDuration] = useState<number>(60);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Module Modal State
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [isSubmittingModule, setIsSubmittingModule] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);

  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSlug, setLessonSlug] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonContentType, setLessonContentType] = useState<LessonContentType>('text');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState<number>(15);
  const [lessonIsPreview, setLessonIsPreview] = useState(false);
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading course editor..." />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <p className="text-sm font-semibold text-ink">{error || 'Course not found'}</p>
        <Link to="/admin/courses">
          <Button variant="secondary" size="sm">
            <span>Back to Courses</span>
          </Button>
        </Link>
      </div>
    );
  }

  // --- Course Metadata Handlers ---
  const handleStartEditMeta = () => {
    setMetaTitle(course.title);
    setMetaShortDescription(course.shortDescription);
    setMetaDescription(course.description);
    setMetaCategoryId(course.category.id);
    setMetaDifficulty(course.difficulty);
    setMetaDuration(course.estimatedDuration);
    setMetaError(null);
    setIsEditingMeta(true);
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingMeta(true);
      setMetaError(null);
      await updateCourse({
        title: metaTitle.trim(),
        shortDescription: metaShortDescription.trim(),
        description: metaDescription.trim(),
        categoryId: metaCategoryId,
        difficulty: metaDifficulty,
        estimatedDuration: Number(metaDuration) || 60,
      });
      setIsEditingMeta(false);
    } catch (err: unknown) {
      setMetaError(err instanceof Error ? err.message : 'Failed to update metadata');
    } finally {
      setIsSavingMeta(false);
    }
  };

  // --- Module Handlers ---
  const handleOpenAddModule = () => {
    setEditingModuleId(null);
    setModuleTitle('');
    setModuleDescription('');
    setModuleError(null);
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod: ModuleSyllabusDto) => {
    setEditingModuleId(mod.id);
    setModuleTitle(mod.title);
    setModuleDescription(mod.description || '');
    setModuleError(null);
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    try {
      setIsSubmittingModule(true);
      setModuleError(null);
      if (editingModuleId) {
        await updateModule(editingModuleId, {
          title: moduleTitle.trim(),
          description: moduleDescription.trim() || undefined,
        });
      } else {
        await createModule({
          title: moduleTitle.trim(),
          description: moduleDescription.trim() || undefined,
        });
      }
      setIsModuleModalOpen(false);
    } catch (err: unknown) {
      setModuleError(err instanceof Error ? err.message : 'Error saving module');
    } finally {
      setIsSubmittingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Delete this module? Note: Non-empty modules cannot be deleted.')) return;
    try {
      await deleteModule(moduleId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete module');
    }
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    const modules = [...course.modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const temp = modules[index];
    modules[index] = modules[targetIndex];
    modules[targetIndex] = temp;

    const reordered = modules.map((m, idx) => ({ id: m.id, position: idx }));
    await reorderModules(reordered);
  };

  // --- Lesson Handlers ---
  const handleOpenAddLesson = (moduleId: string) => {
    setTargetModuleId(moduleId);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonSlug('');
    setLessonDescription('');
    setLessonContent('');
    setLessonContentType('text');
    setLessonVideoUrl('');
    setLessonDuration(15);
    setLessonIsPreview(false);
    setLessonError(null);
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (moduleId: string, lesson: LessonSummaryDto) => {
    setTargetModuleId(moduleId);
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonSlug(lesson.slug);
    setLessonDescription('');
    setLessonContent(''); // content can be loaded or updated
    setLessonContentType('text');
    setLessonVideoUrl('');
    setLessonDuration(lesson.duration);
    setLessonIsPreview(lesson.isPreview);
    setLessonError(null);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetModuleId || !lessonTitle.trim()) return;
    try {
      setIsSubmittingLesson(true);
      setLessonError(null);
      if (editingLessonId) {
        await updateLesson(targetModuleId, editingLessonId, {
          title: lessonTitle.trim(),
          slug: lessonSlug.trim() || undefined,
          description: lessonDescription.trim() || undefined,
          content: lessonContent.trim() || undefined,
          contentType: lessonContentType,
          videoUrl: lessonVideoUrl.trim() || undefined,
          duration: Number(lessonDuration) || 15,
          isPreview: lessonIsPreview,
        });
      } else {
        await createLesson(targetModuleId, {
          title: lessonTitle.trim(),
          slug: lessonSlug.trim() || undefined,
          description: lessonDescription.trim() || undefined,
          content: lessonContent.trim() || 'Lesson content goes here.',
          contentType: lessonContentType,
          videoUrl: lessonVideoUrl.trim() || undefined,
          duration: Number(lessonDuration) || 15,
          isPreview: lessonIsPreview,
        });
      }
      setIsLessonModalOpen(false);
    } catch (err: unknown) {
      setLessonError(err instanceof Error ? err.message : 'Error saving lesson');
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!window.confirm('Delete this lesson permanently?')) return;
    try {
      await deleteLesson(moduleId, lessonId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete lesson');
    }
  };

  const handleMoveLesson = async (
    moduleId: string,
    lessons: LessonSummaryDto[],
    index: number,
    direction: 'up' | 'down'
  ) => {
    const list = [...lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reordered = list.map((l, idx) => ({ id: l.id, position: idx }));
    await reorderLessons(moduleId, reordered);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="space-y-1">
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Courses</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              {course.title}
            </h1>
            <Badge variant={course.status === 'published' ? 'success' : 'neutral'}>
              {course.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/admin/courses/${course.id}/enrollments`}>
            <Button variant="secondary" size="sm">
              <Users className="h-4 w-4 mr-1.5" />
              <span>Learners</span>
            </Button>
          </Link>

          <Link to={`/member/courses/${course.slug}`} target="_blank">
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              <span>Preview</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metadata Overview Card */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
            Course Metadata
          </h2>
          {!isEditingMeta && (
            <Button variant="ghost" size="sm" onClick={handleStartEditMeta}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              <span>Edit Details</span>
            </Button>
          )}
        </div>

        {isEditingMeta ? (
          <form onSubmit={handleSaveMeta} className="space-y-4">
            {metaError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{metaError}</p>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Title</label>
              <input
                type="text"
                required
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Category</label>
                <select
                  value={metaCategoryId}
                  onChange={(e) => setMetaCategoryId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Difficulty</label>
                <select
                  value={metaDifficulty}
                  onChange={(e) => setMetaDifficulty(e.target.value as CourseDifficulty)}
                  className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Duration (mins)</label>
                <input
                  type="number"
                  min="1"
                  value={metaDuration}
                  onChange={(e) => setMetaDuration(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Short Description</label>
              <input
                type="text"
                required
                value={metaShortDescription}
                onChange={(e) => setMetaShortDescription(e.target.value)}
                className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Full Description</label>
              <textarea
                rows={3}
                required
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingMeta(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSavingMeta}>
                <span>{isSavingMeta ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-ink-muted block text-[11px]">Category</span>
              <span className="font-semibold text-ink">{course.category.name}</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[11px]">Difficulty</span>
              <span className="font-semibold text-ink capitalize">{course.difficulty}</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[11px]">Estimated Duration</span>
              <span className="font-semibold text-ink">{course.estimatedDuration} minutes</span>
            </div>
            <div className="sm:col-span-3">
              <span className="text-ink-muted block text-[11px]">Summary</span>
              <p className="text-ink-secondary">{course.shortDescription}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modules and Lessons Section */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-ink">Curriculum Modules & Lessons</h2>
            <p className="text-xs text-ink-muted">
              {course.totalModules} modules • {course.totalLessons} lessons
            </p>
          </div>

          <Button variant="primary" size="sm" onClick={handleOpenAddModule}>
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Add Module</span>
          </Button>
        </div>

        {course.modules.length === 0 ? (
          <div className="p-10 rounded-card bg-canvas border border-surface-border text-center space-y-3">
            <Layers className="h-8 w-8 text-ink-muted mx-auto" />
            <h3 className="text-sm font-bold text-ink">No modules created yet</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Start structuring your course syllabus by adding your first curriculum module.
            </p>
            <Button variant="primary" size="sm" onClick={handleOpenAddModule}>
              <span>Create Module 1</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {course.modules.map((mod, modIdx) => (
              <div
                key={mod.id}
                className="rounded-card border border-surface-border bg-canvas/30 overflow-hidden"
              >
                {/* Module Bar */}
                <div className="p-4 bg-canvas flex items-center justify-between gap-3 border-b border-surface-border">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded bg-surface border border-surface-border flex items-center justify-center text-xs font-mono font-bold">
                      {modIdx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{mod.title}</h4>
                      {mod.description && (
                        <p className="text-xs text-ink-muted line-clamp-1">{mod.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Reorder Buttons */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={modIdx === 0}
                      onClick={() => handleMoveModule(modIdx, 'up')}
                      title="Move Module Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={modIdx === course.modules.length - 1}
                      onClick={() => handleMoveModule(modIdx, 'down')}
                      title="Move Module Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleOpenEditModule(mod)}
                      title="Edit Module"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteModule(mod.id)}
                      title="Delete Module"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="ml-2 text-xs"
                      onClick={() => handleOpenAddLesson(mod.id)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <span>Add Lesson</span>
                    </Button>
                  </div>
                </div>

                {/* Lessons in Module */}
                <div className="divide-y divide-surface-border/50">
                  {mod.lessons.length === 0 ? (
                    <div className="p-4 text-xs text-ink-muted italic bg-surface/50">
                      No lessons in this module. Click "Add Lesson" to add the first lesson.
                    </div>
                  ) : (
                    mod.lessons.map((les, lesIdx) => (
                      <div
                        key={les.id}
                        className="p-3.5 sm:px-4 bg-surface flex items-center justify-between gap-3 text-xs hover:bg-canvas/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[11px] font-mono text-ink-muted">
                            {modIdx + 1}.{lesIdx + 1}
                          </span>
                          <span className="font-semibold text-ink truncate">{les.title}</span>
                          {les.isPreview && (
                            <Badge variant="lavender">
                              Preview
                            </Badge>
                          )}
                          <span className="text-[10px] font-mono text-ink-muted">
                            {les.duration}m
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={lesIdx === 0}
                            onClick={() => handleMoveLesson(mod.id, mod.lessons, lesIdx, 'up')}
                            title="Move Lesson Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={lesIdx === mod.lessons.length - 1}
                            onClick={() => handleMoveLesson(mod.id, mod.lessons, lesIdx, 'down')}
                            title="Move Lesson Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleOpenEditLesson(mod.id, les)}
                            title="Edit Lesson"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteLesson(mod.id, les.id)}
                            title="Delete Lesson"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-card-lg bg-surface border border-surface-border p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-ink">
              {editingModuleId ? 'Edit Module' : 'Add New Module'}
            </h3>

            {moduleError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{moduleError}</p>
            )}

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g., Foundations of Agent Graph Execution"
                  className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  placeholder="Brief summary of module objectives"
                  className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModuleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmittingModule}>
                  <span>{isSubmittingModule ? 'Saving...' : 'Save Module'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-card-lg bg-surface border border-surface-border p-6 shadow-soft space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-ink">
              {editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}
            </h3>

            {lessonError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{lessonError}</p>
            )}

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g., State Graphs and Node Transitions"
                  className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Content Type</label>
                  <select
                    value={lessonContentType}
                    onChange={(e) => setLessonContentType(e.target.value as LessonContentType)}
                    className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink"
                  >
                    <option value="text">Text / Markdown</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="external_resource">External Resource</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Video URL (Optional)
                </label>
                <input
                  type="url"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Lesson Content *</label>
                <textarea
                  rows={6}
                  required
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  placeholder="Enter the lesson technical content, code snippets, and explanations."
                  className="w-full px-3 py-1.5 rounded-card-sm bg-canvas border border-surface-border text-xs font-mono text-ink leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPreviewCheckbox"
                  checked={lessonIsPreview}
                  onChange={(e) => setLessonIsPreview(e.target.checked)}
                  className="rounded border-surface-border text-ink"
                />
                <label htmlFor="isPreviewCheckbox" className="text-xs font-semibold text-ink cursor-pointer">
                  Free Preview (Accessible without active course enrollment)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLessonModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmittingLesson}>
                  <span>{isSubmittingLesson ? 'Saving...' : 'Save Lesson'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
