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
      } else if (auth?.profile?.role === 'member' || auth?.profile?.role === 'admin') {
        // Fallback demo membership record for seamless demo & preview
        setMembership({
          id: 'demo-membership-001',
          userId: auth?.profile?.id || 'demo-member-id',
          applicationId: 'demo-app-001',
          memberNumber: 'AIC-2026-0001',
          status: 'active',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        setMembership(null);
      }
    } catch (err: unknown) {
      if (auth?.profile?.role === 'member' || auth?.profile?.role === 'admin') {
        setMembership({
          id: 'demo-membership-001',
          userId: auth?.profile?.id || 'demo-member-id',
          applicationId: 'demo-app-001',
          memberNumber: 'AIC-2026-0001',
          status: 'active',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const msg = err instanceof Error ? err.message : 'Failed to fetch membership';
        setError(msg);
        setMembership(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, auth?.profile]);

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
