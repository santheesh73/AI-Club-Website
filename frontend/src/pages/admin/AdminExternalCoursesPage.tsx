import React, { useState, useEffect, useCallback } from 'react';
import {
  ExternalLink,
  Search,
  AlertCircle,
  ShieldCheck,
  Edit2,
  Trash2,
  RefreshCw,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Send,
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
  ExtractedCoursePreviewDto,
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

type ExtractionState = 'IDLE' | 'LOADING' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'ERROR' | 'SAVING' | 'SAVED';

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

  // 1. SMART URL IMPORT WORKFLOW STATE
  const [importUrl, setImportUrl] = useState<string>('');
  const [extractionState, setExtractionState] = useState<ExtractionState>('IDLE');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedCoursePreviewDto | null>(null);
  const [isPreviewEditing, setIsPreviewEditing] = useState<boolean>(false);
  const [previewForm, setPreviewForm] = useState<{
    title: string;
    description: string;
    category: CourseCategory;
    difficulty: ExternalCourseDifficulty;
    skills: string[];
    skillsText: string;
    imageUrl: string;
    duration: string;
    priceType: 'free' | 'paid' | 'freemium' | 'subscription';
  }>({
    title: '',
    description: '',
    category: 'MACHINE_LEARNING',
    difficulty: 'beginner',
    skills: [],
    skillsText: '',
    imageUrl: '',
    duration: '',
    priceType: 'free',
  });
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // 2. MODAL STATE (For manual edits of existing courses)
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
    status: 'draft',
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
          limit: 100,
        }),
        externalCoursesApi.getAdminStats(),
      ]);

      if (coursesRes.success && coursesRes.data) {
        const rawCourses = coursesRes.data;
        const list: ExternalCourseDto[] = Array.isArray(rawCourses)
          ? rawCourses
          : Array.isArray((rawCourses as any).courses)
          ? (rawCourses as any).courses
          : [];
        setCourses(list);
      } else {
        setError(!coursesRes.success ? (coursesRes as any).error?.message : 'Failed to fetch catalog');
      }

      if (statsRes.success && statsRes.data) {
        const rawStats = (statsRes.data as any).stats || statsRes.data;
        const total = rawStats.total ?? rawStats.totalCourses ?? 0;
        const published = rawStats.published ?? rawStats.publishedCourses ?? 0;
        const archived = rawStats.archived ?? Math.max(0, total - published);
        const byProvider = rawStats.byProvider ?? rawStats.providerCounts ?? {};
        const byCategory = rawStats.byCategory ?? rawStats.categoryCounts ?? {};
        setStats({
          total,
          published,
          archived,
          byProvider,
          byCategory,
        });
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

  // ============================================================================
  // URL EXTRACTION HANDLERS
  // ============================================================================

  const handleExtractUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    setExtractionState('LOADING');
    setExtractionError(null);
    setSaveSuccessMessage(null);
    setExtractedData(null);
    setIsPreviewEditing(false);

    try {
      const res = await externalCoursesApi.extractCourseDetails(importUrl.trim());

      if (res.success && res.data) {
        const payload = res.data;
        setExtractedData(payload);

        const meta = payload.metadata;
        const resolvedCategory = (meta.category as CourseCategory) || 'MACHINE_LEARNING';
        const resolvedDifficulty = (meta.difficulty as ExternalCourseDifficulty) || 'beginner';
        const skillsList = meta.skills || [];

        setPreviewForm({
          title: meta.title || '',
          description: meta.description || '',
          category: resolvedCategory,
          difficulty: resolvedDifficulty,
          skills: skillsList,
          skillsText: skillsList.join(', '),
          imageUrl: meta.imageUrl || '',
          duration: meta.duration || '',
          priceType: (meta.priceType as any) || 'free',
        });

        const isPartial = !meta.description || !meta.title || !meta.category;
        setExtractionState(isPartial ? 'PARTIAL_SUCCESS' : 'SUCCESS');
      } else {
        setExtractionState('ERROR');
        setExtractionError(!res.success ? res.error?.message : 'Unable to access this course page.');
      }
    } catch (err: any) {
      setExtractionState('ERROR');
      setExtractionError(err?.message || 'Unable to access this course page.');
    }
  };

  const handleSaveImportedCourse = async (publishImmediately: boolean) => {
    if (!extractedData) return;

    if (!previewForm.title.trim()) {
      alert('Please provide a course title before saving.');
      return;
    }

    setExtractionState('SAVING');
    try {
      const parsedSkills = previewForm.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const status = publishImmediately ? 'published' : 'draft';

      const res = await externalCoursesApi.createExternalCourse({
        title: previewForm.title.trim(),
        provider: extractedData.provider,
        officialUrl: extractedData.canonicalUrl || extractedData.sourceUrl,
        description: previewForm.description.trim(),
        category: previewForm.category,
        skills: parsedSkills,
        difficulty: previewForm.difficulty,
        imageUrl: previewForm.imageUrl || undefined,
        duration: previewForm.duration || undefined,
        priceType: previewForm.priceType,
        status,
        extractionMetadata: {
          extractionSource: extractedData.extraction,
          extractedAt: new Date().toISOString(),
          canonicalUrl: extractedData.canonicalUrl,
        },
      });

      if (res.success) {
        setExtractionState('SAVED');
        setSaveSuccessMessage(
          publishImmediately
            ? `Course "${previewForm.title}" published successfully to the Recommendation Engine!`
            : `Course "${previewForm.title}" saved as DRAFT. You can review and publish anytime.`
        );
        fetchData();
      } else {
        setExtractionState('ERROR');
        setExtractionError(!res.success ? res.error.message : 'Failed to save course record.');
      }
    } catch (err: any) {
      setExtractionState('ERROR');
      setExtractionError(err?.message || 'Failed to save course record.');
    }
  };

  const handlePublishCourse = async (id: string) => {
    try {
      const res = await externalCoursesApi.publishExternalCourse(id);
      if (res.success) {
        fetchData();
      } else {
        alert(!res.success ? res.error.message : 'Failed to publish course');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to publish course');
    }
  };

  const handleResetImport = () => {
    setImportUrl('');
    setExtractionState('IDLE');
    setExtractionError(null);
    setExtractedData(null);
    setSaveSuccessMessage(null);
    setIsPreviewEditing(false);
  };

  // ============================================================================
  // EXISTING MODAL HANDLERS
  // ============================================================================

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
      imageUrl: course.imageUrl || '',
    });
    setSkillsInput((course.skills || []).join(', '));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
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
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) return;
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
            Import official courses via URL from Coursera, freeCodeCamp, Udemy, Unstop, and other platforms. The system automatically extracts verified metadata for your review before publishing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => fetchData()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 1. PRIMARY WORKFLOW: SMART URL IMPORT & METADATA EXTRACTION */}
      {/* ====================================================================== */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-lavender" />
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Add External Course via Official URL
            </h2>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Paste any course link from a supported learning platform. The backend will validate the domain, safeguard against SSRF, extract structured metadata, and provide an editable preview.
          </p>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleExtractUrl} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <input
                id="external-course-url-input"
                type="url"
                required
                placeholder="https://www.coursera.org/learn/machine-learning or https://www.udemy.com/course/..."
                value={importUrl}
                onChange={(e) => {
                  setImportUrl(e.target.value);
                  setExtractionError(null);
                  if (extractionState === 'SAVED') setExtractionState('IDLE');
                }}
                disabled={extractionState === 'LOADING' || extractionState === 'SAVING'}
                className="w-full px-4 py-2.5 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink font-mono focus:outline-none focus:border-ink pr-10"
              />
              {importUrl && (
                <button
                  type="button"
                  onClick={() => setImportUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={extractionState === 'LOADING'}
              disabled={!importUrl.trim() || extractionState === 'LOADING' || extractionState === 'SAVING'}
              className="whitespace-nowrap px-6 shadow-subtle flex-shrink-0"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {extractionState === 'LOADING' ? 'Extracting Course Details...' : 'Extract Course Details'}
            </Button>
          </div>

          {/* Supported Provider Badges */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-ink-muted">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-ink">Supported:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">Coursera</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">freeCodeCamp</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold">Udemy</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">Unstop</span>
            <span className="text-[11px] text-ink-muted font-mono">+ edX, Kaggle, Google, Microsoft, AWS, NVIDIA</span>
          </div>
        </form>

        {/* EXTRACTION ERROR ALERT */}
        {extractionState === 'ERROR' && extractionError && (
          <div className="p-4 rounded-card-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Unable to access this course page.</p>
              <p className="text-ink-muted">{extractionError}</p>
            </div>
          </div>
        )}

        {/* SAVED SUCCESS ALERT */}
        {extractionState === 'SAVED' && saveSuccessMessage && (
          <div className="p-4 rounded-card-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              <span className="font-semibold">{saveSuccessMessage}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleResetImport} className="text-xs">
              Import Another Course
            </Button>
          </div>
        )}

        {/* ================================================================== */}
        {/* COURSE PREVIEW CARD (AFTER EXTRACTION) */}
        {/* ================================================================== */}
        {extractedData && extractionState !== 'SAVED' && (
          <div className="p-6 rounded-card bg-canvas border border-surface-border space-y-6 shadow-sm animate-in fade-in duration-300">
            {/* Header & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                  Course Preview
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getProviderBadgeVariant(extractedData.provider)}`}>
                  {extractedData.providerDisplayName}
                </span>
                <span className="text-[11px] font-mono text-ink-muted px-2 py-0.5 rounded bg-surface border border-surface-border">
                  Source: {extractedData.extraction.titleSource} + {extractedData.extraction.descriptionSource}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewEditing(!isPreviewEditing)}
                  className="text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  {isPreviewEditing ? 'View Preview' : 'Edit Details'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetImport}
                  className="text-xs text-ink-muted"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Duplicate Course Detected Alert */}
            {extractedData.isDuplicate && extractedData.existingCourse && (
              <div className="p-4 rounded-card-sm bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Course already exists in catalog.</p>
                    <p className="text-ink-muted mt-0.5">
                      "{extractedData.existingCourse.title}" is already registered (Status: {extractedData.existingCourse.status.toUpperCase()}).
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSearch(extractedData.existingCourse?.title || '')}
                  className="text-xs whitespace-nowrap"
                >
                  View Existing Course
                </Button>
              </div>
            )}

            {/* Preview Form / Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Preview & Official URL */}
              <div className="space-y-4">
                <div className="aspect-video w-full rounded-card-sm overflow-hidden bg-surface-muted border border-surface-border flex items-center justify-center relative">
                  {previewForm.imageUrl ? (
                    <img
                      src={previewForm.imageUrl}
                      alt={previewForm.title || 'Course thumbnail'}
                      className="w-full h-full object-cover"
                      onError={() => setPreviewForm({ ...previewForm, imageUrl: '' })}
                    />
                  ) : (
                    <div className="text-center p-4 text-ink-muted space-y-1">
                      <ImageIcon className="h-8 w-8 mx-auto opacity-40" />
                      <p className="text-[11px]">No image extracted</p>
                    </div>
                  )}
                </div>

                {isPreviewEditing && (
                  <div>
                    <label className="block text-[11px] font-semibold text-ink mb-1">
                      Thumbnail Image URL (optional)
                    </label>
                    <input
                      type="url"
                      value={previewForm.imageUrl}
                      onChange={(e) => setPreviewForm({ ...previewForm, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-card-sm bg-surface border border-surface-border text-xs text-ink font-mono focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono text-ink-muted uppercase">Official Provider URL</span>
                  <a
                    href={extractedData.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink font-mono text-[11px] hover:underline flex items-center gap-1 break-all"
                  >
                    <span>{extractedData.canonicalUrl}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  <p className="text-[10px] text-ink-muted">
                    Verified against official domain allowlist.
                  </p>
                </div>
              </div>

              {/* Main Metadata Details */}
              <div className="md:col-span-2 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                    Course Title *
                  </label>
                  {isPreviewEditing ? (
                    <input
                      type="text"
                      required
                      value={previewForm.title}
                      onChange={(e) => setPreviewForm({ ...previewForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-card-sm bg-surface border border-surface-border text-sm font-bold text-ink focus:outline-none focus:border-ink"
                    />
                  ) : (
                    <h3 className="text-lg sm:text-xl font-bold text-ink">
                      {previewForm.title || <span className="text-red-500 font-normal">Missing Title</span>}
                    </h3>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                    Description
                  </label>
                  {isPreviewEditing ? (
                    <textarea
                      rows={4}
                      value={previewForm.description}
                      onChange={(e) => setPreviewForm({ ...previewForm, description: e.target.value })}
                      placeholder="Enter course overview and curriculum description..."
                      className="w-full px-3 py-2 rounded-card-sm bg-surface border border-surface-border text-xs text-ink focus:outline-none focus:border-ink"
                    />
                  ) : previewForm.description ? (
                    <p className="text-xs text-ink-secondary leading-relaxed max-h-36 overflow-y-auto">
                      {previewForm.description}
                    </p>
                  ) : (
                    <div className="p-3 rounded-card-sm bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                      Description could not be extracted from this page. You can click "Edit Details" to enter it manually.
                    </div>
                  )}
                </div>

                {/* Grid: Category, Difficulty, Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-surface-border">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                      Category
                    </label>
                    {isPreviewEditing ? (
                      <select
                        value={previewForm.category}
                        onChange={(e) => setPreviewForm({ ...previewForm, category: e.target.value as CourseCategory })}
                        className="w-full px-2.5 py-1.5 rounded-card-sm bg-surface border border-surface-border text-xs text-ink"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-semibold text-ink">
                        {CATEGORY_OPTIONS.find((c) => c.value === previewForm.category)?.label || previewForm.category}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                      Difficulty
                    </label>
                    {isPreviewEditing ? (
                      <select
                        value={previewForm.difficulty}
                        onChange={(e) => setPreviewForm({ ...previewForm, difficulty: e.target.value as ExternalCourseDifficulty })}
                        className="w-full px-2.5 py-1.5 rounded-card-sm bg-surface border border-surface-border text-xs text-ink"
                      >
                        {DIFFICULTY_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-semibold text-ink capitalize">
                        {previewForm.difficulty}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                      Price Model
                    </label>
                    {isPreviewEditing ? (
                      <select
                        value={previewForm.priceType}
                        onChange={(e) => setPreviewForm({ ...previewForm, priceType: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded-card-sm bg-surface border border-surface-border text-xs text-ink"
                      >
                        <option value="free">Free</option>
                        <option value="freemium">Freemium</option>
                        <option value="paid">Paid</option>
                        <option value="subscription">Subscription</option>
                      </select>
                    ) : (
                      <span className="text-xs font-semibold text-ink uppercase font-mono">
                        {previewForm.priceType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div className="pt-2 border-t border-surface-border">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                    Skills Covered
                  </label>
                  {isPreviewEditing ? (
                    <input
                      type="text"
                      value={previewForm.skillsText}
                      onChange={(e) => setPreviewForm({ ...previewForm, skillsText: e.target.value })}
                      placeholder="Python, TensorFlow, Deep Learning (comma separated)"
                      className="w-full px-3 py-1.5 rounded-card-sm bg-surface border border-surface-border text-xs text-ink"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {previewForm.skillsText.split(',').filter(Boolean).length > 0 ? (
                        previewForm.skillsText.split(',').filter(Boolean).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] bg-surface border border-surface-border text-ink-secondary"
                          >
                            {s.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-ink-muted italic">No specific skills extracted. Admin can add skills.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Save as Draft vs Publish */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-surface-border">
              <span className="text-xs text-ink-muted">
                Admin review required before saving. Courses saved as DRAFT remain hidden until explicitly published.
              </span>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleSaveImportedCourse(false)}
                  isLoading={extractionState === 'SAVING'}
                  disabled={extractionState === 'SAVING' || extractedData.isDuplicate}
                  className="text-xs"
                >
                  Save as Draft
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleSaveImportedCourse(true)}
                  isLoading={extractionState === 'SAVING'}
                  disabled={extractionState === 'SAVING' || extractedData.isDuplicate}
                  className="text-xs shadow-subtle"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Publish to Engine
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Catalog Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-surface border-surface-border">
            <span className="text-[11px] font-mono uppercase text-ink-muted block">Catalog Size</span>
            <span className="text-2xl font-bold font-mono text-ink">{stats.total}</span>
          </Card>
          <Card className="p-4 bg-surface border-surface-border">
            <span className="text-[11px] font-mono uppercase text-ink-muted block">Published (Active)</span>
            <span className="text-2xl font-bold font-mono text-accent-green">{stats.published}</span>
          </Card>
          <Card className="p-4 bg-surface border-surface-border">
            <span className="text-[11px] font-mono uppercase text-ink-muted block">Drafts (Hidden)</span>
            <span className="text-2xl font-bold font-mono text-accent-orange">
              {stats.total - stats.published}
            </span>
          </Card>
          <Card className="p-4 bg-surface border-surface-border">
            <span className="text-[11px] font-mono uppercase text-ink-muted block">Verified Providers</span>
            <span className="text-2xl font-bold font-mono text-ink">
              {Object.keys(stats.byProvider || {}).length}
            </span>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-card bg-surface border border-surface-border flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by course title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs sm:text-sm text-ink focus:outline-none focus:border-ink"
          />
        </div>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink w-full md:w-auto"
        >
          <option value="">All Providers</option>
          {PROVIDER_OPTIONS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink w-full md:w-auto"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink w-full md:w-auto"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Courses Catalog Table */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" label="Loading external courses..." />
          <p className="text-xs text-ink-muted">Accessing verified educational catalog...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-card bg-surface border border-surface-border space-y-3">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-ink">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => fetchData()}>
            Retry
          </Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center rounded-card bg-surface border border-surface-border space-y-3">
          <BookOpen className="h-10 w-10 text-ink-muted mx-auto opacity-50" />
          <h3 className="text-base font-bold text-ink">No External Courses Found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            Paste a course URL in the section above to import from Coursera, freeCodeCamp, Udemy, or Unstop.
          </p>
        </div>
      ) : (
        <div className="rounded-card bg-surface border border-surface-border overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-surface-border text-ink-muted font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Course / Title</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {courses.map((c) => {
                  const isDraft = c.status === 'draft';
                  return (
                    <tr key={c.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-bold text-ink truncate">{c.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={c.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-ink-muted hover:text-ink hover:underline flex items-center gap-1 truncate max-w-[240px]"
                          >
                            <span>{c.officialUrl}</span>
                            <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getProviderBadgeVariant(c.providerKey || c.provider)}`}>
                          {c.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-ink">
                          {CATEGORY_OPTIONS.find((cat) => cat.value === c.category)?.label || c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize">
                        {c.difficulty || 'all_levels'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isDraft ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            DRAFT
                          </span>
                        ) : c.status === 'published' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            PUBLISHED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-ink-muted bg-surface-muted border border-surface-border">
                            {c.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDraft && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handlePublishCourse(c.id)}
                              className="text-[11px] h-7 px-2.5 shadow-subtle"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Publish
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(c)}
                            title="Edit Course Details"
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerify(c.id)}
                            title="Verify Official URL"
                            className="h-7 w-7 p-0"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-accent-green" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(c.id, c.title)}
                            title="Delete Course"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MANUAL EDIT MODAL (FOR EXISTING CATALOG RECORDS) */}
      {/* ====================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-surface-border rounded-card-lg max-w-xl w-full p-6 shadow-elevated space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-bold text-ink">
                {editingCourse ? 'Edit External Course Record' : 'Manual Course Entry'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-muted hover:text-ink text-sm p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-card-sm bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-4">
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
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
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
                <label className="block text-xs font-semibold text-ink mb-1">Official Course URL *</label>
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
                    <option value="draft">Draft (Hidden)</option>
                    <option value="published">Published (Active Recommendation)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Covered Skills (comma-separated)
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
                  Course Description
                </label>
                <textarea
                  rows={3}
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
