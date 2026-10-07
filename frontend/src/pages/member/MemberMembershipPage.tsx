import React from 'react';
import { useMemberDashboard } from '@/features/membership';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Printer,
  ShieldCheck,
  Lock,
  AlertCircle,
} from 'lucide-react';

export const MemberMembershipPage: React.FC = () => {
  const { data, isLoading, error } = useMemberDashboard();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Retrieving membership credential..." />
        <p className="text-xs text-ink-muted">Loading your official AI CLUB membership card...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-ink">Membership Inaccessible</h2>
        <p className="text-xs text-ink-muted">{error || 'Membership record not found.'}</p>
      </div>
    );
  }

  const { profile, membership } = data;
  const joinedDate = new Date(membership.joinedAt);
  const joinedFormatted = joinedDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const memberSinceYear = joinedDate.getFullYear();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Official Membership
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Verified credentials and active induction status in the AI Innovation Collective.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="print:hidden flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save Card</span>
        </Button>
      </div>

      {/* Digital Membership Card Preview */}
      <div className="flex flex-col items-center justify-center py-6">
        <div
          id="digital-member-card"
          className="w-full max-w-md rounded-2xl bg-gradient-to-br from-ink via-[#1c1c1b] to-[#252524] text-canvas p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden space-y-6"
        >
          {/* Subtle Background Watermark Graphic */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-accent-green/10 blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-4 text-white/5 font-mono font-black text-6xl select-none pointer-events-none">
            AIC
          </div>

          {/* Top Brand Bar */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-canvas text-ink font-bold flex items-center justify-center text-sm">
                AI
              </div>
              <div>
                <span className="font-extrabold text-xs tracking-wider uppercase block text-canvas">
                  AI CLUB
                </span>
                <span className="text-[9px] tracking-widest uppercase text-accent-green font-mono">
                  Collective Member
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-green/20 border border-accent-green/40 text-[10px] text-accent-green font-mono font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
              <span>ACTIVE</span>
            </div>
          </div>

          {/* Center Member Identity */}
          <div className="space-y-1 relative z-10 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/60 block">
              Member Name
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {profile.fullName}
            </h2>
            <p className="text-xs text-white/70">
              {profile.department || 'Artificial Intelligence & Data Science'}
            </p>
          </div>

          {/* Bottom Attributes Bar */}
          <div className="pt-4 border-t border-white/10 flex items-end justify-between relative z-10">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-white/50 block">
                Official Identifier
              </span>
              <p className="font-mono font-bold text-sm tracking-wider text-accent-green">
                {membership.memberNumber}
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-white/50 block">
                Member Since
              </span>
              <p className="font-mono text-xs text-white/80">
                {memberSinceYear}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-ink-muted mt-3 font-mono print:hidden flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-green" />
          <span>Cryptographically validated via Supabase PostgreSQL engine</span>
        </p>
      </div>

      {/* Membership Attributes Detail Breakdown */}
      <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono pb-2 border-b border-surface-border">
          Credential Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <span className="text-ink-muted">Member Number</span>
            <p className="font-mono font-bold text-ink text-sm">{membership.memberNumber}</p>
          </div>

          <div className="p-3.5 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <span className="text-ink-muted">Membership Lifecycle State</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Badge variant="success">Active</Badge>
              <span className="text-ink-muted text-[11px]">(Full Platform Privileges)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <span className="text-ink-muted">Induction Date</span>
            <p className="font-medium text-ink">{joinedFormatted}</p>
          </div>

          <div className="p-3.5 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <span className="text-ink-muted">Academic Department</span>
            <p className="font-medium text-ink">{profile.department || 'Not Specified'}</p>
          </div>
        </div>

        {/* Security & Immutability Notice */}
        <div className="p-4 rounded-card-sm bg-canvas-alt border border-surface-border flex items-start gap-3 text-xs text-ink-secondary">
          <Lock className="h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-ink">Authoritative Membership Record</p>
            <p className="text-ink-muted leading-relaxed">
              Your member number is generated through a database sequence and protected by PostgreSQL triggers against unauthorized client mutations. Membership attributes remain immutable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
