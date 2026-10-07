import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Globe, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { MemberEventCardDto } from '@/types/events';

interface EventCardProps {
  event: MemberEventCardDto;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const startDate = new Date(event.startAt);
  const formattedDate = startDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'workshop':
        return 'lavender';
      case 'hackathon':
        return 'orange';
      case 'tech_talk':
        return 'info';
      case 'bootcamp':
        return 'default';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="rounded-card bg-surface border border-surface-border shadow-soft hover:border-ink/40 transition-all flex flex-col justify-between overflow-hidden group">
      {/* Top Banner / Category Header */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={getCategoryBadgeVariant(event.category) as any}>
            {event.category.replace('_', ' ')}
          </Badge>

          {event.isRegistered ? (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3 mr-1 inline" />
              Registered
            </Badge>
          ) : event.status === 'cancelled' ? (
            <Badge variant="error">Cancelled</Badge>
          ) : event.status === 'completed' ? (
            <Badge variant="neutral">Completed</Badge>
          ) : event.isFull ? (
            <Badge variant="error">Event Full</Badge>
          ) : (
            <span className="text-[11px] font-mono text-ink-muted">
              {event.availableSeats !== null ? `${event.availableSeats} seats left` : 'Open'}
            </span>
          )}
        </div>

        {/* Title and Short Description */}
        <div className="space-y-1.5">
          <Link to={`/member/events/${event.slug}`}>
            <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight group-hover:underline line-clamp-2">
              {event.title}
            </h3>
          </Link>
          <p className="text-xs text-ink-secondary leading-relaxed line-clamp-3">
            {event.shortDescription}
          </p>
        </div>

        {/* Schedule & Logistics */}
        <div className="pt-2 space-y-2 border-t border-surface-border text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
            <span>{formattedDate}</span>
            <span className="text-ink-muted/50">•</span>
            <Clock className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
            <span>{formattedTime}</span>
          </div>

          <div className="flex items-center gap-2">
            {event.isOnline ? (
              <>
                <Globe className="h-3.5 w-3.5 text-accent-green flex-shrink-0" />
                <span className="text-ink font-medium">Online Stream</span>
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
                <span className="truncate">{event.location || 'Campus Center'}</span>
              </>
            )}
            {event.capacity && (
              <>
                <span className="text-ink-muted/50">•</span>
                <Users className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
                <span>{event.capacity} Max</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 bg-canvas border-t border-surface-border flex items-center justify-between">
        <span className="text-[11px] font-mono text-ink-muted">
          {event.speaker ? `Speaker: ${event.speaker.split('(')[0]}` : 'AI Club Collective'}
        </span>

        <Link to={`/member/events/${event.slug}`}>
          <Button variant="outline" size="sm" className="group-hover:bg-ink group-hover:text-canvas transition-colors">
            <span>View Event</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
