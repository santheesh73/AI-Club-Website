import React, { useState } from 'react';
import { useAuth } from '@/features/auth';
import { useMembership } from '@/features/membership';
import { ProfileView } from '@/features/profile/ProfileView';
import { ProfileEditForm } from '@/features/profile/ProfileEditForm';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ShieldCheck,
  Lock,
  Edit3,
  CheckCircle2,
} from 'lucide-react';
import type { UserProfile } from '@/types/user';

export const MemberProfilePage: React.FC = () => {
  const { profile, isLoading: isAuthLoading, updateProfile, refreshProfile } = useAuth();
  const { membership, isLoading: isMemberLoading } = useMembership();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isLoading = isAuthLoading || isMemberLoading;

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading member profile..." />
        <p className="text-xs text-ink-muted">Retrieving member credentials and portfolio...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-12 max-w-2xl mx-auto px-4">
        <EmptyState
          title="Member Profile Unavailable"
          description="Your authenticated member record could not be loaded. Please refresh the page or sign in again."
          actionLabel="Refresh Profile"
          onAction={refreshProfile}
        />
      </div>
    );
  }

  const handleSave = async (updates: Partial<UserProfile>) => {
    const result = await updateProfile(updates);
    if (result.success) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
    return result;
  };

  const joinedFormatted = membership?.joinedAt
    ? new Date(membership.joinedAt).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : '2026';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              Member Profile
            </h1>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage your personal profile, skills, and portfolio while retaining verified member credentials.
          </p>
        </div>

        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(false)}
            className="self-start sm:self-auto"
          >
            Cancel Editing
          </Button>
        )}
      </div>

      {/* Success alert banner */}
      {saveSuccess && (
        <div className="p-4 rounded-card-sm bg-accent-green-subtle border border-accent-green/30 text-xs text-accent-green-dark flex items-center gap-2 shadow-subtle animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <p className="font-semibold">Your member profile updates have been safely saved.</p>
        </div>
      )}

      {/* Immutable Member Identity Banner */}
      <div className="p-5 rounded-card bg-surface border border-surface-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-ink text-canvas font-bold flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-6 w-6 text-accent-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-ink">
                {membership?.memberNumber || 'AIC-MEMBER'}
              </span>
              <span className="text-ink-muted text-xs">•</span>
              <span className="text-xs text-ink-muted">Inducted {joinedFormatted}</span>
            </div>
            <p className="text-[11px] text-ink-secondary mt-0.5">
              Verified membership identity is permanently linked to your student credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-muted bg-canvas-alt px-3 py-1.5 rounded-card-sm border border-surface-border self-start sm:self-auto">
          <Lock className="h-3.5 w-3.5" />
          <span>Member ID Immutable</span>
        </div>
      </div>

      {/* Profile Content View / Edit Form */}
      {isEditing ? (
        <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft">
          <ProfileEditForm
            profile={profile}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <ProfileView profile={profile} onEdit={() => setIsEditing(true)} />
      )}
    </div>
  );
};
