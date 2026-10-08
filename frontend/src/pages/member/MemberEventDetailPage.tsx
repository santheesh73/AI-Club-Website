import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { useEventDetail } from '@/features/events';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export const MemberEventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    event,
    isLoading,
    error,
    isSubmitting,
    actionError,
    actionSuccess,
    register,
    cancelRegistration,
  } = useEventDetail(slug);

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading event information..." />
        <p className="text-xs text-ink-muted">Retrieving verified event schedule and attendance roster...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-ink">Event Inaccessible</h2>
        <p className="text-xs text-ink-muted">{error || 'Event could not be found or has not been published.'}</p>
        <Link to="/member/events">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            <span>Return to Events Catalog</span>
          </Button>
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const formattedDate = startDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const startTime = startDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = endDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const now = new Date();
  const regOpen = new Date(event.registrationOpenAt);
  const regClose = new Date(event.registrationCloseAt);
  const isRegNotYetOpen = now < regOpen;
  const isRegClosed = now > regClose || now >= startDate;

  const occupancyRate = event.capacity ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div>
        <Link
          to="/member/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Main Grid: Left Details & Right Registration Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: 2 Spans */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Header */}
          <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="lavender">{(event.category || 'event').toUpperCase()}</Badge>
              {event.isRegistered && (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  You are registered
                </Badge>
              )}
              {event.status === 'cancelled' && <Badge variant="error">Cancelled</Badge>}
              {event.status === 'completed' && <Badge variant="neutral">Completed</Badge>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight">
              {event.title}
            </h1>

            <p className="text-sm text-ink-secondary leading-relaxed">
              {event.shortDescription}
            </p>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-canvas text-ink-muted border border-surface-border text-[11px] font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Schedule & Location Card */}
          <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono pb-2 border-b border-surface-border">
              Schedule & Venue
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-ink-muted flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Date
                </span>
                <p className="font-semibold text-ink text-sm">{formattedDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-ink-muted flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Timing
                </span>
                <p className="font-semibold text-ink text-sm">
                  {startTime} – {endTime}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-ink-muted flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Mode & Location
                </span>
                <p className="font-semibold text-ink text-sm">
                  {event.isOnline
                    ? 'Online Stream'
                    : event.location || 'AI Club Campus Center'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-ink-muted flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Cohort Capacity
                </span>
                <p className="font-semibold text-ink text-sm">
                  {event.capacity ? `${event.capacity} seats total` : 'Unlimited capacity'}
                </p>
              </div>
            </div>

            {/* Unlocked Meeting URL for Registered Members */}
            {event.isRegistered && event.meetingUrl && (
              <div className="mt-4 p-4 rounded-card-sm bg-accent-green-subtle/50 border border-accent-green/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-accent-green" />
                  <div>
                    <p className="text-xs font-bold text-ink">Online Conference Link Active</p>
                    <p className="text-[11px] text-ink-muted">Access granted exclusively to verified registrants.</p>
                  </div>
                </div>
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-pill bg-ink text-canvas text-xs font-semibold hover:bg-ink/90 flex items-center gap-1"
                >
                  <span>Join Session</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Full Description */}
          <div className="p-6 sm:p-8 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono pb-2 border-b border-surface-border">
              About This Experience
            </h3>
            <div className="text-xs sm:text-sm text-ink-secondary leading-relaxed whitespace-pre-line">
              {event.description}
            </div>

            {/* Requirements */}
            {event.requirements && (
              <div className="pt-4 mt-4 border-t border-surface-border space-y-2">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                  Prerequisites & Equipment
                </h4>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  {event.requirements}
                </p>
              </div>
            )}

            {/* Speaker & Host */}
            {(event.speaker || event.organizer) && (
              <div className="pt-4 mt-4 border-t border-surface-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {event.speaker && (
                  <div>
                    <span className="text-ink-muted">Keynote / Lead</span>
                    <p className="font-semibold text-ink pt-0.5">{event.speaker}</p>
                  </div>
                )}
                {event.organizer && (
                  <div>
                    <span className="text-ink-muted">Organizing Division</span>
                    <p className="font-semibold text-ink pt-0.5">{event.organizer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Registration Box */}
        <div className="space-y-6">
          <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-6 sticky top-24">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                Registration Status
              </span>
              <h3 className="text-lg font-bold text-ink">
                {event.isRegistered
                  ? 'Attendance Confirmed'
                  : event.status === 'cancelled'
                  ? 'Event Cancelled'
                  : event.status === 'completed'
                  ? 'Event Concluded'
                  : event.isFull
                  ? 'Registration Full'
                  : 'Open for Registration'}
              </h3>
            </div>

            {/* Capacity Progress Bar */}
            {event.capacity && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ink-muted">Capacity Occupancy</span>
                  <span className="font-bold text-ink">
                    {event.registeredCount} / {event.capacity}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-canvas border border-surface-border overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      event.isFull ? 'bg-red-500' : 'bg-accent-green'
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
                <p className="text-[11px] text-ink-muted text-right">
                  {event.availableSeats !== null ? `${event.availableSeats} seats remaining` : ''}
                </p>
              </div>
            )}

            {/* Feedback Banners */}
            {actionSuccess && (
              <div className="p-3 rounded-card-sm bg-accent-green-subtle text-accent-green-dark border border-accent-green/20 text-xs flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="p-3 rounded-card-sm bg-red-50 text-red-700 border border-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Registration Actions */}
            <div className="space-y-3 pt-2 border-t border-surface-border">
              {event.isRegistered ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-card-sm bg-canvas border border-surface-border text-center space-y-1">
                    <p className="text-xs font-semibold text-accent-green flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Registration Secured</span>
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Your attendance pass is linked to your active club membership ID.
                    </p>
                  </div>

                  {confirmCancelOpen ? (
                    <div className="p-3 rounded-card-sm bg-red-50 border border-red-200 space-y-2 text-xs">
                      <p className="text-red-700 font-semibold">Cancel your reservation?</p>
                      <p className="text-red-600 text-[11px]">
                        This seat will be released immediately for other waiting members.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmCancelOpen(false)}
                          disabled={isSubmitting}
                        >
                          Keep
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => cancelRegistration()}
                          disabled={isSubmitting}
                        >
                          <span>{isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => setConfirmCancelOpen(true)}
                      disabled={isSubmitting || event.status === 'completed'}
                    >
                      <span>Cancel Registration</span>
                    </Button>
                  )}
                </div>
              ) : event.status === 'cancelled' ? (
                <div className="p-4 rounded-card-sm bg-canvas text-center space-y-1">
                  <p className="text-xs font-semibold text-red-600">Event Cancelled</p>
                  <p className="text-[11px] text-ink-muted">
                    {event.cancellationReason || 'This event was cancelled by administration.'}
                  </p>
                </div>
              ) : event.status === 'completed' ? (
                <div className="p-4 rounded-card-sm bg-canvas text-center text-xs text-ink-muted">
                  This event took place previously and is now concluded.
                </div>
              ) : event.isFull ? (
                <div className="space-y-2">
                  <Button variant="secondary" size="md" disabled className="w-full opacity-60">
                    <span>Event Capacity Full</span>
                  </Button>
                  <p className="text-[11px] text-ink-muted text-center">
                    All seats allocated. Registration is closed.
                  </p>
                </div>
              ) : isRegNotYetOpen ? (
                <div className="p-4 rounded-card-sm bg-canvas text-center space-y-1">
                  <p className="text-xs font-semibold text-ink">Registration Not Open</p>
                  <p className="text-[11px] text-ink-muted">
                    Registration opens on {regOpen.toLocaleDateString()}.
                  </p>
                </div>
              ) : isRegClosed ? (
                <div className="p-4 rounded-card-sm bg-canvas text-center space-y-1">
                  <p className="text-xs font-semibold text-ink">Registration Closed</p>
                  <p className="text-[11px] text-ink-muted">
                    The registration window for this activity has lapsed.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full bg-accent-green text-ink font-bold hover:bg-accent-green/90"
                    onClick={() => register()}
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Registering...' : 'Register for Event'}</span>
                  </Button>
                  <p className="text-[10px] text-ink-muted text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-accent-green" />
                    <span>Authoritatively verified via active membership</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
