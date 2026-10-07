import { useState, useEffect, useCallback } from 'react';
import { intelligenceApi } from '@/services/intelligenceApi';
import type { NotificationItem, NotificationPreferences } from '@/types/intelligence';

export function useNotifications(autoFetch = true) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await intelligenceApi.getUnreadCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchNotifications = useCallback(async (unreadOnly = false, limit = 20, offset = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await intelligenceApi.getNotifications(unreadOnly, limit, offset);
      if (res.success) {
        setNotifications(res.data.notifications);
        setTotal(res.data.total);
        setUnreadCount(res.data.unreadCount);
      } else {
        setError(res.error.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await intelligenceApi.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await intelligenceApi.markAllAsRead();
      if (res.success) {
        const now = new Date().toISOString();
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
        setUnreadCount(0);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await intelligenceApi.getPreferences();
      if (res.success && res.data) {
        setPreferences(res.data);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const updatePreferences = useCallback(
    async (
      updated: Partial<
        Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
      >
    ) => {
      try {
        const res = await intelligenceApi.updatePreferences(updated);
        if (res.success) {
          setPreferences(res.data);
          return { success: true };
        }
        return { success: false, error: res.error.message };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    []
  );

  useEffect(() => {
    if (autoFetch) {
      fetchUnreadCount();
      fetchNotifications();
    }
  }, [autoFetch, fetchUnreadCount, fetchNotifications]);

  return {
    notifications,
    total,
    unreadCount,
    preferences,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    fetchPreferences,
    updatePreferences,
  };
}
