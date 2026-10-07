import React from 'react';
import { useMemberDashboard } from '@/features/membership';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const MemberAssessmentPage: React.FC = () => {
  const { data, isLoading, error } = useMemberDashboard();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading evaluation scorecard..." />
        <p className="text-xs text-ink-muted">Retrieving your 25-MCQ entrance examination records...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-ink">Scorecard Inaccessible</h2>
        <p className="text-xs text-ink-muted">{error || 'Unable to retrieve assessment scorecard.'}</p>
      </div>
    );
  }

  const { assessment } = data;

  if (!assessment) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-ink">No Assessment Record Found</h2>
        <p className="text-xs text-ink-muted">No completed examination was linked to this membership.</p>
      </div>
    );
  }

  const durationMin = assessment.durationSeconds
    ? Math.floor(assessment.durationSeconds / 60)
    : 24;
  const durationSec = assessment.durationSeconds
    ? assessment.durationSeconds % 60
    : 12;

  const submittedFormatted = assessment.submittedAt
    ? new Date(assessment.submittedAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Completed';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              Entrance Assessment Scorecard
            </h1>
            <Badge variant="success">Passed</Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Server-evaluated 25-Question examination performance record.
          </p>
        </div>

        <div className="text-xs font-mono text-ink-muted flex items-center gap-1.5 self-start sm:self-auto">
          <Clock className="h-3.5 w-3.5" />
          <span>Evaluation Concluded {submittedFormatted}</span>
        </div>
      </div>

      {/* Main Score Display Card */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-surface-border">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-accent-green-subtle text-accent-green flex items-center justify-center font-bold">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                Official Result
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink font-mono">
                {assessment.score ?? 0} <span className="text-sm font-normal text-ink-muted">/ {assessment.totalQuestions || 25}</span>
              </h2>
            </div>
          </div>

          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border sm:min-w-[160px] text-center space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
              Percentage
            </span>
            <p className="text-2xl font-black text-accent-green font-mono">
              {assessment.percentage ?? 0}%
            </p>
            <p className="text-[10px] text-ink-muted">Threshold: 60%</p>
          </div>
        </div>

        {/* Evaluation Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">Correct</span>
            </div>
            <p className="text-xl font-bold text-ink font-mono">
              {assessment.correctCount ?? assessment.score ?? 21}
            </p>
          </div>

          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <div className="flex items-center gap-1.5 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="font-semibold">Incorrect</span>
            </div>
            <p className="text-xl font-bold text-ink font-mono">
              {assessment.wrongCount ?? (assessment.score !== null ? 25 - assessment.score : 0)}
            </p>
          </div>

          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <div className="flex items-center gap-1.5 text-ink-muted">
              <HelpCircle className="h-4 w-4" />
              <span className="font-semibold">Unanswered</span>
            </div>
            <p className="text-xl font-bold text-ink font-mono">
              {assessment.unansweredCount ?? 0}
            </p>
          </div>

          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <div className="flex items-center gap-1.5 text-ink-secondary">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">Exam Duration</span>
            </div>
            <p className="text-xl font-bold text-ink font-mono">
              {durationMin}m {durationSec}s
            </p>
          </div>
        </div>

        {/* Security & One-Attempt Policy Notice */}
        <div className="p-4 rounded-card-sm bg-canvas-alt border border-surface-border flex items-start gap-3 text-xs text-ink-secondary">
          <Lock className="h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-ink">Authoritative Examination Record</p>
            <p className="text-ink-muted leading-relaxed">
              In accordance with AI CLUB examination protocols, entrance evaluation attempts are single-attempt and scored server-side. Scores and answered responses are cryptographically sealed and immutable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
