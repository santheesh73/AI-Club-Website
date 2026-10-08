import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { communityApi } from '@/services/communityApi';
import { eventsApi } from '@/services/eventsApi';
import type { ProjectCardDto } from '@/types/community';
import { isPublicEventDto, type PublicEventDto } from '@/types/events';

export const LandingPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectCardDto[]>([]);
  const [event, setEvent] = useState<PublicEventDto | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(false);
  const [eventsError, setEventsError] = useState(false);
  const [projectsAttempt, setProjectsAttempt] = useState(0);
  const [eventsAttempt, setEventsAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setProjectsLoading(true);
    setProjectsError(false);
    const load = async () => {
      try {
        const response = await communityApi.getProjects({ visibility: 'public', status: 'published', pageSize: 3 });
        if (!response.success || !response.data || !Array.isArray(response.data.items)) throw new Error('Projects unavailable');
        if (active) setProjects(response.data.items.filter((project) => project.visibility === 'public' && project.status === 'published').slice(0, 3));
      } catch { if (active) setProjectsError(true); }
      finally { if (active) setProjectsLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [projectsAttempt]);

  useEffect(() => {
    let active = true;
    setEventsLoading(true);
    setEventsError(false);
    const load = async () => {
      try {
        const response = await eventsApi.getPublicEvents({ timeline: 'upcoming' });
        if (!response.success || !Array.isArray(response.data) || !response.data.every(isPublicEventDto)) throw new Error('Events unavailable');
        const next = response.data.filter((item) => item.eligibility === 'public' && item.status === 'published' && new Date(item.startAt).getTime() > Date.now()).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
        if (active) setEvent(next || null);
      } catch { if (active) setEventsError(true); }
      finally { if (active) setEventsLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [eventsAttempt]);

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8">
      <section className="py-16 sm:py-24 lg:py-28 max-w-4xl">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-balance">Learn AI.<br />Build it together.</h1>
        <p className="mt-6 max-w-2xl text-lg sm:text-xl text-ink-secondary leading-relaxed">AI CLUB brings students together to explore artificial intelligence, work on projects, and share what they learn.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link to="/register" className="public-action">Join Club <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
          <Link to="/learn" className="public-action-secondary">Explore</Link>
        </div>
        <p className="mt-6 text-sm text-ink-secondary">AI CLUB · SIET</p>
      </section>

      <section aria-labelledby="projects-heading" className="border-t border-surface-border py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div><h2 id="projects-heading" className="text-3xl font-bold tracking-tight">See what members are building</h2><p className="mt-3 text-ink-secondary max-w-2xl">Explore published projects from the club’s public catalogue.</p></div>
          <Link to="/community/projects" className="public-text-link">Browse projects <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <div aria-live="polite" aria-busy={projectsLoading}>
          {projectsLoading ? <p className="py-6 text-ink-secondary" role="status">Loading member projects…</p> : projectsError ? <div className="py-6"><p role="alert">We couldn’t load the projects. Please try again.</p><button type="button" className="public-text-link underline mt-2" onClick={() => setProjectsAttempt((value) => value + 1)}>Retry projects</button></div> : projects.length === 0 ? <p className="py-6 text-ink-secondary">No public projects have been published yet. Explore the learning tracks to find a place to start.</p> : <div className="grid md:grid-cols-3 gap-8">
            {projects.map((project) => <article key={project.id} className="min-w-0">
              {project.coverImageUrl && <img src={project.coverImageUrl} alt="" loading="lazy" className="w-full aspect-[16/10] object-cover rounded-xl mb-4" />}
              <h3 className="text-xl font-semibold"><Link to={`/community/projects/${encodeURIComponent(project.slug)}`} className="hover:underline underline-offset-4">{project.title}</Link></h3>
              <p className="mt-3 text-ink-secondary leading-relaxed">{project.shortDescription}</p>
              <p className="mt-4 text-sm text-ink-secondary">By {project.owner.fullName}</p>
              <Link to={`/community/projects/${encodeURIComponent(project.slug)}`} className="public-text-link mt-2">View project <span className="sr-only">{project.title}</span><ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
            </article>)}
          </div>}
        </div>
      </section>

      <section aria-labelledby="activities-heading" className="border-t border-surface-border py-12 sm:py-16">
        <h2 id="activities-heading" className="text-3xl font-bold tracking-tight">A place to learn, build, and ask questions</h2>
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          <div><h3 className="text-xl font-semibold">Learn</h3><p className="mt-3 text-ink-secondary leading-relaxed">Find your starting point in the curriculum, from mathematical foundations to language models.</p><Link to="/learn" className="public-text-link mt-3">Explore learning tracks</Link></div>
          <div><h3 className="text-xl font-semibold">Build</h3><p className="mt-3 text-ink-secondary leading-relaxed">Turn an idea into a project. Explore published work and the approaches members used.</p><Link to="/community/projects" className="public-text-link mt-3">See member projects</Link></div>
          <div><h3 className="text-xl font-semibold">Research</h3><p className="mt-3 text-ink-secondary leading-relaxed">Look beyond a model’s output: ask how it works, what the evidence shows, and where it falls short.</p><Link to="/about" className="public-text-link mt-3">Get to know the club</Link></div>
        </div>
      </section>

      <section aria-labelledby="event-heading" className="border-t border-surface-border py-12 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6"><h2 id="event-heading" className="text-3xl font-bold tracking-tight">Next public event</h2><Link to="/events" className="public-text-link">All events <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></div>
        <div aria-live="polite" aria-busy={eventsLoading}>
          {eventsLoading ? <p role="status" className="text-ink-secondary">Loading the next event…</p> : eventsError ? <div><p role="alert">We couldn’t load upcoming events. Please try again.</p><button type="button" className="public-text-link underline mt-2" onClick={() => setEventsAttempt((value) => value + 1)}>Retry events</button></div> : !event ? <p className="text-ink-secondary">No upcoming public events are listed right now. Check the events page for future announcements.</p> : <article className="rounded-xl bg-canvas-alt p-6 sm:p-8 flex flex-col md:flex-row justify-between gap-6">
            <div className="max-w-2xl"><p className="flex items-center gap-2 text-sm text-ink-secondary"><CalendarDays className="h-4 w-4" aria-hidden="true" /><time dateTime={event.startAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZoneName: undefined }).format(new Date(event.startAt))}</time></p><h3 className="mt-3 text-2xl font-semibold">{event.title}</h3><p className="mt-3 text-ink-secondary leading-relaxed">{event.shortDescription}</p><p className="mt-3 text-sm text-ink-secondary">Public event · An account is needed to RSVP</p></div>
            <Link to={`/events/${encodeURIComponent(event.slug)}`} className="public-action self-start">View event</Link>
          </article>}
        </div>
      </section>

      <section aria-labelledby="joining-heading" className="border-t border-surface-border py-12 sm:py-16">
        <h2 id="joining-heading" className="text-3xl font-bold tracking-tight">How joining works</h2>
        <p className="mt-3 max-w-2xl text-ink-secondary leading-relaxed">Club membership and public event attendance are separate. You can RSVP to a public event with an account; membership includes an assessment and review.</p>
        <ol className="mt-8 grid md:grid-cols-3 gap-8 list-decimal list-inside">
          <li className="font-semibold">Create your account<p className="font-normal text-ink-secondary leading-relaxed mt-3">Register with your name, email, and a password.</p></li>
          <li className="font-semibold">Take the assessment<p className="font-normal text-ink-secondary leading-relaxed mt-3">Read the assessment instructions before starting. Your application follows the club’s assessment process.</p></li>
          <li className="font-semibold">Follow your application<p className="font-normal text-ink-secondary leading-relaxed mt-3">View your result and application status while the administration reviews membership.</p></li>
        </ol>
        <Link to="/register" className="public-action mt-8">Apply to join</Link>
      </section>
    </div>
  );
};
