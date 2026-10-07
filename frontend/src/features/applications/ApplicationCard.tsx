import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ArrowRight, ShieldCheck, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMembership } from '@/features/membership';
import type { Application } from '@/types/application';

interface ApplicationCardProps {
  application: Application;
  canStartAssessment: boolean;
  assessmentStatus: 'not_started' | 'in_progress' | 'completed' | 'expired';
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  canStartAssessment,
  assessmentStatus,
}) => {
  const navigate = useNavigate();
  const { membership, isActiveMember } = useMembership();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(application.applicationNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (application.status) {
      case 'under_review':
        return <Badge variant="orange">Under Review</Badge>;
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="error">Declined</Badge>;
      case 'waitlisted':
        return <Badge variant="neutral">Waitlisted</Badge>;
      case 'submitted':
        return <Badge variant="info">Submitted</Badge>;
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  return (
    <div className="w-full bg-surface border border-surface-border rounded-card p-6 shadow-soft space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted uppercase font-mono tracking-wider">
              Application ID
            </span>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-ink">
              {application.applicationNumber}
            </h2>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-canvas-alt transition-colors"
              title="Copy Application Number"
              type="button"
            >
              {copied ? <Check className="h-4 w-4 text-accent-green" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {assessmentStatus === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/applicant/result')}
            >
              <FileText className="h-4 w-4 mr-1.5" />
              <span>View Result</span>
            </Button>
          )}

          {canStartAssessment && assessmentStatus !== 'completed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/applicant/assessment')}
            >
              <span>{assessmentStatus === 'in_progress' ? 'Resume Assessment' : 'Take 25-MCQ Assessment'}</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-card-sm bg-canvas-alt/50 border border-surface-border space-y-1">
          <span className="text-xs text-ink-muted">Academic Year</span>
          <p className="text-sm font-semibold text-ink">{application.academicYear}</p>
        </div>

        <div className="p-4 rounded-card-sm bg-canvas-alt/50 border border-surface-border space-y-1">
          <span className="text-xs text-ink-muted">Assessment Status</span>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            {assessmentStatus === 'completed' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-accent-green" />
                <span>
                  {application.assessmentScore !== null
                    ? `${application.assessmentScore}/25 (${application.assessmentPassed ? 'Passed' : 'Pending Review'})`
                    : 'Completed'}
                </span>
              </>
            ) : assessmentStatus === 'in_progress' ? (
              <>
                <Clock className="h-4 w-4 text-accent-orange" />
                <span>In Progress</span>
              </>
            ) : (
              <span>Pending Initiation</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-card-sm bg-canvas-alt/50 border border-surface-border space-y-1">
          <span className="text-xs text-ink-muted">Submission Date</span>
          <p className="text-sm font-semibold text-ink">
            {application.submittedAt
              ? new Date(application.submittedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Not yet submitted'}
          </p>
        </div>
      </div>

      {application.status === 'under_review' && (
        <div className="p-4 rounded-card-sm bg-surface-muted border border-surface-border flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-ink mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-ink">Application Under Committee Review</p>
            <p className="text-ink-muted">
              Your assessment and academic profile have been safely cataloged. The admissions board evaluates candidate submissions holistically. Final determinations will be announced upon review conclusion.
            </p>
          </div>
        </div>
      )}

      {application.status === 'approved' && isActiveMember && (
        <div className="p-4 rounded-card-sm bg-accent-green-subtle/50 border border-accent-green/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent-green mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-ink">Membership Officially Activated</p>
              <p className="text-ink-secondary">
                Your member credentials (<span className="font-mono font-bold text-ink">{membership?.memberNumber}</span>) are active. You may now enter the member workspace.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/member')}
            className="flex-shrink-0 bg-accent-green text-ink hover:bg-accent-green/90 font-semibold self-start sm:self-auto"
          >
            <span>Open Member Workspace</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      )}

      {application.status === 'approved' && !isActiveMember && (
        <div className="p-4 rounded-card-sm bg-accent-green-subtle/30 border border-accent-green/20 flex items-start gap-3">
          <Clock className="h-5 w-5 text-accent-green mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-ink">Application Formally Approved</p>
            <p className="text-ink-muted leading-relaxed">
              Congratulations! The admissions committee has accepted your application. Your official membership record and ID are currently being finalized by club administration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
