import { useState, useEffect, useCallback, useContext } from 'react';
import { membershipApi } from '@/services/membershipApi';
import { AuthContext } from '@/features/auth/AuthContext';
import type { MembershipRecord } from '@/types/membership';

export function useMembership() {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [membership, setMembership] = useState<MembershipRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembership = useCallback(async () => {
    if (!isAuthenticated) {
      setMembership(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await membershipApi.getMyMembership();
      if (res.success && res.data) {
        setMembership(res.data);
      } else {
        setMembership(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch membership';
      setError(msg);
      setMembership(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  return {
    membership,
    isActiveMember: membership?.status === 'active',
    isLoading,
    error,
    refetch: fetchMembership,
  };
}
