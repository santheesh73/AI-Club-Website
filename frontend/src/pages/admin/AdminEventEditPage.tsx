import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { eventsApi } from '@/services/eventsApi';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import type { EventCategory, EventMode, EventEligibility, AdminEventSummaryDto } from '@/types/events';

export const AdminEventEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<AdminEventSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('workshop');
  const [eventMode, setEventMode] = useState<EventMode>('physical');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [eligibility, setEligibility] = useState<EventEligibility>('members_only');
  const [speaker, setSpeaker] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [requirements, setRequirements] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    eventsApi.getAdminEventById(id).then((res) => {
      setIsLoading(false);
      if (res.success) {
        const ev = res.data;
        setEvent(ev);
        setTitle(ev.title);
        setShortDescription(ev.shortDescription);
        setDescription(ev.description);
        setCategory(ev.category);
        setEventMode(ev.eventMode);
        setLocation(ev.location || '');
        setMeetingUrl(ev.meetingUrl || '');
        setCapacity(ev.capacity ? String(ev.capacity) : '');
        setEligibility(ev.eligibility);
        setSpeaker(ev.speaker || '');
        setOrganizer(ev.organizer || '');
        setRequirements(ev.requirements || '');
      } else {
        setError(res.error.message || 'Failed to load event');
      }
    });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading event record..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-3 max-w-md mx-auto">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <h3 className="text-sm font-bold text-ink">Event Not Found</h3>
        <p className="text-xs text-ink-muted">{error || 'Event could not be located.'}</p>
        <Link to="/admin/events">
          <Button variant="outline" size="sm">Back to Event List</Button>
        </Link>
      </div>
    );
  }

  const isReadOnly = event.status === 'completed' || event.status === 'cancelled';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await eventsApi.updateEvent(event.id, {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        category,
        eventMode,
        location: eventMode !== 'online' ? location.trim() : null,
        meetingUrl: eventMode !== 'physical' && meetingUrl.trim() ? meetingUrl.trim() : null,
        capacity: capacity ? parseInt(capacity, 10) : null,
        eligibility,
        speaker: speaker.trim() || null,
        organizer: organizer.trim() || null,
        requirements: requirements.trim() || null,
      });

      if (res.success) {
        navigate('/admin/events');
      } else {
        setError(res.error.message || 'Failed to update event');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Event Oversight</span>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Edit Event: {event.title}
          </h1>
          <Badge variant={event.status === 'published' ? 'success' : 'neutral'}>
            {event.status.toUpperCase()}
          </Badge>
        </div>
        <p className="text-xs text-ink-muted mt-0.5 font-mono">
          Slug: /{event.slug} • Registrations: {event.registeredCount} / {event.capacity || '∞'}
        </p>
      </div>

      {isReadOnly && (
        <div className="p-4 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink-secondary flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5" />
          <p>
            This event is marked as <strong>{event.status.toUpperCase()}</strong>. In accordance with platform integrity rules, past or cancelled events are in read-only preservation mode.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-card-sm bg-red-50 text-red-700 border border-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                disabled={isReadOnly}
              >
                <option value="workshop">Workshop</option>
                <option value="hackathon">Hackathon</option>
                <option value="tech_talk">Tech Talk</option>
                <option value="webinar">Webinar</option>
                <option value="competition">Competition</option>
                <option value="bootcamp">Bootcamp</option>
                <option value="meetup">Meetup</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              disabled={isReadOnly}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Detailed Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Meeting URL</label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Speaker</label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Organizer</label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Requirements</label>
            <input
              type="text"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link to="/admin/events">
              <Button variant="ghost" size="md" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="bg-ink text-canvas font-semibold"
            >
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Updates'}</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
