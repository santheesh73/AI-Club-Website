import { useState, useEffect, useCallback } from 'react';
import { eventsApi } from '@/services/eventsApi';
import type { AdminEventSummaryDto, EventCategory, EventStatus } from '@/types/events';

export function useAdminEvents() {
  const [events, setEvents] = useState<AdminEventSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const [category, setCategory] = useState<EventCategory | undefined>();
  const [status, setStatus] = useState<EventStatus | undefined>();
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await eventsApi.getAdminEvents({
        category,
        status,
        search: search.trim() || undefined,
        page,
        pageSize: 20,
      });

      if (res.success) {
        setEvents(res.data);
        setTotal(res.meta?.total as number || res.data.length);
      } else {
        setError(res.error.message || 'Failed to fetch admin events');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching events';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [category, status, search, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const publishEvent = async (id: string) => {
    const res = await eventsApi.publishEvent(id);
    if (res.success) {
      await fetchEvents();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to publish event');
  };

  const cancelEvent = async (id: string, reason: string) => {
    const res = await eventsApi.cancelEvent(id, reason);
    if (res.success) {
      await fetchEvents();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to cancel event');
  };

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
    status,
    setStatus: (s: EventStatus | undefined) => {
      setStatus(s);
      setPage(1);
    },
    search,
    setSearch: (s: string) => {
      setSearch(s);
      setPage(1);
    },
    page,
    setPage,
    publishEvent,
    cancelEvent,
    refetch: fetchEvents,
  };
}
