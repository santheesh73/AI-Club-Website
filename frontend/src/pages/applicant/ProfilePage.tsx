import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ProfileView } from '@/features/profile/ProfileView';
import { ProfileEditForm } from '@/features/profile/ProfileEditForm';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { UserProfile } from '@/types/user';

export const ProfilePage: React.FC = () => {
  const { profile, isLoading, updateProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading student profile..." />
        <p className="text-xs text-ink-muted">Retrieving authenticated profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-12 max-w-2xl mx-auto px-4">
        <EmptyState
          title="Profile Not Found"
          description="Your authenticated profile record could not be loaded. Please sign in again or contact administrator."
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">User Profile & Identity</h1>
            <Badge variant="neutral">Verified Student Identity</Badge>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Authoritative student credentials and personal AI innovation portfolio.
          </p>
        </div>
      </div>

      {/* Prominent Next-Step Admissions Banner for Applicants */}
      {profile.role === 'applicant' && (
        <div className="p-5 sm:p-6 rounded-card-lg bg-surface border border-surface-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="orange">Next Step in Admissions</Badge>
              <h2 className="font-bold text-ink text-sm sm:text-base">
                Take 25-MCQ Technical Assessment
              </h2>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Your profile credentials are saved. Proceed to your official Applicant Dashboard to start your admission application and complete the 25-question timed assessment (30 mins, 60% pass threshold).
            </p>
          </div>
          <Link to="/applicant/dashboard" className="shrink-0">
            <Button size="md" className="shadow-subtle">
              Go to Assessment Dashboard &rarr;
            </Button>
          </Link>
        </div>
      )}

      {saveSuccess && (
        <div
          role="status"
          className="p-4 rounded-cardSm bg-accent-green-subtle border border-accent-green/30 text-xs text-accent-green-dark font-medium flex items-center justify-between"
        >
          <span>Profile changes updated successfully.</span>
          <button
            onClick={() => setSaveSuccess(false)}
            className="text-accent-green-dark hover:opacity-70 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {isEditing ? (
        <ProfileEditForm
          profile={profile}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <ProfileView
          profile={profile}
          onEdit={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};
