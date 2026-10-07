import React from 'react';
import { Link } from 'react-router-dom';
import { useMemberDashboard } from '@/features/membership';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  CreditCard,
  User,
  FileText,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const MemberDashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useMemberDashboard();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading member workspace..." />
        <p className="text-xs text-ink-muted">Retrieving your membership and academic records...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-ink">Member Dashboard Unavailable</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {error || 'Unable to retrieve member telemetry. Your membership may still be pending activation.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
          <Link to="/applicant">
            <Button variant="primary" size="sm">
              <span>View Application Status</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { profile, membership, application, assessment } = data;

  const joinedFormatted = new Date(membership.joinedAt).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Editorial Welcome Header */}
      <div className="p-6 sm:p-10 rounded-card-lg bg-surface border border-surface-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="success">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Active Member
            </Badge>
            <span className="text-xs font-mono text-ink-muted">
              Joined {joinedFormatted}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Welcome back, {profile.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-xl leading-relaxed">
              You are an authenticated active member of the AI Innovation Collective. Your member credentials and academic records are securely established.
            </p>
          </div>
        </div>

        {/* Member Number Identity Cardlet */}
        <div className="p-4 rounded-card-sm bg-canvas border border-surface-border flex-shrink-0 space-y-1 sm:min-w-[200px]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
            Official Member #
          </span>
          <p className="text-base sm:text-lg font-mono font-bold text-ink">
            {membership.memberNumber}
          </p>
          <p className="text-[10px] text-ink-muted">
            {profile.department || 'AI Club Member'}
          </p>
        </div>
      </div>

      {/* Your Journey Timeline */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink font-mono">
            Your Admissions Journey
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Full progression from student profile registration to active membership induction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-card-sm bg-accent-green-subtle/40 border border-accent-green/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">1. Profile</span>
            </div>
            <p className="text-[11px] text-ink-muted">Verified & Cataloged</p>
          </div>

          <div className="p-4 rounded-card-sm bg-accent-green-subtle/40 border border-accent-green/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">2. Application</span>
            </div>
            <p className="text-[11px] font-mono text-ink-muted">{application.applicationNumber}</p>
          </div>

          <div className="p-4 rounded-card-sm bg-accent-green-subtle/40 border border-accent-green/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">3. Assessment</span>
            </div>
            <p className="text-[11px] font-mono text-ink-muted">
              {assessment?.score !== null ? `${assessment?.score} / 25 (${assessment?.percentage}%)` : 'Completed'}
            </p>
          </div>

          <div className="p-4 rounded-card-sm bg-accent-green-subtle/40 border border-accent-green/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">4. Committee Review</span>
            </div>
            <p className="text-[11px] text-ink-muted">Formally Approved</p>
          </div>

          <div className="p-4 rounded-card-sm bg-accent-green-subtle/60 border border-accent-green/40 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">5. Membership</span>
            </div>
            <p className="text-[11px] font-mono text-ink-muted">{membership.memberNumber}</p>
          </div>
        </div>
      </div>

      {/* Grid: Assessment Summary & Academic Record */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assessment Card */}
        <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-ink-muted" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                Entrance Evaluation
              </h3>
            </div>
            <Link to="/member/assessment" className="text-xs text-ink font-semibold hover:underline flex items-center gap-1">
              <span>View Scorecard</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
              <span className="text-[10px] text-ink-muted uppercase font-mono">Final Score</span>
              <p className="text-2xl font-extrabold text-ink font-mono">
                {assessment?.score ?? '—'}<span className="text-xs font-normal text-ink-muted"> / 25</span>
              </p>
            </div>

            <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
              <span className="text-[10px] text-ink-muted uppercase font-mono">Percentage</span>
              <p className="text-2xl font-extrabold text-accent-green font-mono">
                {assessment?.percentage ?? '—'}%
              </p>
            </div>
          </div>

          <div className="p-3 rounded-card-sm bg-canvas text-xs text-ink-secondary flex items-center justify-between">
            <span>Result Status:</span>
            <Badge variant="success">Passed Threshold (≥60%)</Badge>
          </div>
        </div>

        {/* Membership Details Card */}
        <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-ink-muted" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                Membership Identity
              </h3>
            </div>
            <Link to="/member/membership" className="text-xs text-ink font-semibold hover:underline flex items-center gap-1">
              <span>Digital Card</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-card-sm bg-canvas">
              <span className="text-ink-muted">Member Number:</span>
              <span className="font-mono font-bold text-ink">{membership.memberNumber}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-card-sm bg-canvas">
              <span className="text-ink-muted">Status:</span>
              <span className="font-semibold text-accent-green uppercase">{membership.status}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-card-sm bg-canvas">
              <span className="text-ink-muted">Induction Date:</span>
              <span className="font-semibold text-ink">{joinedFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Link
          to="/member/membership"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <CreditCard className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Membership Card</h4>
            <p className="text-xs text-ink-muted">Inspect and display your official AI CLUB credential.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>Open Card</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/profile"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <User className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Member Profile</h4>
            <p className="text-xs text-ink-muted">View academic credentials, skills, and portfolio links.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>View Profile</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/application"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <FileText className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">My Application</h4>
            <p className="text-xs text-ink-muted">Review your submitted application and committee approval.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>View Application</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/assessment"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <Award className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Evaluation Results</h4>
            <p className="text-xs text-ink-muted">Inspect completed 25-MCQ exam metrics and answers.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>View Results</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </div>
    </div>
  );
};
