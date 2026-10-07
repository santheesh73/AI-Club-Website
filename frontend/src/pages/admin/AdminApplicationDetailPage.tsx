import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useAdminApplicationDetail,
  ApproveConfirmModal,
  WaitlistConfirmModal,
  RejectReasonModal,
  ActivateMembershipModal,
} from '@/features/admin';
import { membershipApi } from '@/services/membershipApi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  ArrowLeft,
  User,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
  History,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const AdminApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    detail,
    isLoading,
    isSubmitting: isDecisionSubmitting,
    error: decisionError,
    decisionSuccessMessage,
    approve,
    waitlist,
    reject,
    clearMessages,
    refresh,
  } = useAdminApplicationDetail(id);

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);

  const handleActivateMembership = async (notes?: string) => {
    if (!detail) return;
    try {
      setIsActivating(true);
      setActivationError(null);
      const res = await membershipApi.activateMembership(detail.application.id, notes);
      if (res.success) {
        setActivationSuccess(
          res.data.message ||
            `Membership successfully activated! Member #: ${res.data.membership.memberNumber}`
        );
        setIsActivateModalOpen(false);
        if (refresh) await refresh();
      } else {
        setActivationError(res.error.message || 'Failed to activate membership');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Activation error';
      setActivationError(msg);
    } finally {
      setIsActivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading applicant dossier..." />
        <p className="text-xs text-ink-muted">Retrieving candidate academic and evaluation records...</p>
      </div>
    );
  }

  if (decisionError && !detail) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-semibold text-ink">Applicant Dossier Not Found</h2>
        <p className="text-xs text-ink-muted leading-relaxed">{decisionError}</p>
        <Link to="/admin/applications">
          <Button variant="primary">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span>Return to Applications</span>
          </Button>
        </Link>
      </div>
    );
  }

  if (!detail) return null;

  const { application, student, assessment, auditLogs } = detail;
  const isUnderReview = application.status === 'under_review' || application.status === 'test_completed';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'under_review':
        return <Badge variant="orange">Under Review</Badge>;
      case 'waitlisted':
        return <Badge variant="neutral">Waitlisted</Badge>;
      case 'rejected':
        return <Badge variant="error">Declined</Badge>;
      case 'test_completed':
        return <Badge variant="lavender">Test Completed</Badge>;
      default:
        return <Badge variant="neutral">{status.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Return Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <Link to="/admin/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span>Back to Queue</span>
            </Button>
          </Link>
          <div className="h-4 w-[1px] bg-surface-border" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-ink">
              {application.applicationNumber}
            </span>
            {getStatusBadge(application.status)}
          </div>
        </div>

        <div className="text-xs font-mono text-ink-muted">
          Academic Year: <strong>{application.academicYear}</strong>
        </div>
      </div>

      {/* Success Notification */}
      {(decisionSuccessMessage || activationSuccess) && (
        <div className="p-4 rounded-card-sm bg-accent-green-subtle border border-accent-green/30 text-xs text-accent-green-dark flex items-start justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <p className="font-semibold">{decisionSuccessMessage || activationSuccess}</p>
          </div>
          <button
            onClick={() => {
              clearMessages();
              setActivationSuccess(null);
            }}
            className="text-accent-green-dark hover:underline font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {(decisionError || activationError) && (
        <div className="p-4 rounded-card-sm bg-red-50 border border-red-200 text-xs text-red-700 flex items-start justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <p className="font-semibold">{decisionError || activationError}</p>
          </div>
          <button
            onClick={() => {
              clearMessages();
              setActivationError(null);
            }}
            className="text-red-700 hover:underline font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Student Profile & Assessment Performance */}
        <div className="lg:col-span-8 space-y-6">
          {/* Student Profile Card */}
          <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-canvas-alt border border-surface-border flex items-center justify-center text-ink">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">Student Candidate Profile</h3>
                  <p className="text-xs text-ink-muted">Verified institutional identification</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <span className="text-xs text-ink-muted">Full Legal Name</span>
                <p className="text-sm font-semibold text-ink">{student.fullName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-muted">Register Number</span>
                <p className="text-sm font-mono font-semibold text-ink">
                  {student.registerNumber || 'Not specified'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-muted">Department & Year</span>
                <p className="text-sm font-semibold text-ink">
                  {student.department || 'N/A'}{' '}
                  {student.year ? `• Year ${student.year}` : ''}{' '}
                  {student.section ? `(${student.section})` : ''}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-muted">Email Address</span>
                <p className="text-xs font-mono text-ink flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
                  <span>{student.email}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-muted">Phone Number</span>
                <p className="text-xs font-mono text-ink flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-ink-muted" />
                  <span>{student.phone || 'N/A'}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-muted">External Portfolios</span>
                <div className="flex items-center gap-3 pt-0.5 text-xs">
                  {student.githubUrl && (
                    <a
                      href={student.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:underline flex items-center gap-1"
                    >
                      <span>GitHub</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {student.linkedinUrl && (
                    <a
                      href={student.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:underline flex items-center gap-1"
                    >
                      <span>LinkedIn</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {!student.githubUrl && !student.linkedinUrl && (
                    <span className="text-ink-muted italic">None provided</span>
                  )}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-3 pt-2">
                <span className="text-xs text-ink-muted">Technical Competencies</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {student.skills && student.skills.length > 0 ? (
                    student.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-0.5 rounded-pill bg-canvas-alt text-ink font-mono text-xs border border-surface-border"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink-muted italic">None declared</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Performance Card */}
          <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-canvas-alt border border-surface-border flex items-center justify-center text-ink">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    25-MCQ Technical Examination Result
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Server-authoritative evaluation metrics (Milestone 3)
                  </p>
                </div>
              </div>

              {assessment && (
                <div>
                  {assessment.passed ? (
                    <Badge variant="success" className="text-xs">
                      Passed (≥ 60%)
                    </Badge>
                  ) : (
                    <Badge variant="error" className="text-xs">
                      Below Threshold
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {assessment ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-card-sm bg-canvas-alt/70 border border-surface-border space-y-1">
                    <span className="text-xs text-ink-muted">Total Score</span>
                    <div className="text-2xl font-bold font-mono text-ink">
                      {assessment.score}{' '}
                      <span className="text-xs font-normal text-ink-muted">/ 25</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-card-sm bg-canvas-alt/70 border border-surface-border space-y-1">
                    <span className="text-xs text-ink-muted">Percentage</span>
                    <div className="text-2xl font-bold font-mono text-ink">
                      {assessment.percentage}%
                    </div>
                  </div>

                  <div className="p-4 rounded-card-sm bg-accent-green-subtle/50 border border-accent-green/20 space-y-1">
                    <span className="text-xs text-accent-green-dark">Correct</span>
                    <div className="text-2xl font-bold font-mono text-accent-green-dark">
                      {assessment.correctCount ?? '—'}
                    </div>
                  </div>

                  <div className="p-4 rounded-card-sm bg-canvas-alt/70 border border-surface-border space-y-1">
                    <span className="text-xs text-ink-muted">Wrong / Skipped</span>
                    <div className="text-2xl font-bold font-mono text-ink">
                      {(assessment.wrongCount ?? 0) + (assessment.unansweredCount ?? 0)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-ink-muted pt-2 border-t border-surface-border">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-ink-muted" />
                    <span>Duration: {Math.floor((assessment.durationSeconds || 1800) / 60)} minutes max</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-ink-muted" />
                    <span>
                      Submitted:{' '}
                      {assessment.submittedAt
                        ? new Date(assessment.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recorded'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-ink-muted">
                Candidate has not yet completed the 25-MCQ technical assessment.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Decision Controls & Audit Log */}
        <div className="lg:col-span-4 space-y-6">
          {/* Decision Control Card */}
          <div className="p-6 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-sm font-semibold text-ink">Admissions Determination</h3>
              {getStatusBadge(application.status)}
            </div>

            {isUnderReview ? (
              <div className="space-y-3">
                <p className="text-xs text-ink-muted leading-relaxed">
                  Candidate has satisfied all assessment requirements and is currently queued for administrative adjudication.
                </p>

                <div className="pt-2 space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setIsApproveOpen(true)}
                    disabled={isDecisionSubmitting}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    <span>Approve Application</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setIsWaitlistOpen(true)}
                    disabled={isDecisionSubmitting}
                  >
                    <Clock className="h-4 w-4 mr-1.5" />
                    <span>Waitlist Candidate</span>
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setIsRejectOpen(true)}
                    disabled={isDecisionSubmitting}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    <span>Reject Application</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-card-sm bg-canvas-alt border border-surface-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">Status</span>
                    {getStatusBadge(application.status)}
                  </div>
                  {application.reviewedAt && (
                    <p className="text-ink-muted">
                      Decided on:{' '}
                      {new Date(application.reviewedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  {application.reviewedBy && (
                    <p className="text-ink-muted font-mono text-[10px]">
                      Reviewer: {application.reviewedBy}
                    </p>
                  )}
                </div>

                {application.reviewerNotes && (
                  <div className="p-3.5 rounded-card-sm bg-canvas-alt border border-surface-border space-y-1">
                    <span className="font-semibold text-ink">Internal Notes:</span>
                    <p className="text-ink-secondary italic">{application.reviewerNotes}</p>
                  </div>
                )}

                {application.rejectionReason && (
                  <div className="p-3.5 rounded-card-sm bg-red-50 border border-red-200 space-y-1 text-red-800">
                    <span className="font-semibold">Rejection Reason:</span>
                    <p>{application.rejectionReason}</p>
                  </div>
                )}

                {application.status === 'approved' && (
                  <div className="pt-3 border-t border-surface-border">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full justify-center bg-accent-green text-ink hover:bg-accent-green/90 font-semibold"
                      onClick={() => setIsActivateModalOpen(true)}
                      disabled={isActivating || isDecisionSubmitting}
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      <span>{isActivating ? 'Activating...' : 'Activate Membership'}</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audit Trail Card */}
          <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
              <History className="h-4 w-4 text-ink-muted" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                Audit Trail (Immutable)
              </h3>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-ink-muted italic">No administrative events recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-card-sm bg-canvas-alt border border-surface-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-ink">{log.action}</span>
                      <span className="text-[10px] text-ink-muted">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-muted font-mono truncate">
                      Actor: {log.actorId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision Modals */}
      <ApproveConfirmModal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={approve}
        studentName={student.fullName}
        applicationNumber={application.applicationNumber}
        assessmentScore={assessment?.score}
        isSubmitting={isDecisionSubmitting}
      />

      <WaitlistConfirmModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        onConfirm={waitlist}
        studentName={student.fullName}
        applicationNumber={application.applicationNumber}
        isSubmitting={isDecisionSubmitting}
      />

      <RejectReasonModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={reject}
        studentName={student.fullName}
        applicationNumber={application.applicationNumber}
        isSubmitting={isDecisionSubmitting}
      />

      <ActivateMembershipModal
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
        onConfirm={handleActivateMembership}
        studentName={student.fullName}
        applicationNumber={application.applicationNumber}
        isSubmitting={isActivating}
      />
    </div>
  );
};
