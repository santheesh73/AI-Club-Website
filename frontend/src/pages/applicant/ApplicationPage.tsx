import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useApplication, ApplicationCard, ApplicationTimeline } from '@/features/applications';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  FileText,
  User,
  GraduationCap,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const ApplicationPage: React.FC = () => {
  const { profile } = useAuth();
  const { application, statusData, isLoading, createApplication } = useApplication();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setCreateError(null);
    const res = await createApplication();
    setIsCreating(false);
    if (!res.success) {
      setCreateError(res.error || 'Failed to create application');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading application..." />
        <p className="text-xs text-ink-muted">Retrieving application details...</p>
      </div>
    );
  }

  const profileComplete = statusData?.profileComplete ?? false;
  const canStartAssessment = statusData?.canStartAssessment ?? false;
  const assessmentStatus = statusData?.assessmentStatus ?? 'not_started';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted uppercase">
            <Link to="/applicant" className="hover:text-ink transition-colors">
              Applicant Portal
            </Link>
            <span>/</span>
            <span className="text-ink">Application Record</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
            Club Application Dossier
          </h1>
        </div>

        <Link to="/applicant">
          <Button variant="ghost" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {createError && (
        <div className="p-4 rounded-card-sm bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{createError}</span>
        </div>
      )}

      {/* Main Application Card */}
      {application ? (
        <ApplicationCard
          application={application}
          canStartAssessment={canStartAssessment}
          assessmentStatus={assessmentStatus}
        />
      ) : (
        <div className="p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft text-center space-y-4">
          <FileText className="h-12 w-12 text-ink-muted mx-auto" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-semibold text-ink">No Active Application Found</h3>
            <p className="text-xs text-ink-muted">
              You haven't initiated an official club application yet. Once your academic profile is filled, you can start immediately.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={isCreating}
              disabled={!profileComplete || isCreating}
            >
              <span>Generate Application Dossier</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Applicant Student Profile Snapshot */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-ink-muted" />
            <h3 className="text-base font-semibold text-ink">Verified Student Profile</h3>
          </div>
          <Link to="/profile">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-ink-muted">Full Legal Name</span>
            <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <User className="h-4 w-4 text-ink-muted" />
              {profile?.fullName}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-ink-muted">Register Number</span>
            <p className="text-sm font-semibold font-mono text-ink">
              {profile?.registerNumber || 'Not provided'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-ink-muted">Department & Year</span>
            <p className="text-sm font-semibold text-ink">
              {profile?.department || 'N/A'}{' '}
              {profile?.year ? `• Year ${profile?.year}` : ''}{' '}
              {profile?.section ? `(${profile?.section})` : ''}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-ink-muted">Institutional Email</span>
            <p className="text-sm font-mono text-ink">{profile?.email}</p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <span className="text-xs text-ink-muted">Technical Skills</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-pill bg-canvas-alt text-ink text-xs font-mono border border-surface-border"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-ink-muted italic">None specified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admissions Pipeline Status */}
      <ApplicationTimeline
        profileComplete={profileComplete}
        hasApplication={!!application}
        applicationStatus={application?.status}
        assessmentStatus={assessmentStatus}
      />
    </div>
  );
};
