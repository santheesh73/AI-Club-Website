import React from 'react';
import { Link } from 'react-router-dom';
import { useMemberDashboard } from '@/features/membership';
import { useRegisteredEvents } from '@/features/events';
import { useMyCourses, ProgressBar } from '@/features/courses';
import { DashboardFlashcard } from '@/features/dashboard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowRight, Calendar, BookOpen } from 'lucide-react';

const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill bg-ink px-5 py-3 text-sm font-medium text-canvas hover:bg-ink-secondary';

export const MemberDashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useMemberDashboard();
  const events = useRegisteredEvents();
  const learning = useMyCourses();
  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner size="lg" label="Loading your workspace" /></div>;
  if (error || !data) return (
    <section className="max-w-xl space-y-4 py-8" role="alert">
      <h1 className="text-2xl font-semibold">We couldn't load your workspace</h1>
      <p className="text-ink-secondary">{error || 'Your membership information is unavailable. Try again.'}</p>
      <Button onClick={() => refetch()}>Try again</Button>
      <Link to="/applicant/dashboard" className="ml-4 underline underline-offset-4">View application status</Link>
    </section>
  );
  const { profile, membership, application, assessment } = data;
  const nextLesson = learning.stats?.continueLearning;
  const nextEvent = events.upcoming[0];
  const nextHref = nextLesson
    ? `/member/learn/${encodeURIComponent(nextLesson.courseSlug)}?lesson=${encodeURIComponent(nextLesson.lessonSlug)}`
    : nextEvent ? `/member/events/${encodeURIComponent(nextEvent.slug)}` : '/member/courses';
  const nextLabel = nextLesson ? 'Continue learning' : nextEvent ? 'View your next event' : 'Explore courses';
  const nextTitle = nextLesson?.lessonTitle || nextEvent?.title || 'Choose something to learn next';

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile.fullName}</h1>
          <p className="mt-2 text-ink-secondary">Pick up your learning, meet your team, or make progress on a project.</p></div>
        <div className="space-y-2"><Badge variant={membership.status === 'active' ? 'success' : 'neutral'}>{membership.status === 'active' ? 'Active Member' : membership.status}</Badge>
          <p className="font-mono text-xs text-ink-muted">{membership.memberNumber}</p></div>
      </header>
      <section aria-labelledby="next-action-heading" className="rounded-2xl bg-ink p-6 text-canvas sm:p-8">
        <h2 id="next-action-heading" className="text-2xl font-semibold">{nextTitle}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-canvas/90">{nextLesson ? nextLesson.courseTitle : nextEvent ? 'Your place is reserved. Check the event details before you attend.' : 'Browse the member catalogue and find a course that matches your interests.'}</p>
        <Link to={nextHref} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-pill bg-canvas px-5 py-3 text-sm font-semibold text-ink hover:bg-canvas-alt">{nextLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </section>
      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="learning-heading" className="space-y-4 border-t border-surface-border pt-6">
          <h2 id="learning-heading" className="flex items-center gap-2 text-xl font-semibold"><BookOpen className="h-5 w-5" aria-hidden="true" />Your learning</h2>
          {learning.isLoading ? <p role="status">Loading your courses…</p> : learning.error ? <div role="alert"><p className="text-ink-secondary">{learning.error}</p><Button variant="ghost" onClick={learning.refetch}>Retry courses</Button></div> : <>
            <p className="text-sm text-ink-secondary">{learning.stats ? `${learning.stats.enrolledCount} enrolled · ${learning.stats.completedCount} completed` : 'Find a course to start your learning journey.'}</p>
            {nextLesson && <ProgressBar percentage={nextLesson.progressPercentage} />}
          </>}
          <Link to="/member/my-courses" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">My courses</Link>
        </section>
        <section aria-labelledby="event-heading" className="space-y-4 border-t border-surface-border pt-6">
          <h2 id="event-heading" className="flex items-center gap-2 text-xl font-semibold"><Calendar className="h-5 w-5" aria-hidden="true" />Your next event</h2>
          {events.isLoading ? <p role="status">Loading your events…</p> : events.error ? <div role="alert"><p className="text-ink-secondary">{events.error}</p><Button variant="ghost" onClick={events.refetch}>Retry events</Button></div> : nextEvent ? <>
            <p className="font-semibold">{nextEvent.title}</p>
            <p className="text-sm text-ink-secondary">{Number.isNaN(Date.parse(nextEvent.startAt)) ? 'Date unavailable' : new Date(nextEvent.startAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
            <Link to={`/member/events/${encodeURIComponent(nextEvent.slug)}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">View event details</Link>
          </> : <p className="text-sm text-ink-secondary">You haven't registered for an upcoming event.</p>}
          <Link to="/member/events" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">Browse events</Link>
        </section>
      </div>
      <DashboardFlashcard flashcards={data.flashcards} />
      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-surface-border pt-6">
        <div><h2 className="text-xl font-semibold">Build with the club</h2><p className="mt-2 text-sm text-ink-secondary">Share your work and explore projects from other members.</p></div>
        <Link to="/member/projects" className={actionClass}>Open projects<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </section>
      <details className="border-t border-surface-border pt-5">
        <summary className="cursor-pointer py-3 text-sm font-semibold">Membership & admission history</summary>
        <dl className="grid gap-4 py-4 text-sm sm:grid-cols-3">
          <div><dt className="text-ink-secondary">Member number</dt><dd className="mt-1 font-mono">{membership.memberNumber}</dd></div>
          <div><dt className="text-ink-secondary">Application</dt><dd className="mt-1 font-mono">{application.applicationNumber}</dd></div>
          <div><dt className="text-ink-secondary">Assessment result</dt><dd className="mt-1">{assessment?.percentage != null ? `${assessment.percentage}%` : 'No result available'}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-5 pb-4"><Link to="/member/membership" className="underline underline-offset-4">Membership card</Link><Link to="/member/application" className="underline underline-offset-4">Application history</Link><Link to="/member/assessment" className="underline underline-offset-4">Assessment results</Link></div>
      </details>
    </div>
  );
};
