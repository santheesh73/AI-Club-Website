import { useState, useEffect, useCallback, useContext } from 'react';
import { eventsApi } from '@/services/eventsApi';
import { AuthContext } from '@/features/auth/AuthContext';
import type { EventDetailDto } from '@/types/events';

export function useEventDetail(slug: string | undefined) {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!slug) return;
    if (!isAuthenticated) {
      setEvent(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await eventsApi.getMemberEventBySlug(slug);
      if (res.success) {
        setEvent(res.data);
      } else {
        setError(res.error.message || 'Event not found');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching event detail';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [slug, isAuthenticated]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const register = async () => {
    if (!event) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await eventsApi.registerForEvent(event.id);
      if (res.success) {
        setActionSuccess('Registration confirmed! You are registered for this event.');
        await fetchDetail();
      } else {
        setActionError(res.error.message || 'Failed to complete registration');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRegistration = async () => {
    if (!event) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await eventsApi.cancelRegistration(event.id);
      if (res.success) {
        setActionSuccess('Your registration has been cancelled.');
        await fetchDetail();
      } else {
        setActionError(res.error.message || 'Failed to cancel registration');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    event,
    isLoading,
    error,
    isSubmitting,
    actionError,
    actionSuccess,
    register,
    cancelRegistration,
    refetch: fetchDetail,
  };
}
