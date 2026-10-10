import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { TinyClassifier } from '@/features/publicLearning/TinyClassifier';
import { MembershipGuide } from '@/components/public/MembershipGuide';
import { communityApi } from '@/services/communityApi';
import { eventsApi } from '@/services/eventsApi';
import { getContextualHomePath } from '@/utils/navigation';
import type { ProjectCardDto } from '@/types/community';
import { isPublicEventDto, type PublicEventDto } from '@/types/events';

function displayableProject(project: ProjectCardDto): boolean {
  return Boolean(project && typeof project.id === 'string' && typeof project.slug === 'string'
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(project.slug) && typeof project.title === 'string'
    && project.title.trim() && typeof project.shortDescription === 'string'
    && project.owner && typeof project.owner.fullName === 'string');
}

export const LandingPage = () => {
  const { isAuthenticated, profile, isAdmin } = useAuth();
  const workspace = getContextualHomePath(isAuthenticated, profile, isAdmin);
  const [projects, setProjects] = useState<ProjectCardDto[]>([]);
  const [event, setEvent] = useState<PublicEventDto | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(false);
  const [eventsError, setEventsError] = useState(false);
  const [projectsAttempt, setProjectsAttempt] = useState(0);
  const [eventsAttempt, setEventsAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setProjectsLoading(true);
    setProjectsError(false);
    void (async () => {
      try {
        const response = await communityApi.getProjects({ visibility: 'public', status: 'published', pageSize: 3 });
        if (!response.success || !response.data || !Array.isArray(response.data.items) || !response.data.items.every(displayableProject)) throw new Error('Projects unavailable');
        if (current) setProjects(response.data.items.filter(project => project.visibility === 'public' && project.status === 'published').slice(0, 3));
      } catch { if (current) setProjectsError(true); }
      finally { if (current) setProjectsLoading(false); }
    })();
    return () => { current = false; };
  }, [projectsAttempt]);

  useEffect(() => {
    let current = true;
    setEventsLoading(true);
    setEventsError(false);
    void (async () => {
      try {
        const response = await eventsApi.getPublicEvents({ timeline: 'upcoming' });
        if (!response.success || !Array.isArray(response.data) || !response.data.every(isPublicEventDto)) throw new Error('Events unavailable');
        const upcoming = response.data.filter(item => item.status === 'published' && Date.parse(item.startAt) > Date.now()).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
        if (current) setEvent(upcoming.find(item => item.eligibility === 'public') || upcoming[0] || null);
      } catch { if (current) setEventsError(true); }
      finally { if (current) setEventsLoading(false); }
    })();
    return () => { current = false; };
  }, [eventsAttempt]);

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8">
      <section className="grid items-start gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
        <div>
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-6xl">Learn AI by<br />trying an idea.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-secondary">AI CLUB at SIET brings students together to understand models, test ideas, and build projects. Start with a small experiment you can change yourself.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={isAuthenticated ? workspace : '/learn/first-model'} className="public-action">{isAuthenticated ? 'Open my workspace' : 'Try the first lesson'}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
            <Link to={isAuthenticated ? '/learn/first-model' : '/join'} className="public-action-secondary">{isAuthenticated ? 'Try the starter lesson' : 'How to join'}</Link>
          </div>
          <p className="mt-4 text-sm text-ink-secondary">The starter lesson is public. No account or assessment required.</p>
        </div>
        <div className="min-w-0 border-t border-surface-border pt-6 lg:border-t-0 lg:pt-0">
          <h2 className="text-xl font-semibold tracking-tight">Can one measurement predict a flower?</h2>
          <p className="mt-2 mb-5 text-sm leading-relaxed text-ink-secondary">Move the boundary. Watch a simple model change its predictions.</p>
          <TinyClassifier compact />
          <Link to="/learn/first-model" className="public-text-link mt-3 underline">See how this model works<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <section aria-labelledby="practice-heading" className="grid gap-6 border-t border-surface-border py-10 sm:grid-cols-[1fr_1.1fr] sm:gap-12 sm:py-14">
        <h2 id="practice-heading" className="max-w-lg text-3xl font-bold tracking-tight">A prediction is the beginning.<br />Ask what it missed.</h2>
        <div className="max-w-2xl space-y-4 text-ink-secondary leading-relaxed">
          <p>Start with an example, choose a rule, and check it against new data. A model's mistakes can tell you more than a perfect score on familiar examples.</p>
          <p>The public lesson puts that idea into practice. The learning tracks then connect it to mathematical foundations, neural networks, language models, and deployment.</p>
          <Link to="/learn" className="public-text-link underline">Find your next learning direction</Link>
        </div>
      </section>

      <section aria-labelledby="projects-heading" className="border-t border-surface-border py-10 sm:py-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 id="projects-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">{projects.length ? 'Work from club members' : 'The public project notebook'}</h2>
          {projects.length > 0 && <Link to="/community/projects" className="public-text-link underline">Browse all projects</Link>}
        </div>
        <div aria-live="polite" aria-busy={projectsLoading}>
          {projectsLoading ? <p role="status" className="text-ink-secondary">Loading published projects…</p>
            : projectsError ? <div><p role="alert" className="text-ink-secondary">We couldn't load the projects. Please try again.</p><button type="button" className="public-text-link mt-2 underline" onClick={() => setProjectsAttempt(value => value + 1)}>Retry projects</button></div>
            : projects.length === 0 ? <p className="max-w-3xl leading-relaxed text-ink-secondary">No public projects have been published yet. You can still build your first experiment in the <Link to="/learn/first-model" className="font-medium text-ink underline underline-offset-4">starter lesson</Link>. Published member work will appear here as it becomes available.</p>
            : <div className="grid gap-8 md:grid-cols-3">{projects.map(project => <article key={project.id} className="min-w-0">
              {project.coverImageUrl && <img src={project.coverImageUrl} alt="" loading="lazy" className="mb-4 aspect-[16/10] w-full rounded-xl object-cover" />}
              <h3 className="text-xl font-semibold"><Link to={`/community/projects/${encodeURIComponent(project.slug)}`} className="hover:underline underline-offset-4">{project.title}</Link></h3>
              <p className="mt-3 leading-relaxed text-ink-secondary">{project.shortDescription}</p>
              <p className="mt-4 text-sm text-ink-secondary">By {project.owner.fullName}</p>
              <Link to={`/community/projects/${encodeURIComponent(project.slug)}`} className="public-text-link mt-2 underline">View project<span className="sr-only">: {project.title}</span><ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
            </article>)}</div>}
        </div>
      </section>

      <section aria-labelledby="event-heading" className="border-t border-surface-border py-10 sm:py-14">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 id="event-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">On the club calendar</h2><Link to="/events" className="public-text-link underline">See the calendar</Link></div>
        <div aria-live="polite" aria-busy={eventsLoading}>
          {eventsLoading ? <p role="status" className="text-ink-secondary">Loading the next event…</p>
            : eventsError ? <div><p role="alert" className="text-ink-secondary">We couldn't load upcoming events. Please try again.</p><button type="button" className="public-text-link mt-2 underline" onClick={() => setEventsAttempt(value => value + 1)}>Retry events</button></div>
            : !event ? <p className="max-w-3xl leading-relaxed text-ink-secondary">No upcoming events are listed right now. Public events will be marked clearly when announced; an account is enough to RSVP, without the membership assessment.</p>
            : <article className="grid gap-5 rounded-xl bg-canvas-alt p-6 sm:grid-cols-[1fr_auto] sm:p-8">
              <div className="max-w-2xl"><p className="flex items-center gap-2 text-sm text-ink-secondary"><CalendarDays className="h-4 w-4" aria-hidden="true" /><time dateTime={event.startAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.startAt))}</time></p><h3 className="mt-3 text-2xl font-semibold">{event.title}</h3><p className="mt-3 leading-relaxed text-ink-secondary">{event.shortDescription}</p><p className="mt-3 text-sm font-medium text-ink">{event.eligibility === 'public' ? 'Public event · An account is enough to RSVP' : 'Members-only event · Active membership required'}</p></div>
              <Link to={`/events/${encodeURIComponent(event.slug)}`} className="public-action self-start">View event details</Link>
            </article>}
        </div>
      </section>
      <div className="border-t border-surface-border py-10 sm:py-14"><MembershipGuide compact /></div>
    </div>
  );
};
