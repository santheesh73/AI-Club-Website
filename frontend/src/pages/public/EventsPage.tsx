import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { eventsApi } from '@/services/eventsApi';
import { isPublicEventDto, type PublicEventDto } from '@/types/events';

export const formatEventDate = (value: string): string => new Date(value).toLocaleString(undefined, {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
});

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<PublicEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    async function load() {
      try {
        const response = await eventsApi.getPublicEvents({ timeline: 'upcoming', pageSize: 100 });
        if (!current) return;
        if (!response || !response.success) setError('We could not load the event calendar. Please try again.');
        else if (!Array.isArray(response.data) || !response.data.every(isPublicEventDto)) setError('The event calendar returned incomplete information. Please try again.');
        else setEvents(response.data);
      } catch {
        if (current) setError('We could not reach the event calendar. Please try again.');
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => { current = false; };
  }, [attempt]);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-20">
      <header className="max-w-3xl mb-12 sm:mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink">Events at AI Club</h1>
        <p className="mt-5 text-lg text-ink-secondary leading-relaxed">Find an upcoming session and see what you need to attend. Public events accept RSVPs from any signed-in account; members-only events require club membership.</p>
      </header>
      {loading ? <p role="status" className="py-12 text-ink-secondary">Loading events…</p>
        : error ? <div className="py-10 space-y-5"><p role="alert" className="text-ink-secondary">{error}</p><Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry loading events</Button></div>
        : events.length === 0 ? <div className="py-12 border-y border-surface-border"><h2 className="text-2xl font-semibold text-ink">No upcoming events yet</h2><p className="mt-3 text-ink-secondary">Published events will appear here when they are scheduled.</p><Link to="/learn" className="inline-flex min-h-11 items-center gap-2 mt-5 font-medium text-ink underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded">Explore learning <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
        : <ul className="divide-y divide-surface-border border-y border-surface-border">
          {events.map((event) => <li key={event.id} className="py-8 sm:py-10 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3"><Badge variant="neutral">{event.category.replace(/_/g, ' ')}</Badge><Badge variant={event.eligibility === 'public' ? 'success' : 'lavender'}>{event.eligibility === 'public' ? 'Public event' : 'Members only'}</Badge>{event.status === 'cancelled' && <Badge variant="orange">Cancelled</Badge>}{event.isFull && event.status !== 'cancelled' && <Badge variant="orange">Full</Badge>}</div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{event.title}</h2>
              <p className="mt-3 max-w-[70ch] text-ink-secondary leading-relaxed">{event.shortDescription}</p>
              <div className="mt-4 flex flex-col gap-2 text-sm text-ink-secondary"><p className="flex items-start gap-2"><CalendarDays className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" /><time dateTime={event.startAt}>{formatEventDate(event.startAt)}</time></p><p className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />{event.location || (event.isOnline ? 'Online' : 'Location to be announced')}</p></div>
            </div>
            <Link to={'/events/' + event.slug} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-surface-border px-5 py-2.5 font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">View event <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </li>)}
        </ul>}
    </div>
  );
};
