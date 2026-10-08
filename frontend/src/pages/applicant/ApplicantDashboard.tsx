import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useApplication, ApplicationTimeline, ApplicationCard } from '@/features/applications';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export const ApplicantDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { application, statusData, isLoading, error, createApplication, refreshStatus } = useApplication();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const handleStart = async () => {
    if (!isReady || isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    const result = await createApplication();
    setIsCreating(false);
    if (result.success && result.data) navigate('/applicant/assessment');
    else setCreateError(result.error || 'We could not create your application. Please try again.');
  };
  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner size="lg" label="Loading your application" /></div>;
  const hasApp = statusData?.hasApplication ?? Boolean(application);
  const assessmentStatus = statusData?.assessmentStatus ?? 'not_started';
  const canStart = statusData?.canStartAssessment ?? false;

  return (
    <div className="max-w-4xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile?.fullName || 'Applicant'}</h1>
        <p className="max-w-2xl text-ink-secondary">Apply for club membership when you're ready. Your account also lets you RSVP to public events without taking this assessment.</p>
        <Link to="/events" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">Explore public events</Link>
      </header>
      {(error || createError) && <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-4 text-red-800">
        <p>{error || createError}</p><Button variant="outline" onClick={refreshStatus}>Retry application status</Button>
      </div>}
      <section aria-labelledby="assessment-preparation" className="space-y-5 border-t border-surface-border pt-6">
        <h2 id="assessment-preparation" className="text-2xl font-semibold">Before you start the membership assessment</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-secondary">Set aside uninterrupted time and use a reliable connection. The timer starts when you open the assessment after choosing to begin.</p>
        <dl className="grid gap-5 sm:grid-cols-3">
          <div><dt className="text-sm text-ink-secondary">Format</dt><dd className="mt-1 font-semibold">25 multiple-choice questions</dd></div>
          <div><dt className="text-sm text-ink-secondary">Time limit</dt><dd className="mt-1 font-semibold">30 minutes</dd></div>
          <div><dt className="text-sm text-ink-secondary">Passing threshold</dt><dd className="mt-1 font-semibold">60% (15 out of 25)</dd></div>
        </dl>
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-secondary">
          <li>There is one attempt per application. Review the learning tracks before you begin.</li>
          <li>Answers are saved as you work. Refreshing the page does not restart the timer.</li>
          <li>Passing sends your application for administrative review; membership requires approval and activation.</li>
        </ul>
        <Link to="/learn" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">Review learning tracks</Link>
      </section>
      {hasApp && application ? <ApplicationCard application={application} canStartAssessment={canStart} assessmentStatus={assessmentStatus} /> : (
        <section className="space-y-5 border-t border-surface-border pt-6">
          <h2 className="text-xl font-semibold">Ready to apply?</h2>
          <label className="flex min-h-11 max-w-2xl cursor-pointer items-start gap-3 text-sm leading-relaxed">
            <input type="checkbox" checked={isReady} onChange={event => setIsReady(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
            <span>I have read the assessment rules and have 30 minutes available.</span>
          </label>
          <Button onClick={handleStart} disabled={!isReady || Boolean(error) || isCreating} isLoading={isCreating} className="min-h-11">Start membership assessment</Button>
          <p className="text-sm text-ink-secondary">This creates your application and opens the timed assessment.</p>
        </section>
      )}
      {hasApp && <ApplicationTimeline hasApplication={hasApp} applicationStatus={application?.status} assessmentStatus={assessmentStatus} />}
    </div>
  );
};
