import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Users,
  Send,
  XCircle,
  Edit,
  AlertCircle,
} from 'lucide-react';
import { useAdminEvents } from '@/features/events';
import { EventPublishModal } from '@/features/events/EventPublishModal';
import { EventCancelModal } from '@/features/events/EventCancelModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { AdminEventSummaryDto, EventCategory, EventStatus } from '@/types/events';

export const AdminEventsPage: React.FC = () => {
  const {
    events,
    isLoading,
    error,
    category,
    setCategory,
    status,
    setStatus,
    search,
    setSearch,
    publishEvent,
    cancelEvent,
  } = useAdminEvents();

  const [selectedEventForPublish, setSelectedEventForPublish] = useState<AdminEventSummaryDto | null>(null);
  const [selectedEventForCancel, setSelectedEventForCancel] = useState<AdminEventSummaryDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!selectedEventForPublish) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await publishEvent(selectedEventForPublish.id);
      setSelectedEventForPublish(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Publishing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (reason: string) => {
    if (!selectedEventForCancel) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await cancelEvent(selectedEventForCancel.id, reason);
      setSelectedEventForCancel(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (s: EventStatus) => {
    switch (s) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'draft':
        return <Badge variant="neutral">Draft</Badge>;
      case 'ongoing':
        return <Badge variant="orange">Ongoing</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Event Management & Activities Oversight
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Create, publish, and schedule club workshops, hackathons, and attendance rosters.
          </p>
        </div>

        <Link to="/admin/events/new">
          <Button variant="primary" size="sm" className="flex items-center gap-1.5 bg-ink text-canvas">
            <Plus className="h-4 w-4" />
            <span>Create New Event</span>
          </Button>
        </Link>
      </div>

      {actionError && (
        <div className="p-3 rounded-card-sm bg-red-50 text-red-700 border border-red-200 text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title or keyword..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-card-sm bg-surface border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Status Filter */}
          <select
            value={status || ''}
            onChange={(e) => setStatus((e.target.value as EventStatus) || undefined)}
            className="px-3 py-2 text-xs rounded-card-sm bg-surface border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Category Filter */}
          <select
            value={category || ''}
            onChange={(e) => setCategory((e.target.value as EventCategory) || undefined)}
            className="px-3 py-2 text-xs rounded-card-sm bg-surface border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          >
            <option value="">All Categories</option>
            <option value="workshop">Workshops</option>
            <option value="hackathon">Hackathons</option>
            <option value="tech_talk">Tech Talks</option>
            <option value="webinar">Webinars</option>
            <option value="bootcamp">Bootcamps</option>
          </select>
        </div>
      </div>

      {/* Main Events Table / Content */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" label="Loading admin events..." />
          <p className="text-xs text-ink-muted">Retrieving event statuses and capacity telemetry...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-3 max-w-md mx-auto">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-ink">Error Loading Events</h3>
          <p className="text-xs text-ink-muted">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 rounded-card-lg bg-surface border border-surface-border text-center space-y-3">
          <Calendar className="h-10 w-10 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No Events Found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            No events match your current filter criteria. Create a new event to initialize registration.
          </p>
        </div>
      ) : (
        <div className="rounded-card-lg bg-surface border border-surface-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-surface-border text-[10px] uppercase font-mono tracking-wider text-ink-muted">
                <tr>
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registrations</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {events.map((event) => {
                  const startDate = new Date(event.startAt);
                  const formattedDate = startDate.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={event.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-ink hover:underline">
                            <Link to={`/admin/events/${event.id}/registrations`}>{event.title}</Link>
                          </p>
                          <p className="text-[10px] font-mono text-ink-muted">/{event.slug}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono uppercase text-[11px] text-ink-secondary">
                        {event.category.replace('_', ' ')}
                      </td>

                      <td className="py-3.5 px-4 text-ink-secondary">
                        <span>{formattedDate}</span>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(event.status)}</td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={`/admin/events/${event.id}/registrations`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <Users className="h-3.5 w-3.5 text-ink-muted" />
                          <span className="font-mono font-bold text-ink">
                            {event.registeredCount}
                          </span>
                          <span className="text-ink-muted font-mono">
                            / {event.capacity || '∞'}
                          </span>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/events/${event.id}/registrations`}>
                            <Button variant="ghost" size="sm" title="View Registrations">
                              <Users className="h-3.5 w-3.5 mr-1" />
                              <span>Roster</span>
                            </Button>
                          </Link>

                          {event.status === 'draft' && (
                            <>
                              <Link to={`/admin/events/${event.id}/edit`}>
                                <Button variant="outline" size="sm" title="Edit Draft">
                                  <Edit className="h-3 w-3 mr-1" />
                                  <span>Edit</span>
                                </Button>
                              </Link>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setSelectedEventForPublish(event)}
                                className="bg-accent-green text-ink font-semibold hover:bg-accent-green/90"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                <span>Publish</span>
                              </Button>
                            </>
                          )}

                          {(event.status === 'published' || event.status === 'ongoing') && (
                            <>
                              <Link to={`/admin/events/${event.id}/edit`}>
                                <Button variant="ghost" size="sm" title="Edit Metadata">
                                  <Edit className="h-3 w-3 mr-1" />
                                  <span>Edit</span>
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEventForCancel(event)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                <span>Cancel</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <EventPublishModal
        isOpen={!!selectedEventForPublish}
        onClose={() => setSelectedEventForPublish(null)}
        onConfirm={handlePublish}
        eventTitle={selectedEventForPublish?.title || ''}
        isSubmitting={isSubmitting}
      />

      <EventCancelModal
        isOpen={!!selectedEventForCancel}
        onClose={() => setSelectedEventForCancel(null)}
        onConfirm={handleCancel}
        eventTitle={selectedEventForCancel?.title || ''}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
