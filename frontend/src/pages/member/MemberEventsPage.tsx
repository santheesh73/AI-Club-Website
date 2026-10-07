import React, { useState } from 'react';
import { Search, Calendar, Sparkles, Filter, AlertCircle } from 'lucide-react';
import { useEvents } from '@/features/events';
import { useRegisteredEvents } from '@/features/events';
import { EventCard } from '@/features/events/EventCard';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import type { EventCategory } from '@/types/events';

const CATEGORIES: { label: string; value?: EventCategory }[] = [
  { label: 'All Categories' },
  { label: 'Workshops', value: 'workshop' },
  { label: 'Hackathons', value: 'hackathon' },
  { label: 'Tech Talks', value: 'tech_talk' },
  { label: 'Webinars', value: 'webinar' },
  { label: 'Competitions', value: 'competition' },
  { label: 'Bootcamps', value: 'bootcamp' },
];

export const MemberEventsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered' | 'past' | 'all'>('upcoming');

  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    category,
    setCategory,
    search,
    setSearch,
    setTimeline,
  } = useEvents({ initialTimeline: 'upcoming' });

  const {
    upcoming: registeredUpcoming,
    past: registeredPast,
    isLoading: registeredLoading,
    error: registeredError,
  } = useRegisteredEvents();

  const handleTabChange = (tab: 'upcoming' | 'registered' | 'past' | 'all') => {
    setActiveTab(tab);
    if (tab === 'upcoming') setTimeline('upcoming');
    else if (tab === 'past') setTimeline('past');
    else if (tab === 'all') setTimeline('all');
  };

  const isLoading = activeTab === 'registered' ? registeredLoading : eventsLoading;
  const error = activeTab === 'registered' ? registeredError : eventsError;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Editorial Banner */}
      <div className="p-8 sm:p-10 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="lavender">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            Active Member Experiences
          </Badge>
          <span className="text-xs font-mono text-ink-muted">Milestone 6 Collective</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            AI CLUB Activities & Events
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Curated technical workshops, competitive hackathons, research symposiums, and engineering masterclasses exclusively for inducted collective members.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 pt-2 border-t border-surface-border overflow-x-auto">
          <button
            onClick={() => handleTabChange('upcoming')}
            className={`px-3 py-1.5 rounded-card-sm text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-ink text-canvas'
                : 'text-ink-secondary hover:bg-canvas'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Upcoming Events</span>
          </button>

          <button
            onClick={() => handleTabChange('registered')}
            className={`px-3 py-1.5 rounded-card-sm text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'registered'
                ? 'bg-ink text-canvas'
                : 'text-ink-secondary hover:bg-canvas'
            }`}
          >
            <span>My Registrations</span>
            <span className="px-1.5 py-0.2 bg-accent-green/20 text-accent-green rounded-full text-[10px]">
              {registeredUpcoming.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('past')}
            className={`px-3 py-1.5 rounded-card-sm text-xs font-semibold transition-colors ${
              activeTab === 'past'
                ? 'bg-ink text-canvas'
                : 'text-ink-secondary hover:bg-canvas'
            }`}
          >
            <span>Past Events</span>
          </button>

          <button
            onClick={() => handleTabChange('all')}
            className={`px-3 py-1.5 rounded-card-sm text-xs font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-ink text-canvas'
                : 'text-ink-secondary hover:bg-canvas'
            }`}
          >
            <span>All Activities</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar (applicable when not in registered tab) */}
      {activeTab !== 'registered' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, speaker, or keyword..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-card-sm bg-surface border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Filter className="h-3.5 w-3.5 text-ink-muted mr-1 flex-shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setCategory(cat.value)}
                className={`px-2.5 py-1 rounded-card-sm text-xs font-medium whitespace-nowrap transition-colors ${
                  category === cat.value
                    ? 'bg-ink text-canvas font-semibold'
                    : 'bg-surface border border-surface-border text-ink-secondary hover:bg-canvas'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" label="Loading club events..." />
          <p className="text-xs text-ink-muted">Retrieving upcoming schedules and verified capacity...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-3 max-w-md mx-auto">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-ink">Unable to Load Events</h3>
          <p className="text-xs text-ink-muted">{error}</p>
        </div>
      ) : activeTab === 'registered' ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-ink">Upcoming Registrations ({registeredUpcoming.length})</h2>
            <p className="text-xs text-ink-muted">Events you have secured confirmed attendance for.</p>
          </div>

          {registeredUpcoming.length === 0 ? (
            <div className="p-10 rounded-card-lg bg-surface border border-surface-border text-center space-y-2">
              <Calendar className="h-8 w-8 text-ink-muted mx-auto" />
              <h3 className="text-sm font-bold text-ink">No Registered Upcoming Events</h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                Explore the upcoming workshops and hackathons in the catalog to reserve your seat.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => handleTabChange('upcoming')}
                  className="px-4 py-2 rounded-card-sm bg-ink text-canvas text-xs font-semibold hover:bg-ink/90 transition-colors"
                >
                  Browse Upcoming Events
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredUpcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {registeredPast.length > 0 && (
            <div className="pt-8 space-y-4">
              <h2 className="text-base font-bold text-ink">Past Registrations ({registeredPast.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registeredPast.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 rounded-card-lg bg-surface border border-surface-border text-center space-y-3">
          <Calendar className="h-10 w-10 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No Events Found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            No events currently match your selected filters or search parameters. Check back regularly for new club announcements.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
