import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApplication, ApplicationTimeline } from '@/features/applications';
import { assessmentApi } from '@/services/assessmentApi';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import type { AssessmentResult } from '@/types/assessment';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Printer,
} from 'lucide-react';

export const AssessmentResultPage: React.FC = () => {
  const { application, isLoading: appLoading } = useApplication();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (!application) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Start assessment endpoint returns existing attempt if one exists
        const startRes = await assessmentApi.startAssessment(application.id);
        if (startRes.success && startRes.data) {
          const attempt = startRes.data;
          const resultRes = await assessmentApi.getResult(attempt.id);
          if (resultRes.success && resultRes.data) {
            setResult(resultRes.data);
          } else if (!resultRes.success) {
            setError(resultRes.error.message || 'Could not fetch evaluation results.');
          }
        } else if (!startRes.success) {
          setError(startRes.error.message || 'Assessment not started or found.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error retrieving assessment results';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    if (application) {
      loadResult();
    }
  }, [application]);

  if (appLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Retrieving assessment evaluation..." />
        <p className="text-xs text-ink-muted">Verifying authoritative test results...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-accent-orange mx-auto" />
        <h2 className="text-lg font-semibold text-ink">Result Not Available</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {error || 'No completed assessment found for your application.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link to="/applicant">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Link to="/applicant/assessment">
            <Button variant="primary">Go to Assessment</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPassed = result.passed;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted uppercase">
            <Link to="/applicant" className="hover:text-ink transition-colors">
              Applicant Portal
            </Link>
            <span>/</span>
            <span className="text-ink">Assessment Results</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
            25-MCQ Evaluation Summary
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-1.5" />
            <span>Print Summary</span>
          </Button>
          <Link to="/applicant">
            <Button variant="primary" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-ink-muted uppercase">Application ID</span>
              <span className="text-xs font-mono font-bold text-ink">
                {application?.applicationNumber}
              </span>
            </div>
            <p className="text-xs text-ink-muted flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Submitted on{' '}
                {new Date(result.submittedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>

          <div>
            {isPassed ? (
              <Badge variant="success" className="text-sm px-3 py-1">
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Assessment Passed (≥ 60%)
              </Badge>
            ) : (
              <Badge variant="error" className="text-sm px-3 py-1">
                <XCircle className="h-4 w-4 mr-1.5" />
                Threshold Not Met (&lt; 60%)
              </Badge>
            )}
          </div>
        </div>

        {/* Score Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-card-sm bg-canvas-alt/70 border border-surface-border space-y-1">
            <span className="text-xs text-ink-muted">Total Score</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-ink">
              {result.score}{' '}
              <span className="text-sm font-sans font-normal text-ink-muted">
                / {result.totalQuestions}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-card-sm bg-canvas-alt/70 border border-surface-border space-y-1">
            <span className="text-xs text-ink-muted">Percentage</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-ink">
              {result.percentage}%
            </div>
          </div>

          <div className="p-4 rounded-card-sm bg-accent-green-subtle/50 border border-accent-green/20 space-y-1">
            <span className="text-xs text-accent-green-dark">Correct Answers</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-accent-green-dark">
              {result.totalCorrect}
            </div>
          </div>

          <div className="p-4 rounded-card-sm bg-canvas-alt/70 border border-surface-border space-y-1">
            <span className="text-xs text-ink-muted">Incorrect / Skipped</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-ink">
              {result.totalWrong + result.totalUnanswered}{' '}
              <span className="text-xs font-normal text-ink-muted">
                ({result.totalWrong} wrong, {result.totalUnanswered} unans)
              </span>
            </div>
          </div>
        </div>

        {/* Committee Review Notice - CRITICAL ARCHITECTURAL SEPARATION */}
        <div className="p-5 rounded-card bg-surface-muted border border-surface-border space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-ink mt-0.5 flex-shrink-0" />
            <div className="space-y-1.5 text-xs text-ink">
              <h4 className="font-semibold text-sm">
                Status: Application Under Committee Review
              </h4>
              <p className="text-ink-secondary leading-relaxed">
                Passing the technical assessment is a required milestone, but{' '}
                <strong className="text-ink">
                  it does not automatically grant AI CLUB membership or approve your admission
                </strong>
                .
              </p>
              <p className="text-ink-muted leading-relaxed">
                Your application dossier (academic profile, technical test percentile, and portfolio) has been securely cataloged into the admissions review queue. Final membership decisions will be made by the faculty and club leadership in <strong>Milestone 4 (Admin Review)</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <ApplicationTimeline
        profileComplete={true}
        hasApplication={true}
        applicationStatus="under_review"
        assessmentStatus="completed"
      />
    </div>
  );
};
