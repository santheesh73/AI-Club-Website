import { useState, useEffect, useCallback, useContext } from 'react';
import { eventsApi } from '@/services/eventsApi';
import { AuthContext } from '@/features/auth/AuthContext';
import type { MemberEventCardDto, EventCategory } from '@/types/events';

interface UseEventsParams {
  initialCategory?: EventCategory;
  initialTimeline?: 'upcoming' | 'past' | 'all';
}

export function useEvents(params: UseEventsParams = {}) {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [events, setEvents] = useState<MemberEventCardDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const [category, setCategory] = useState<EventCategory | undefined>(params.initialCategory);
  const [timeline, setTimeline] = useState<'upcoming' | 'past' | 'all'>(params.initialTimeline || 'upcoming');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await eventsApi.getMemberEvents({
        category,
        timeline,
        search: search.trim() || undefined,
        page,
        pageSize: 20,
      });

      if (res.success) {
        setEvents(res.data);
        setTotal(res.meta?.total as number || res.data.length);
      } else {
        setError(res.error.message || 'Failed to retrieve events');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading events';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, category, timeline, search, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    total,
    category,
    setCategory: (c: EventCategory | undefined) => {
      setCategory(c);
      setPage(1);
    },
    timeline,
    setTimeline: (t: 'upcoming' | 'past' | 'all') => {
      setTimeline(t);
      setPage(1);
    },
    search,
    setSearch: (s: string) => {
      setSearch(s);
      setPage(1);
    },
    page,
    setPage,
    refetch: fetchEvents,
  };
}
