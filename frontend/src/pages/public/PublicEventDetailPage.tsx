import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/features/auth';
import { eventAuthUrl, rememberEventReturn } from '@/features/auth/authReturn';
import { eventsApi } from '@/services/eventsApi';
import { isEventRegistrationRecord, isEventRegistrationStatusDto, isPublicEventDto, type EventRegistrationStatusDto, type PublicEventDto } from '@/types/events';
import { formatEventDate } from './EventsPage';

const linkClass = 'inline-flex min-h-11 items-center justify-center rounded-pill bg-ink text-canvas px-5 py-2.5 text-sm font-medium hover:bg-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

function safeMeetingUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export const PublicEventDetailPage: React.FC = () => {
  const { slug = '' } = useParams();
  const { isAuthenticated, isLoading: authLoading, user, profile, isAdmin } = useAuth();
  const [event, setEvent] = useState<PublicEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [registration, setRegistration] = useState<EventRegistrationStatusDto | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [statusAttempt, setStatusAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const actionVersion = useRef(0);

  useEffect(() => {
    actionVersion.current += 1;
    setSubmitting(false);
    setNotice(null);
    setActionError(null);
    return () => { actionVersion.current += 1; };
  }, [event?.id, user?.id, isAuthenticated]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setEvent(null);
    setError(null);
    setNotFound(false);
    setNotice(null);
    setActionError(null);
    async function load() {
      try {
        const response = await eventsApi.getPublicEventBySlug(slug);
        if (!current) return;
        if (!response || !response.success) {
          if (response && !response.success && ['NOT_FOUND', 'EVENT_NOT_FOUND', 'HTTP_404'].includes(response.error.code)) setNotFound(true);
          else setError('We could not load this event. Please try again.');
        } else if (!isPublicEventDto(response.data) || response.data.slug !== slug) setError('This event returned incomplete information. Please try again.');
        else setEvent(response.data);
      } catch {
        if (current) setError('We could not reach this event. Please try again.');
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => { current = false; };
  }, [slug, attempt]);

  useEffect(() => {
    let current = true;
    setRegistration(null);
    setRegistrationError(null);
    if (!event || !isAuthenticated || authLoading) {
      setRegistrationLoading(false);
      return () => { current = false; };
    }
    setRegistrationLoading(true);
    async function loadStatus() {
      try {
        const response = await eventsApi.getPublicEventRegistration(event!.id);
        if (!current) return;
        if (!response || !response.success) setRegistrationError('We could not check your RSVP. Please try again before reserving a place.');
        else if (!isEventRegistrationStatusDto(response.data) || (response.data.registration && (response.data.registration.eventId !== event!.id || response.data.registration.userId !== user?.id))) setRegistrationError('Your RSVP status returned incomplete information. Please try again.');
        else setRegistration(response.data);
      } catch {
        if (current) setRegistrationError('We could not check your RSVP. Please try again before reserving a place.');
      } finally {
        if (current) setRegistrationLoading(false);
      }
    }
    void loadStatus();
    return () => { current = false; };
  }, [event?.id, isAuthenticated, authLoading, user?.id, statusAttempt]);

  const handleRegistration = async (cancel: boolean) => {
    if (!event || !isAuthenticated || submitting) return;
    const version = actionVersion.current;
    setSubmitting(true);
    setActionError(null);
    setNotice(null);
    try {
      const response = cancel ? await eventsApi.cancelPublicEventRegistration(event.id) : await eventsApi.registerForPublicEvent(event.id);
      if (actionVersion.current !== version) return;
      if (!response || !response.success) {
        setActionError(response && !response.success ? response.error.message : 'The RSVP request failed. Please try again.');
        setStatusAttempt((value) => value + 1);
      } else if (!isEventRegistrationRecord(response.data) || response.data.eventId !== event.id || response.data.userId !== user?.id || response.data.status !== (cancel ? 'cancelled' : 'registered')) {
        setActionError('We could not confirm the RSVP update. Check your RSVP status before trying again.');
        setStatusAttempt((value) => value + 1);
      } else {
        setRegistration({ isRegistered: !cancel, registration: response.data, meetingUrl: null });
        setNotice(cancel ? 'Your RSVP has been cancelled.' : 'Your RSVP is confirmed.');
        setStatusAttempt((value) => value + 1);
      }
      try {
        const freshEvent = await eventsApi.getPublicEventBySlug(event.slug);
        if (actionVersion.current === version && freshEvent?.success && isPublicEventDto(freshEvent.data)) setEvent(freshEvent.data);
      } catch { /* A calendar refresh cannot invalidate a confirmed RSVP response. */ }
    } catch {
      if (actionVersion.current === version) {
        setActionError('We could not confirm the RSVP update. Check your RSVP status before trying again.');
        setStatusAttempt((value) => value + 1);
      }
    } finally {
      if (actionVersion.current === version) setSubmitting(false);
    }
  };

  const eventPath = event ? `/events/${event.slug}` : null;
  const hasMembership = profile?.role === 'member' || isAdmin;
  const meetingUrl = registration?.isRegistered ? safeMeetingUrl(registration.meetingUrl) : null;
  const cancellationAvailable = Boolean(event && event.status !== 'completed' && now < Date.parse(event.startAt));
  const eligible = event?.eligibility === 'public' || hasMembership;
  const unavailable = event?.status === 'cancelled' ? 'This event has been cancelled.'
    : event && (event.status === 'completed' || now >= Date.parse(event.endAt)) ? 'This event has ended.'
    : event && now < Date.parse(event.registrationOpenAt) ? `Registration opens ${formatEventDate(event.registrationOpenAt)}.`
    : event && (now > Date.parse(event.registrationCloseAt) || event.status !== 'published') ? 'Registration is closed.'
    : event?.isFull ? 'This event is full. No places are currently available.' : null;

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 sm:py-16">
      <Link to="/events" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All events</Link>
      {loading ? <p role="status" className="py-12 text-ink-secondary">Loading event…</p>
        : notFound ? <div className="py-12"><h1 className="text-3xl font-bold text-ink">Event unavailable</h1><p className="mt-4 text-ink-secondary">This event could not be found in the public calendar.</p></div>
        : error ? <div className="py-12 space-y-5"><h1 className="text-3xl font-bold text-ink">Event details</h1><p role="alert" className="text-ink-secondary">{error}</p><Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry loading event</Button></div>
        : event && <div className="mt-8 sm:mt-12 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10 lg:gap-16">
          <article className="min-w-0">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink break-words">{event.title}</h1>
            <div className="flex flex-wrap gap-2 mt-5"><Badge variant="neutral">{event.category.replace(/_/g, ' ')}</Badge><Badge variant={event.eligibility === 'public' ? 'success' : 'lavender'}>{event.eligibility === 'public' ? 'Public event' : 'Members only'}</Badge></div>
            <p className="mt-6 text-xl text-ink-secondary leading-relaxed max-w-[65ch]">{event.shortDescription}</p>
            <dl className="mt-8 py-6 border-y border-surface-border space-y-5 text-ink-secondary">
              <div><dt className="flex items-center gap-2 font-semibold text-ink"><CalendarDays className="h-4 w-4" aria-hidden="true" />When</dt><dd className="mt-2"><time dateTime={event.startAt}>{formatEventDate(event.startAt)}</time><span className="block mt-1">Ends <time dateTime={event.endAt}>{formatEventDate(event.endAt)}</time></span></dd></div>
              <div><dt className="flex items-center gap-2 font-semibold text-ink"><MapPin className="h-4 w-4" aria-hidden="true" />Where</dt><dd className="mt-2">{event.location || (event.isOnline ? 'Online' : 'Location to be announced')}<span className="block mt-1 capitalize">{event.eventMode} event</span></dd></div>
              {event.speaker && <div><dt className="font-semibold text-ink">Speaker</dt><dd className="mt-2">{event.speaker}</dd></div>}
              {event.organizer && <div><dt className="font-semibold text-ink">Organizer</dt><dd className="mt-2">{event.organizer}</dd></div>}
            </dl>
            <section className="mt-10"><h2 className="text-2xl font-semibold text-ink">About this event</h2><p className="mt-4 whitespace-pre-wrap text-ink-secondary leading-relaxed max-w-[70ch]">{event.description}</p></section>
            {event.requirements && <section className="mt-10"><h2 className="text-2xl font-semibold text-ink">Before you attend</h2><p className="mt-4 whitespace-pre-wrap text-ink-secondary leading-relaxed max-w-[70ch]">{event.requirements}</p></section>}
          </article>
          <aside aria-labelledby="rsvp-heading" className="self-start rounded-xl bg-surface-muted p-6 sm:p-7 space-y-5">
            <h2 id="rsvp-heading" className="text-2xl font-semibold text-ink">Your RSVP</h2>
            <p className="text-sm text-ink-secondary leading-relaxed">{event.eligibility === 'public' ? 'An AI Club account is enough to RSVP. The membership assessment is not required for this public event.' : 'This event requires active club membership.'}</p>
            {notice && <p role="status" className="text-sm font-medium text-ink">{notice}</p>}
            {actionError && <p role="alert" className="text-sm text-red-800">{actionError}</p>}
            {authLoading || (isAuthenticated && registrationLoading) ? <p role="status" className="text-sm text-ink-secondary">Checking your RSVP…</p>
              : registrationError ? <div className="space-y-4"><p role="alert" className="text-sm text-ink-secondary">{registrationError}</p><Button variant="outline" onClick={() => setStatusAttempt((value) => value + 1)}>Retry RSVP status</Button></div>
              : registration?.isRegistered ? <div className="space-y-4"><p className="font-semibold text-ink">You have an RSVP for this event.</p>{registration.registration && <p className="text-sm text-ink-secondary">Reserved {formatEventDate(registration.registration.registeredAt)}.</p>}{meetingUrl && <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} w-full`}>Join online event</a>}{unavailable && <p className="text-sm text-ink-secondary">{unavailable}</p>}{cancellationAvailable ? <Button variant="outline" className="w-full" isLoading={submitting} onClick={() => void handleRegistration(true)}>Cancel my RSVP</Button> : <p className="text-sm text-ink-secondary">The cancellation window has closed. RSVPs can be cancelled before the event starts.</p>}</div>
              : <div className="space-y-4">
                {registration?.registration?.status === 'cancelled' && <p className="text-sm text-ink-secondary">Your previous RSVP is cancelled.</p>}
                {unavailable && <p className="text-sm font-medium text-ink">{unavailable}</p>}
                {!eligible ? <div className="space-y-4"><Link to={isAuthenticated ? '/applicant/dashboard' : '/register'} className={linkClass}>Apply to join</Link>{!isAuthenticated && <p className="text-sm text-ink-secondary">Already a member? <Link to={eventAuthUrl('login', eventPath)} onClick={() => rememberEventReturn(eventPath)} className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">Sign in</Link></p>}</div>
                  : unavailable ? null
                  : !isAuthenticated ? <Link to={eventAuthUrl('login', eventPath)} onClick={() => rememberEventReturn(eventPath)} className={`${linkClass} w-full`}>Sign in to RSVP</Link>
                  : registration ? <Button className="w-full" isLoading={submitting} onClick={() => void handleRegistration(false)}>RSVP to this event</Button>
                  : <p role="status" className="text-sm text-ink-secondary">Checking your RSVP…</p>}
                {!unavailable && eligible && event.availableSeats !== null && <p className="text-sm text-ink-secondary">{event.availableSeats} {event.availableSeats === 1 ? 'place' : 'places'} available.</p>}
              </div>}
            <p className="text-xs text-ink-secondary leading-relaxed">Registration closes {formatEventDate(event.registrationCloseAt)}. Creating an account does not reserve a place.</p>
          </aside>
        </div>}
    </div>
  );
};
