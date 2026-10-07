import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  HelpCircle,
  Plus,
  CheckCircle2,
  Clock,
  Archive,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Check,
  Send,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  adminAssessmentApi,
  AdminQuestion,
  CreateOrEditQuestionInput,
  GenerateMCQRequest,
  GenerationResult,
} from '@/services/adminAssessmentApi';

const CATEGORIES = [
  'AI Fundamentals',
  'Machine Learning',
  'Deep Learning',
  'Generative AI',
  'Python',
  'Programming',
  'Data Science',
  'Computer Science',
  'Logical Reasoning',
  'Web Development',
];

export const AdminAssessmentPage: React.FC = () => {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'bank' | 'review'>('bank');

  // Generation Modal & Form State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genCount, setGenCount] = useState(10);
  const [genCategory, setGenCategory] = useState('AI Fundamentals');
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [genTopic, setGenTopic] = useState('');
  const [genInstructions, setGenInstructions] = useState('');
  const [genResult, setGenResult] = useState<GenerationResult | null>(null);

  // Edit / Manual Creation Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [editForm, setEditForm] = useState<CreateOrEditQuestionInput>({
    questionText: '',
    category: 'AI Fundamentals',
    difficulty: 'medium',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanation: '',
    status: 'draft',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Staged selection for batch publish
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [isPublishingBatch, setIsPublishingBatch] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminAssessmentApi.getQuestions({
        category: categoryFilter,
        status: statusFilter,
        search: searchQuery.trim() || undefined,
        pageSize: 100,
      });

      if (res.success && res.data) {
        setQuestions(res.data);
      } else if (!res.success) {
        setError(res.error.message || 'Failed to retrieve question bank.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching questions';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Statistics
  const totalCount = questions.length;
  const publishedCount = questions.filter((q) => q.status === 'published').length;
  const draftCount = questions.filter((q) => q.status === 'draft').length;
  const archivedCount = questions.filter((q) => q.status === 'archived').length;

  // Handle Gemini Generation Request
  const handleGenerateMCQs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    const req: GenerateMCQRequest = {
      count: Number(genCount) || 10,
      category: genCategory,
      difficulty: genDifficulty,
      topic: genTopic.trim() || undefined,
      additionalInstructions: genInstructions.trim() || undefined,
    };

    try {
      const res = await adminAssessmentApi.generateMCQs(req);
      if (res.success && res.data) {
        setGenResult(res.data);
        setIsGenModalOpen(false);
        setActiveTab('review');
        showNotification(
          'success',
          `Successfully generated ${res.data.validCount} valid MCQ questions staged in Draft review.`
        );
        // Pre-select all newly generated questions for publication
        const newIds = res.data.questions.map((q) => q.id).filter(Boolean) as string[];
        setSelectedDraftIds(newIds);
        await loadQuestions();
      } else if (!res.success) {
        setError(res.error.message || 'Generation failed. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation request failed';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (q?: AdminQuestion) => {
    setEditError(null);
    if (q) {
      setEditingQuestion(q);
      setEditForm({
        questionText: q.questionText,
        category: q.category,
        difficulty: q.difficulty,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        explanation: q.explanation || '',
        status: q.status,
      });
    } else {
      setEditingQuestion(null);
      setEditForm({
        questionText: '',
        category: 'AI Fundamentals',
        difficulty: 'medium',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        explanation: '',
        status: 'draft',
      });
    }
    setIsEditModalOpen(true);
  };

  // Save Edit / Create Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    setEditError(null);

    // Frontend validation
    if (!editForm.questionText.trim()) {
      setEditError('Question text cannot be blank.');
      setIsSavingEdit(false);
      return;
    }
    if (!editForm.optionA.trim() || !editForm.optionB.trim() || !editForm.optionC.trim() || !editForm.optionD.trim()) {
      setEditError('All 4 options (A, B, C, D) must be provided.');
      setIsSavingEdit(false);
      return;
    }

    try {
      if (editingQuestion) {
        const res = await adminAssessmentApi.updateQuestion(editingQuestion.id, editForm);
        if (res.success) {
          setIsEditModalOpen(false);
          showNotification('success', 'Question updated successfully.');
          await loadQuestions();
        } else {
          setEditError(res.error.message || 'Failed to update question.');
        }
      } else {
        const res = await adminAssessmentApi.createQuestion(editForm);
        if (res.success) {
          setIsEditModalOpen(false);
          showNotification('success', 'Question created successfully in Draft.');
          await loadQuestions();
        } else {
          setEditError(res.error.message || 'Failed to create question.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setEditError(msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Publish Individual Question
  const handlePublishQuestion = async (id: string) => {
    try {
      const res = await adminAssessmentApi.publishQuestion(id);
      if (res.success) {
        showNotification('success', 'Question published to active assessment pool.');
        await loadQuestions();
      } else {
        showNotification('error', res.error.message || 'Publishing failed.');
      }
    } catch {
      showNotification('error', 'Publishing failed.');
    }
  };

  // Archive Question
  const handleArchiveQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this question? It will no longer appear in assessments.')) return;
    try {
      const res = await adminAssessmentApi.deleteQuestion(id);
      if (res.success) {
        showNotification('success', 'Question archived.');
        await loadQuestions();
      } else {
        showNotification('error', res.error.message || 'Archive failed.');
      }
    } catch {
      showNotification('error', 'Archive failed.');
    }
  };

  // Batch Publish Selected Drafts
  const handlePublishBatch = async () => {
    if (selectedDraftIds.length === 0) return;
    setIsPublishingBatch(true);
    try {
      const res = await adminAssessmentApi.publishBatch(selectedDraftIds);
      if (res.success && res.data) {
        showNotification(
          'success',
          `Successfully published ${res.data.publishedCount} questions to the entrance assessment bank!`
        );
        setSelectedDraftIds([]);
        await loadQuestions();
      } else if (!res.success) {
        showNotification('error', res.error.message || 'Batch publication failed.');
      }
    } catch {
      showNotification('error', 'Batch publication failed.');
    } finally {
      setIsPublishingBatch(false);
    }
  };

  // Toggle selection for batch publish
  const toggleSelectDraft = (id: string) => {
    setSelectedDraftIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const draftQuestions = questions.filter((q) => q.status === 'draft');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className={`p-4 rounded-cardSm flex items-center justify-between text-sm shadow-subtle ${
            notification.type === 'success'
              ? 'bg-accent-green-subtle border border-accent-green/30 text-accent-green-dark'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-accent-green" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-surface-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Assessment Question Bank
            </h1>
            <Badge variant="lavender">Google Gemini Assistant</Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted">
            Server-guarded question bank and Google Gemini MCQ generation engine. Published questions supply the 25-MCQ applicant entrance assessment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsGenModalOpen(true)}
            className="shadow-subtle gap-2 bg-gradient-to-r from-accent-purple to-ink hover:opacity-95"
          >
            <Sparkles className="h-4 w-4 text-accent-lavender" />
            <span>Generate MCQs with Gemini</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => openEditModal()}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Manual Question</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadQuestions()}
            title="Refresh Question Bank"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-card bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-sm shadow-soft">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-800 p-1 rounded-cardSm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Total Bank</span>
            <FileText className="h-4 w-4 text-ink-muted" />
          </div>
          <p className="text-2xl font-bold font-mono text-ink">{totalCount}</p>
        </div>

        <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Published (Live)</span>
            <CheckCircle2 className="h-4 w-4 text-accent-green" />
          </div>
          <p className="text-2xl font-bold font-mono text-accent-green-dark">{publishedCount}</p>
          <span className="text-[10px] text-ink-muted">Eligible for applicant exams</span>
        </div>

        <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Draft (Review Required)</span>
            <Clock className="h-4 w-4 text-accent-orange" />
          </div>
          <p className="text-2xl font-bold font-mono text-accent-orange-dark">{draftCount}</p>
          <span className="text-[10px] text-ink-muted">Requires admin approval</span>
        </div>

        <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Archived</span>
            <Archive className="h-4 w-4 text-ink-muted" />
          </div>
          <p className="text-2xl font-bold font-mono text-ink-muted">{archivedCount}</p>
          <span className="text-[10px] text-ink-muted">Inactive historical records</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2">
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 text-sm font-medium rounded-cardSm transition-colors ${
            activeTab === 'bank'
              ? 'bg-ink text-canvas font-semibold'
              : 'text-ink-secondary hover:text-ink hover:bg-canvas-alt'
          }`}
        >
          Question Bank ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 text-sm font-medium rounded-cardSm flex items-center gap-2 transition-colors ${
            activeTab === 'review'
              ? 'bg-ink text-canvas font-semibold'
              : 'text-ink-secondary hover:text-ink hover:bg-canvas-alt'
          }`}
        >
          <span>Staged Draft Review</span>
          {draftCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-bold bg-accent-orange text-canvas rounded-pill">
              {draftCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: QUESTION BANK LIST */}
      {activeTab === 'bank' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="p-4 rounded-card bg-surface border border-surface-border shadow-soft flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-4 w-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search question text or explanations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas border border-surface-border rounded-cardSm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-canvas border border-surface-border rounded-cardSm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="all">All Domains</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-canvas border border-surface-border rounded-cardSm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
                <option value="archived">Archived Only</option>
              </select>
            </div>

            <div className="text-xs text-ink-muted font-mono">
              Showing {questions.length} items
            </div>
          </div>

          {/* Table / Cards */}
          {isLoading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" label="Loading questions..." />
              <p className="text-xs text-ink-muted">Retrieving questions from Supabase...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center rounded-card-lg bg-surface border border-surface-border space-y-3">
              <HelpCircle className="h-10 w-10 text-ink-muted mx-auto" />
              <h3 className="font-semibold text-ink text-base">No Questions Found</h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                No questions matched your current filter criteria. Try clearing search or generate new questions using Gemini.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsGenModalOpen(true)}
                className="mt-2"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                <span>Generate Questions</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-5 rounded-card bg-surface border border-surface-border hover:border-ink/20 shadow-soft transition-all space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-semibold text-ink-muted">
                        #{idx + 1}
                      </span>
                      <Badge
                        variant={
                          q.status === 'published'
                            ? 'success'
                            : q.status === 'draft'
                            ? 'orange'
                            : 'neutral'
                        }
                      >
                        {q.status.toUpperCase()}
                      </Badge>
                      {q.source === 'AI_GENERATED' ? (
                        <Badge variant="lavender">AI Generated</Badge>
                      ) : (
                        <Badge variant="neutral">Manual</Badge>
                      )}
                      <span className="text-xs bg-canvas-alt px-2.5 py-0.5 rounded-pill border border-surface-border font-medium text-ink-secondary">
                        {q.category}
                      </span>
                      <span className="text-xs uppercase font-mono text-ink-muted">
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.status === 'draft' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublishQuestion(q.id)}
                          className="gap-1 text-xs"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Publish</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(q)}
                        className="gap-1 text-xs"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>
                      {q.status !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveQuestion(q.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm sm:text-base font-medium text-ink leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                      const text =
                        optKey === 'A'
                          ? q.optionA
                          : optKey === 'B'
                          ? q.optionB
                          : optKey === 'C'
                          ? q.optionC
                          : q.optionD;
                      const isCorrect = q.correctOption === optKey;

                      return (
                        <div
                          key={optKey}
                          className={`p-2.5 rounded-cardSm border flex items-start gap-2.5 transition-colors ${
                            isCorrect
                              ? 'bg-accent-green-subtle/40 border-accent-green/50 text-ink'
                              : 'bg-canvas-alt/50 border-surface-border text-ink-secondary'
                          }`}
                        >
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] shrink-0 ${
                              isCorrect
                                ? 'bg-accent-green text-canvas'
                                : 'bg-surface border border-surface-border text-ink-muted'
                            }`}
                          >
                            {optKey}
                          </span>
                          <span className="leading-snug">{text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Footer */}
                  {q.explanation && (
                    <div className="p-3 rounded-cardSm bg-canvas-alt/40 border border-surface-border text-xs text-ink-muted space-y-1">
                      <span className="font-semibold text-ink block text-[11px] uppercase tracking-wider">
                        Technical Explanation:
                      </span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STAGED DRAFT REVIEW AREA */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* Generation Run Summary Banner */}
          {genResult && (
            <div className="p-4 rounded-card bg-surface border border-surface-border flex flex-wrap items-center justify-between gap-4 shadow-soft">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Last Generation Run Summary
                </span>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <span className="text-ink">
                    Requested: <strong>{genResult.requestedCount}</strong>
                  </span>
                  <span className="text-accent-green-dark">
                    Valid: <strong>{genResult.validCount}</strong>
                  </span>
                  <span className="text-accent-orange-dark">
                    Duplicates Removed: <strong>{genResult.duplicatesRemoved}</strong>
                  </span>
                  <span className="text-ink-muted">
                    Invalid Dropped: <strong>{genResult.invalidRemoved}</strong>
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setGenResult(null)}>
                Dismiss
              </Button>
            </div>
          )}

          <div className="p-6 rounded-card-lg bg-surface border border-surface-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-ink">Staged Draft Questions for Review</h2>
              <p className="text-xs text-ink-muted max-w-xl">
                These candidate questions were generated by Gemini. Admins must review, edit, and approve them before they enter the applicant 25-MCQ evaluation pool.
              </p>
            </div>

            {draftQuestions.length > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedDraftIds.length === draftQuestions.length) {
                      setSelectedDraftIds([]);
                    } else {
                      setSelectedDraftIds(draftQuestions.map((q) => q.id));
                    }
                  }}
                >
                  {selectedDraftIds.length === draftQuestions.length ? 'Deselect All' : 'Select All'}
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handlePublishBatch}
                  disabled={selectedDraftIds.length === 0 || isPublishingBatch}
                  className="gap-2 shadow-subtle"
                >
                  {isPublishingBatch ? (
                    <Spinner size="sm" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Publish Selected ({selectedDraftIds.length})</span>
                </Button>
              </div>
            )}
          </div>

          {draftQuestions.length === 0 ? (
            <div className="p-12 text-center rounded-card-lg bg-surface border border-surface-border space-y-3">
              <CheckCircle2 className="h-10 w-10 text-accent-green mx-auto" />
              <h3 className="font-semibold text-ink text-base">No Draft Questions Pending Review</h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                All questions have been published or archived. Click below to generate a new cohort of questions using Gemini.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsGenModalOpen(true)}
                className="mt-2"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                <span>Generate Questions</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {draftQuestions.map((q, idx) => {
                const isSelected = selectedDraftIds.includes(q.id);

                return (
                  <div
                    key={q.id}
                    className={`p-6 rounded-card border transition-all space-y-4 shadow-soft ${
                      isSelected
                        ? 'bg-surface border-ink/40 ring-1 ring-ink/10'
                        : 'bg-surface border-surface-border'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectDraft(q.id)}
                          className="h-4 w-4 rounded border-surface-border text-ink focus:ring-ink"
                        />
                        <span className="text-xs font-mono font-bold text-ink">
                          Draft #{idx + 1}
                        </span>
                        <Badge variant="orange">Draft</Badge>
                        <Badge variant="lavender">AI Generated</Badge>
                        <span className="text-xs bg-canvas-alt px-2.5 py-0.5 rounded-pill border border-surface-border font-medium text-ink-secondary">
                          {q.category}
                        </span>
                        <span className="text-xs uppercase font-mono text-ink-muted">
                          {q.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublishQuestion(q.id)}
                          className="text-xs gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve & Publish</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(q)}
                          className="text-xs gap-1"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveQuestion(q.id)}
                          className="text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Discard</span>
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-semibold text-ink leading-relaxed">
                      {q.questionText}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                        const text =
                          optKey === 'A'
                            ? q.optionA
                            : optKey === 'B'
                            ? q.optionB
                            : optKey === 'C'
                            ? q.optionC
                            : q.optionD;
                        const isCorrect = q.correctOption === optKey;

                        return (
                          <div
                            key={optKey}
                            className={`p-3 rounded-cardSm border flex items-start gap-2.5 ${
                              isCorrect
                                ? 'bg-accent-green-subtle/50 border-accent-green text-ink font-medium'
                                : 'bg-canvas-alt/50 border-surface-border text-ink-secondary'
                            }`}
                          >
                            <span
                              className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] shrink-0 ${
                                isCorrect
                                  ? 'bg-accent-green text-canvas'
                                  : 'bg-surface border border-surface-border text-ink-muted'
                              }`}
                            >
                              {optKey}
                            </span>
                            <span className="leading-snug">{text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3 rounded-cardSm bg-canvas-alt/40 border border-surface-border text-xs text-ink-muted space-y-1">
                        <span className="font-semibold text-ink block text-[11px] uppercase tracking-wider">
                          Explanation:
                        </span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GEMINI MCQ GENERATION MODAL */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-card-lg bg-surface border border-surface-border p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-accent-lavender-subtle text-accent-lavender flex items-center justify-center font-bold">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">Generate MCQs with Gemini</h3>
                  <p className="text-xs text-ink-muted">Server-side Google Gemini structured synthesis</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="text-ink-muted hover:text-ink"
                disabled={isGenerating}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateMCQs} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink block mb-1">
                  Number of Questions (1 - 50)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    className="flex-1 accent-ink"
                    disabled={isGenerating}
                  />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={genCount}
                    onChange={(e) => setGenCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="w-16 px-2 py-1 bg-canvas border border-surface-border rounded-cardSm text-center font-mono font-bold text-ink"
                    disabled={isGenerating}
                  />
                </div>
                <span className="text-[10px] text-ink-muted mt-1 block">
                  Recommended: 10 to 25 questions per batch.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Domain Category</label>
                  <select
                    value={genCategory}
                    onChange={(e) => setGenCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    disabled={isGenerating}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Target Difficulty</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    disabled={isGenerating}
                  >
                    <option value="mixed">Mixed (Balanced)</option>
                    <option value="easy">Beginner (Easy)</option>
                    <option value="medium">Intermediate (Medium)</option>
                    <option value="hard">Advanced (Hard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">
                  Specific Topic / Focus <span className="text-ink-muted">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Attention Mechanism, Gradient Descent, Python Async IO..."
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">
                  Additional Guidance <span className="text-ink-muted">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Emphasize algorithmic efficiency and memory complexity..."
                  value={genInstructions}
                  onChange={(e) => setGenInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
                  disabled={isGenerating}
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGenModalOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isGenerating}
                  className="gap-2 bg-gradient-to-r from-accent-purple to-ink"
                >
                  {isGenerating ? (
                    <>
                      <Spinner size="sm" />
                      <span>Synthesizing Questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate {genCount} Questions</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION EDIT / MANUAL CREATE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card-lg bg-surface border border-surface-border p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h3>
                <p className="text-xs text-ink-muted">
                  Configure question text, all 4 options, authoritative answer key, and technical explanation.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-ink-muted hover:text-ink"
                disabled={isSavingEdit}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-cardSm text-xs text-red-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink block mb-1">Question Text</label>
                <textarea
                  rows={3}
                  required
                  value={editForm.questionText}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, questionText: e.target.value }))}
                  className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  placeholder="Enter the technical question text..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-ink block mb-1">Difficulty</label>
                  <select
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  >
                    <option value="easy">Easy (Beginner)</option>
                    <option value="medium">Medium (Intermediate)</option>
                    <option value="hard">Hard (Advanced)</option>
                  </select>
                </div>
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-3 pt-2">
                <span className="font-semibold text-ink block">Options & Designated Correct Answer</span>

                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div key={opt} className="flex items-center gap-3">
                    <span className="font-mono font-bold px-2 py-1.5 bg-canvas-alt border border-surface-border rounded-cardSm text-ink w-8 text-center">
                      {opt}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${opt} text...`}
                      value={
                        opt === 'A'
                          ? editForm.optionA
                          : opt === 'B'
                          ? editForm.optionB
                          : opt === 'C'
                          ? editForm.optionC
                          : editForm.optionD
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditForm((prev) => ({
                          ...prev,
                          ...(opt === 'A' ? { optionA: val } : {}),
                          ...(opt === 'B' ? { optionB: val } : {}),
                          ...(opt === 'C' ? { optionC: val } : {}),
                          ...(opt === 'D' ? { optionD: val } : {}),
                        }));
                      }}
                      className="flex-1 px-3 py-1.5 bg-canvas border border-surface-border rounded-cardSm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-ink whitespace-nowrap">
                      <input
                        type="radio"
                        name="correctOption"
                        value={opt}
                        checked={editForm.correctOption === opt}
                        onChange={() => setEditForm((prev) => ({ ...prev, correctOption: opt }))}
                        className="accent-accent-green"
                      />
                      <span>Correct</span>
                    </label>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">
                  Technical Explanation
                </label>
                <textarea
                  rows={2}
                  value={editForm.explanation || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Detail the authoritative reason why the designated option is correct..."
                  className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSavingEdit}>
                  {isSavingEdit ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Question</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
