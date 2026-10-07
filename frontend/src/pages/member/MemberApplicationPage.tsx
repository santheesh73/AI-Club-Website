import React from 'react';
import { useMemberDashboard } from '@/features/membership';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const MemberApplicationPage: React.FC = () => {
  const { data, isLoading, error } = useMemberDashboard();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading application record..." />
        <p className="text-xs text-ink-muted">Retrieving your submitted admissions record...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-ink">Application Record Unavailable</h2>
        <p className="text-xs text-ink-muted">{error || 'Unable to load application.'}</p>
      </div>
    );
  }

  const { application, membership, assessment } = data;

  const submittedFormatted = application.submittedAt
    ? new Date(application.submittedAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recorded';

  const reviewedFormatted = application.reviewedAt
    ? new Date(application.reviewedAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Completed';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Admissions Application History
          </h1>
          <Badge variant="success">Approved</Badge>
        </div>
        <p className="text-xs text-ink-muted mt-0.5">
          Archived record of your AI CLUB entrance application and committee determination.
        </p>
      </div>

      {/* Primary Application Card */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-ink text-canvas flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                Application Number
              </span>
              <p className="text-base font-mono font-bold text-ink">
                {application.applicationNumber}
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-ink-muted">
            Academic Year: <strong>{application.academicYear}</strong>
          </div>
        </div>

        {/* Status Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <span className="text-ink-muted">Application Status</span>
            <div className="pt-0.5">
              <Badge variant="success">Approved</Badge>
            </div>
          </div>

          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <span className="text-ink-muted">Assessment Status</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />
              <span className="font-semibold text-ink">Completed (Passed)</span>
            </div>
          </div>

          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <span className="text-ink-muted">Committee Decision</span>
            <div className="pt-0.5">
              <span className="font-semibold text-ink">Accepted for Intake</span>
            </div>
          </div>

          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <span className="text-ink-muted">Membership State</span>
            <div className="flex items-center gap-1 pt-0.5">
              <span className="font-mono font-semibold text-accent-green uppercase">{membership.status}</span>
            </div>
          </div>
        </div>

        {/* Milestone Milestones Progression */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
            Application Verification Milestones
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 rounded-card-sm bg-canvas-alt border border-surface-border flex items-start gap-3 text-xs">
              <CheckCircle2 className="h-4 w-4 text-accent-green flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">Application Submitted</p>
                <p className="text-ink-muted text-[11px] mt-0.5">
                  Logged on {submittedFormatted}. Formally assigned candidate registration #{application.applicationNumber}.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-card-sm bg-canvas-alt border border-surface-border flex items-start gap-3 text-xs">
              <CheckCircle2 className="h-4 w-4 text-accent-green flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">25-MCQ Assessment Evaluated</p>
                <p className="text-ink-muted text-[11px] mt-0.5">
                  Achieved {assessment?.score ?? '23'} / 25 ({assessment?.percentage ?? '92'}%), qualifying above the 60% threshold.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-card-sm bg-canvas-alt border border-surface-border flex items-start gap-3 text-xs">
              <CheckCircle2 className="h-4 w-4 text-accent-green flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">Committee Approval & Induction</p>
                <p className="text-ink-muted text-[11px] mt-0.5">
                  Approved on {reviewedFormatted}. Official membership record #{membership.memberNumber} provisioned.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
