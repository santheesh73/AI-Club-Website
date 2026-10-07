import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, AlertCircle } from 'lucide-react';
import { eventsApi } from '@/services/eventsApi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { AdminEventSummaryDto, RegistrationAttendeeDto } from '@/types/events';

export const AdminEventRegistrationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<AdminEventSummaryDto | null>(null);
  const [attendees, setAttendees] = useState<RegistrationAttendeeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      eventsApi.getAdminEventById(id),
      eventsApi.getEventRegistrations(id),
    ])
      .then(([eventRes, attRes]) => {
        setIsLoading(false);
        if (eventRes.success) {
          setEvent(eventRes.data);
        } else {
          setError(eventRes.error.message || 'Failed to retrieve event');
        }

        if (attRes.success) {
          setAttendees(attRes.data);
        }
      })
      .catch((err: unknown) => {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Error loading registrations');
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading attendee records..." />
        <p className="text-xs text-ink-muted">Retrieving verified membership roster and seats...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-3 max-w-md mx-auto">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <h3 className="text-sm font-bold text-ink">Attendee Roster Unavailable</h3>
        <p className="text-xs text-ink-muted">{error || 'Event could not be found.'}</p>
        <Link to="/admin/events">
          <Button variant="outline" size="sm">Back to Event List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Event Oversight</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
                {event.title} — Attendee Roster
              </h1>
              <Badge variant={event.status === 'published' ? 'success' : 'neutral'}>
                {event.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Verified active member registrations linked to official club credentials.
            </p>
          </div>

          <div className="p-3.5 rounded-card-sm bg-surface border border-surface-border flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-ink-muted block text-[10px] uppercase">Registered</span>
              <span className="text-base font-bold text-ink">{attendees.filter(a => a.status === 'registered').length}</span>
            </div>
            <div className="w-px h-6 bg-surface-border" />
            <div>
              <span className="text-ink-muted block text-[10px] uppercase">Capacity</span>
              <span className="text-base font-bold text-ink">{event.capacity || '∞'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      {attendees.length === 0 ? (
        <div className="p-12 rounded-card-lg bg-surface border border-surface-border text-center space-y-3">
          <Users className="h-10 w-10 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No Registrations Yet</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            Eligible members will appear here as soon as they register for this published event.
          </p>
        </div>
      ) : (
        <div className="rounded-card-lg bg-surface border border-surface-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-surface-border text-[10px] uppercase font-mono tracking-wider text-ink-muted">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Member ID #</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {attendees.map((attendee) => {
                  const regDate = new Date(attendee.registeredAt);
                  const formatted = regDate.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={attendee.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-ink">{attendee.fullName}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-accent-green-dark">
                        {attendee.memberNumber || 'AIC-MEMBER'}
                      </td>
                      <td className="py-3.5 px-4 text-ink-secondary">{attendee.email}</td>
                      <td className="py-3.5 px-4 text-ink-secondary">{attendee.department || 'Not Specified'}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={attendee.status === 'registered' ? 'success' : 'neutral'}>
                          {attendee.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-ink-muted text-[11px]">
                        {formatted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
