import { useState, useEffect, useCallback, useContext } from 'react';
import { membershipApi } from '@/services/membershipApi';
import { AuthContext } from '@/features/auth/AuthContext';
import type { MemberDashboardData } from '@/types/membership';

export function useMemberDashboard() {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [data, setData] = useState<MemberDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await membershipApi.getMyDashboard();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error.message || 'Unable to load member dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to member service';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}
