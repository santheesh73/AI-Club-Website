import { useState, useEffect, useCallback, useContext } from 'react';
import { eventsApi } from '@/services/eventsApi';
import { AuthContext } from '@/features/auth/AuthContext';
import type { MemberEventCardDto } from '@/types/events';

export function useRegisteredEvents() {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [upcoming, setUpcoming] = useState<MemberEventCardDto[]>([]);
  const [past, setPast] = useState<MemberEventCardDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistered = useCallback(async () => {
    if (!isAuthenticated) {
      setUpcoming([]);
      setPast([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await eventsApi.getMemberRegisteredEvents();
      if (res.success) {
        setUpcoming(res.data.upcoming || []);
        setPast(res.data.past || []);
      } else {
        setError(res.error.message || 'Unable to load registered events');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading registered events';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRegistered();
  }, [fetchRegistered]);

  return {
    upcoming,
    past,
    isLoading,
    error,
    refetch: fetchRegistered,
  };
}
