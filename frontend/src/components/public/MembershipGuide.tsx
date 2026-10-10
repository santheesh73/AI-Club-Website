import { useId } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useMembership } from '@/features/membership';

interface MembershipGuideProps {
  compact?: boolean;
}

/** Admissions facts verified against backend/src/config/assessment.config.ts. */
export function MembershipGuide({ compact = false }: MembershipGuideProps) {
  const headingId = useId();
  const { isAuthenticated, isAdmin } = useAuth();
  const { isActiveMember, isLoading, error, refetch } = useMembership();
  const checkingMembership = isAuthenticated && !isAdmin && isLoading;
  const destination = isAdmin ? '/admin' : isActiveMember ? '/member/dashboard' : isAuthenticated ? '/applicant/dashboard' : '/register';
  const action = isAdmin ? 'Open admin workspace' : isActiveMember ? 'Open member workspace' : isAuthenticated ? 'View your application' : 'Create an account to apply';

  return (
    <section aria-labelledby={headingId} className="space-y-6">
      <div className="max-w-3xl space-y-3">
        <h2 id={headingId} className="text-2xl sm:text-3xl font-bold tracking-tight">Before you apply</h2>
        <p className="text-ink-secondary leading-relaxed">Club membership starts with an account and a timed entrance assessment. Passing moves your application to administrative review; membership requires approval and activation.</p>
      </div>
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-sm text-ink-secondary">Assessment format</dt><dd className="mt-1 font-semibold">25 multiple-choice questions</dd></div>
        <div><dt className="text-sm text-ink-secondary">Time available</dt><dd className="mt-1 font-semibold">30 minutes</dd></div>
        <div><dt className="text-sm text-ink-secondary">Passing score</dt><dd className="mt-1 font-semibold">60% — 15 out of 25</dd></div>
        <div><dt className="text-sm text-ink-secondary">Attempts</dt><dd className="mt-1 font-semibold">One per application</dd></div>
      </dl>
      <p className="max-w-3xl text-ink-secondary leading-relaxed">Set aside uninterrupted time and a reliable connection. Creating an account does not start the timer. Read the instructions in your application dashboard before choosing to begin.</p>
      {!compact && (
        <div className="max-w-3xl divide-y divide-surface-border border-y border-surface-border">
          <details className="py-4">
            <summary className="min-h-11 cursor-pointer py-2 leading-7 font-semibold">How can I prepare?</summary>
            <p className="mt-2 text-ink-secondary leading-relaxed">Try the public starter lesson to practise reading model results, then explore the learning tracks for topics you want to understand. The starter lesson is a learning exercise, not an assessment question bank or a guarantee of passing.</p>
            <Link to="/learn/first-model" className="public-text-link mt-2">Try the starter lesson</Link>
          </details>
          <details className="py-4">
            <summary className="min-h-11 cursor-pointer py-2 leading-7 font-semibold">When does the timer start?</summary>
            <p className="mt-2 text-ink-secondary leading-relaxed">The timer starts when you open the assessment after choosing to begin in your application dashboard. Refreshing the page does not restart the timer. You have one attempt per application.</p>
          </details>
          <details className="py-4">
            <summary className="min-h-11 cursor-pointer py-2 leading-7 font-semibold">Do I need membership to attend a public event?</summary>
            <p className="mt-2 text-ink-secondary leading-relaxed">No. An account lets you RSVP to events marked public, subject to the event's registration window and available seats. The membership assessment is separate. Members-only events require active membership.</p>
            <Link to="/events" className="public-text-link mt-2">Explore public events</Link>
          </details>
          <details className="py-4">
            <summary className="min-h-11 cursor-pointer py-2 leading-7 font-semibold">What happens after I submit?</summary>
            <p className="mt-2 text-ink-secondary leading-relaxed">Follow your result and application status in your account. Passing the assessment sends the application for administrative review. An approved application still needs membership activation before the member workspace becomes available.</p>
          </details>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {checkingMembership ? <p role="status" className="text-sm text-ink-secondary">Checking your membership…</p> : <Link to={destination} className="public-action">{action}</Link>}
        <Link to={compact ? '/join' : '/learn/first-model'} className="public-action-secondary">{compact ? 'Read the joining guide' : 'Try a lesson first'}</Link>
      </div>
      {error && isAuthenticated && !isAdmin && <p className="text-sm text-ink-secondary">We could not check your membership. <button type="button" onClick={refetch} className="min-h-11 underline underline-offset-4 font-medium">Retry membership check</button></p>}
      {compact && <p className="max-w-3xl text-sm text-ink-secondary leading-relaxed">You can also RSVP to public events with an account, without taking the membership assessment.</p>}
    </section>
  );
}
