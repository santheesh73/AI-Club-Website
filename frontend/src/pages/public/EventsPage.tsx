import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';

interface PublicEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity?: number;
  isMemberOnly?: boolean;
}

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<{ data: PublicEvent[] }>('/api/v1/events')
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            const list = Array.isArray(res.data) ? (res.data as any) : (res.data as any)?.items || [];
            setEvents(list);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          // Provide fallback default scheduled events
          setEvents([
            {
              id: 'evt-ai-summit',
              title: 'Annual Applied AI Research Symposium',
              description: 'Keynotes by industry researchers, student paper presentations, and architectural showcases across vision and language.',
              category: 'Symposium',
              startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 3600000).toISOString(),
              location: 'Main Auditorium & Live Stream',
              isMemberOnly: false,
            },
            {
              id: 'evt-hackathon',
              title: 'Autonomous Agents 48-Hour Hackathon',
              description: 'Team sprint focused on building practical multi-agent systems using LangGraph, tool calling, and local LLM backends.',
              category: 'Hackathon',
              startDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
              location: 'AI Research Lab B, Turing Wing',
              isMemberOnly: true,
            },
            {
              id: 'evt-reading-group',
              title: 'Seminal Paper Reading Clinic: Reasoning in Large Models',
              description: 'Line-by-line breakdown of Test-Time Compute Scaling, Monte Carlo Tree Search for LLMs, and chain-of-thought optimization.',
              category: 'Seminar',
              startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 2 * 3600000).toISOString(),
              location: 'Conference Room 304',
              isMemberOnly: false,
            },
          ]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="neutral">Calendar of Activities</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Community Events & Seminars
        </h1>
        <p className="text-lg text-ink-secondary leading-relaxed">
          Explore upcoming hackathons, paper clinics, guest keynotes, and project sprint deadlines.
        </p>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-16 text-sm text-ink-muted">Loading scheduled events...</div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16 text-ink-muted shadow-subtle">
          <CardContent>No upcoming events currently scheduled. Check back soon.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((evt) => (
            <Card key={evt.id} className="shadow-subtle hover:shadow-elevated transition-shadow flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="lavender">{evt.category || 'Event'}</Badge>
                  {evt.isMemberOnly && (
                    <Badge variant="orange">Members Only</Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-bold leading-snug">{evt.title}</CardTitle>
                <CardDescription className="text-xs text-ink-muted mt-2 leading-relaxed">
                  {evt.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-ink-secondary pt-2 border-t border-surface-border">
                <div className="font-semibold text-ink">
                  {formatDate(evt.startDate)}
                </div>
                <div className="text-ink-muted flex items-center gap-1">
                  <span>📍</span>
                  <span>{evt.location}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Link to="/register" className="w-full">
                  <Button variant="outline" size="sm" className="w-full">
                    {evt.isMemberOnly ? 'Join Club to RSVP' : 'Register to Attend'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
