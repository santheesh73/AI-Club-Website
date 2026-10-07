import React, { useState, useEffect, useCallback } from 'react';
import {
  ExternalLink,
  Plus,
  Search,
  AlertCircle,
  Clock,
  ShieldCheck,
  Edit2,
  Trash2,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { externalCoursesApi } from '@/services/externalCoursesApi';
import type {
  ExternalCourseDto,
  AdminExternalCourseStatsDto,
  CreateExternalCourseDto,
  CourseProviderKey,
  CourseCategory,
  ExternalCourseDifficulty,
} from '@/types/externalCourses';

const PROVIDER_OPTIONS: { key: CourseProviderKey; label: string; domainHint: string }[] = [
  { key: 'COURSERA', label: 'Coursera', domainHint: 'coursera.org' },
  { key: 'FREECODECAMP', label: 'freeCodeCamp', domainHint: 'freecodecamp.org' },
  { key: 'UDEMY', label: 'Udemy', domainHint: 'udemy.com' },
  { key: 'UNSTOP', label: 'Unstop', domainHint: 'unstop.com' },
  { key: 'EDX', label: 'edX', domainHint: 'edx.org' },
  { key: 'KAGGLE', label: 'Kaggle', domainHint: 'kaggle.com' },
  { key: 'GOOGLE', label: 'Google Cloud / Skills', domainHint: 'cloud.google.com or grow.google' },
  { key: 'MICROSOFT', label: 'Microsoft Learn', domainHint: 'learn.microsoft.com' },
  { key: 'AWS', label: 'AWS Skill Builder', domainHint: 'skillbuilder.aws or aws.amazon.com' },
  { key: 'NVIDIA', label: 'NVIDIA Deep Learning Inst.', domainHint: 'nvidia.com' },
  { key: 'STANFORD', label: 'Stanford Online', domainHint: 'online.stanford.edu' },
  { key: 'MIT', label: 'MIT OpenCourseWare', domainHint: 'ocw.mit.edu' },
  { key: 'OTHER', label: 'Other Verified Provider', domainHint: 'https://...' },
];

const CATEGORY_OPTIONS: { value: CourseCategory; label: string }[] = [
  { value: 'AI', label: 'Artificial Intelligence' },
  { value: 'MACHINE_LEARNING', label: 'Machine Learning' },
  { value: 'DEEP_LEARNING', label: 'Deep Learning' },
  { value: 'GENERATIVE_AI', label: 'Generative AI' },
  { value: 'PYTHON', label: 'Python Programming' },
  { value: 'DATA_SCIENCE', label: 'Data Science' },
  { value: 'WEB_DEVELOPMENT', label: 'Web Development' },
  { value: 'FULL_STACK', label: 'Full Stack Development' },
  { value: 'CLOUD', label: 'Cloud Computing' },
  { value: 'CYBERSECURITY', label: 'Cybersecurity' },
  { value: 'DEVOPS', label: 'DevOps & MLOps' },
  { value: 'DATABASES', label: 'Databases & SQL' },
  { value: 'SOFTWARE_ENGINEERING', label: 'Software Engineering' },
  { value: 'DATA_ANALYTICS', label: 'Data Analytics' },
  { value: 'PROGRAMMING', label: 'Programming & Logic' },
  { value: 'OTHER', label: 'Other Technical Domain' },
];

const DIFFICULTY_OPTIONS: { value: ExternalCourseDifficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all_levels', label: 'All Levels' },
];

export const AdminExternalCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<ExternalCourseDto[]>([]);
  const [stats, setStats] = useState<AdminExternalCourseStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<ExternalCourseDto | null>(null);
  const [formData, setFormData] = useState<CreateExternalCourseDto>({
    title: '',
    provider: 'COURSERA',
    officialUrl: '',
    description: '',
    category: 'MACHINE_LEARNING',
    skills: [],
    difficulty: 'intermediate',
    priceType: 'free',
    status: 'published',
  });
  const [skillsInput, setSkillsInput] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [coursesRes, statsRes] = await Promise.all([
        externalCoursesApi.getAdminExternalCourses({
          search: search || undefined,
          provider: providerFilter || undefined,
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          limit: 50,
        }),
        externalCoursesApi.getAdminStats(),
      ]);

      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data.courses || []);
      } else {
        setError(!coursesRes.success ? coursesRes.error.message : 'Failed to fetch catalog');
      }


      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data.stats || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with external courses API');
    } finally {
      setIsLoading(false);
    }
  }, [search, providerFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      provider: 'COURSERA',
      officialUrl: '',
      description: '',
      category: 'MACHINE_LEARNING',
      skills: ['Machine Learning', 'Python'],
      difficulty: 'intermediate',
      priceType: 'free',
      status: 'published',
    });
    setSkillsInput('Machine Learning, Python');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: ExternalCourseDto) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      provider: course.providerKey || course.provider,
      officialUrl: course.officialUrl,
      description: course.description,
      category: (course.category as CourseCategory) || 'AI',
      skills: course.skills || [],
      difficulty: course.difficulty,
      priceType: course.priceType || 'free',
      status: course.status || 'published',
    });
    setSkillsInput((course.skills || []).join(', '));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!formData.officialUrl.trim()) {
      setFormError('Official URL is required');
      return;
    }

    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setFormSubmitting(true);
    try {
      if (editingCourse) {
        const res = await externalCoursesApi.updateExternalCourse(editingCourse.id, {
          ...formData,
          skills: parsedSkills,
        });
        if (res.success) {
          setIsModalOpen(false);
          fetchData();
        } else {
          setFormError(!res.success ? res.error.message : 'Failed to update course');
        }
      } else {
        const res = await externalCoursesApi.createExternalCourse({
          ...formData,
          skills: parsedSkills,
        });
        if (res.success) {
          setIsModalOpen(false);
          fetchData();
        } else {
          setFormError(!res.success ? res.error.message : 'Failed to create course');
        }
      }

    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit external course record');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      const res = await externalCoursesApi.verifyExternalCourse(id);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to verify course URL', err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove or archive "${title}"?`)) return;
    try {
      const res = await externalCoursesApi.deleteExternalCourse(id);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete external course', err);
    }
  };

  const getProviderBadgeVariant = (providerKey: string) => {
    switch (providerKey) {
      case 'COURSERA':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'FREECODECAMP':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'UDEMY':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'UNSTOP':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-surface-border/50 text-ink-muted border-surface-border';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="orange">Recommendation Engine Authority</Badge>
            <span className="text-xs font-mono text-ink-muted">Catalog Curated Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            External Course Catalog Management
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-2xl">
            Curate and verify official educational courses from Coursera, freeCodeCamp, Udemy, Unstop, and other trusted providers. The AI recommendation engine ranks exclusively from this verified catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => fetchData()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add External Course</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-ink-muted uppercase">Total Catalog</span>
            <p className="text-2xl font-extrabold text-ink">{stats.total}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-ink-muted uppercase">Active & Published</span>
            <p className="text-2xl font-extrabold text-accent-green">{stats.published}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-ink-muted uppercase">Archived</span>
            <p className="text-2xl font-extrabold text-ink-muted">{stats.archived}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-ink-muted uppercase">Providers Active</span>
            <p className="text-2xl font-extrabold text-ink">
              {Object.keys(stats.byProvider || {}).length}
            </p>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search catalog by title, skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="py-1.5 px-3 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink transition-colors"
          >
            <option value="">All Providers</option>
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink transition-colors"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink focus:outline-none focus:border-ink transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" label="Loading external courses..." />
          <p className="text-xs text-ink-muted">Reading verified catalog from database...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-card bg-surface border border-surface-border text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-ink">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => fetchData()}>
            Retry
          </Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 rounded-card-lg bg-surface border border-surface-border text-center space-y-4">
          <BookOpen className="h-10 w-10 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No external courses found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            No courses match your filter criteria. Click "Add External Course" to curate a new course.
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
            Add Course
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-surface-border bg-surface shadow-soft">
          <table className="w-full text-left text-sm text-ink divide-y divide-surface-border">
            <thead className="bg-canvas text-xs font-semibold text-ink-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Course / Title</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Skills</th>
                <th className="px-4 py-3">Verified Official URL</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-semibold text-ink line-clamp-1">{c.title}</div>
                    <div className="text-[11px] text-ink-muted line-clamp-1">{c.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getProviderBadgeVariant(
                        c.providerKey || c.provider
                      )}`}
                    >
                      {c.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-mono text-[11px]">{c.category.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {(c.skills || []).slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.2 rounded bg-canvas border border-surface-border text-[10px] text-ink-secondary"
                        >
                          {s}
                        </span>
                      ))}
                      {(c.skills || []).length > 3 && (
                        <span className="text-[10px] text-ink-muted self-center">
                          +{(c.skills || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <a
                      href={c.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <span className="truncate">{c.officialUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    {c.lastVerifiedAt && (
                      <div className="text-[10px] font-mono text-ink-muted flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>Verified {new Date(c.lastVerifiedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={c.status === 'published' ? 'success' : 'neutral'}
                      className="text-[10px]"
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVerify(c.id)}
                      title="Verify and refresh URL timestamp"
                      className="text-xs px-2"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-accent-green" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(c)}
                      title="Edit Course"
                      className="text-xs px-2"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-ink-muted" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(c.id, c.title)}
                      title="Archive or Delete Course"
                      className="text-xs px-2 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-surface border border-surface-border rounded-card-lg max-w-2xl w-full p-6 shadow-elevated space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h2 className="text-lg font-bold text-ink">
                {editingCourse ? 'Edit External Course Record' : 'Curate New External Course'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-muted hover:text-ink text-sm p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-card-sm bg-red-50 border border-red-200 text-xs text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Deep Learning Specialization"
                  className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Provider *</label>
                  <select
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value as CourseProviderKey })
                    }
                    className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
                  >
                    {PROVIDER_OPTIONS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as CourseCategory })
                    }
                    className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Verified Official URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.officialUrl}
                  onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                  placeholder="https://www.coursera.org/specializations/deep-learning"
                  className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink font-mono focus:outline-none focus:border-ink"
                />
                <p className="text-[10px] text-ink-muted mt-1">
                  Must be HTTPS and belong to an approved provider domain (e.g. coursera.org, freecodecamp.org, udemy.com, unstop.com).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Difficulty *</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty: e.target.value as ExternalCourseDifficulty,
                      })
                    }
                    className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
                  >
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Catalog Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'published' | 'draft' | 'archived',
                      })
                    }
                    className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
                  >
                    <option value="published">Published (Active Recommendation)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Covered Skills (comma-separated) *
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="Python, TensorFlow, Neural Networks, PyTorch"
                  className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Course Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Master deep learning concepts, convolution networks, recurrent networks, and transformers."
                  className="w-full px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={formSubmitting}>
                  {editingCourse ? 'Save Changes' : 'Curate Course'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
