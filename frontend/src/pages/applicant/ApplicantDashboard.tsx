import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useApplication, ApplicationTimeline, ApplicationCard } from '@/features/applications';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  FileText,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const ApplicantDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { application, statusData, isLoading, error, createApplication, refreshStatus } =
    useApplication();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleStartApplication = async () => {
    setIsCreating(true);
    setCreateError(null);
    const res = await createApplication();
    setIsCreating(false);
    if (res.success && res.data) {
      navigate('/applicant/assessment');
    } else {
      setCreateError(res.error || 'Failed to initialize application.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading application status..." />
        <p className="text-xs text-ink-muted">Retrieving applicant record...</p>
      </div>
    );
  }

  const hasApp = statusData?.hasApplication ?? false;
  const canStartAssessment = statusData?.canStartAssessment ?? true;
  const assessmentStatus = statusData?.assessmentStatus ?? 'not_started';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-canvas-alt border border-surface-border text-xs font-mono text-ink-secondary">
            <Sparkles className="h-3.5 w-3.5 text-accent-lavender" />
            <span>AI Innovation Community Intake</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Welcome, {profile?.fullName || 'Applicant'}
          </h1>
          <p className="text-sm text-ink-muted max-w-xl">
            This portal manages your entrance progression, technical assessment, and admission review for the AI CLUB cohort.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <Link to="/applicant/assessment">
            <Button variant="primary" size="sm" className="shadow-subtle">
              <span>Take Assessment &rarr;</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Error Banner if any */}
      {(error || createError) && (
        <div className="p-4 rounded-card-sm bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Notice</p>
            <p className="text-xs mt-0.5">{error || createError}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refreshStatus()}>
            Retry
          </Button>
        </div>
      )}

      {/* Active Application or Application CTA */}
      {hasApp && application ? (
        <ApplicationCard
          application={application}
          canStartAssessment={canStartAssessment}
          assessmentStatus={assessmentStatus}
        />
      ) : (
        <div className="p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
          <div className="max-w-xl space-y-2">
            <div className="h-10 w-10 rounded-xl bg-ink text-canvas flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-ink">Begin Your AI CLUB Assessment</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Your application record (`AIC-YYYY-XXXXXX`) will be active and grant immediate access to the server-administered 25-Question MCQ Assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-card-sm bg-canvas-alt border border-surface-border space-y-1.5">
              <span className="text-xs font-mono font-semibold text-ink">Step 1: Account & Application</span>
              <p className="text-xs text-ink-muted">Automatic candidate registration record.</p>
            </div>
            <div className="p-4 rounded-card-sm bg-canvas-alt border border-surface-border space-y-1.5">
              <span className="text-xs font-mono font-semibold text-ink">Step 2: 25-MCQ Exam</span>
              <p className="text-xs text-ink-muted">30-minute timed evaluation covering AI, Python & Math.</p>
            </div>
            <div className="p-4 rounded-card-sm bg-canvas-alt border border-surface-border space-y-1.5">
              <span className="text-xs font-mono font-semibold text-ink">Step 3: Committee Review</span>
              <p className="text-xs text-ink-muted">Submissions enter committee queue for final admissions.</p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartApplication}
              isLoading={isCreating}
              disabled={isCreating}
            >
              <span>Start Assessment &rarr;</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Lifecycle Timeline */}
      <ApplicationTimeline
        hasApplication={hasApp}
        applicationStatus={application?.status}
        assessmentStatus={assessmentStatus}
      />

      {/* Assessment Guidelines & Policies */}
      <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-ink-muted" />
          <h3 className="text-base font-semibold text-ink">Assessment Policies & Format</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-ink-muted leading-relaxed">
          <div className="space-y-2 p-4 rounded-card-sm bg-canvas-alt/50 border border-surface-border">
            <h4 className="font-semibold text-ink flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent-green" />
              Examination Parameters
            </h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Exactly 25 multiple choice questions randomly sampled from question pool.</li>
              <li>30-minute strictly enforced server countdown timer.</li>
              <li>Answers are automatically synchronized and autosaved to database.</li>
              <li>Question order and selected answers persist seamlessly across page refresh.</li>
            </ul>
          </div>
          <div className="space-y-2 p-4 rounded-card-sm bg-canvas-alt/50 border border-surface-border">
            <h4 className="font-semibold text-ink flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent-lavender" />
              Evaluation & Admission Rules
            </h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Strictly one attempt per candidate application.</li>
              <li>Scoring is computed authoritatively on the server; pass mark is 60% (15/25).</li>
              <li>Passing assessment moves application to `UNDER_REVIEW`.</li>
              <li>Passing does NOT automatically approve membership; final admission is by committee review.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
