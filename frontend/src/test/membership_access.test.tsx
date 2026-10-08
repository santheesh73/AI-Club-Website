import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ContextType } from 'react';
import { AuthContext } from '@/features/auth/AuthContext';
import { useMembership } from '@/features/membership/useMembership';
import { membershipApi } from '@/services/membershipApi';

const account = { profile: { id: 'real-member', role: 'member' }, isAuthenticated: true } as ContextType<typeof AuthContext>;
function MembershipProbe() {
  const { isLoading, isActiveMember } = useMembership();
  return <p>{isLoading ? 'Checking membership' : isActiveMember ? 'Active membership' : 'Membership unavailable'}</p>;
}
describe('Authoritative member access', () => {
  afterEach(() => vi.restoreAllMocks());
  it('does not manufacture an active membership for a normal member account when the API fails', async () => {
    vi.spyOn(membershipApi, 'getMyMembership').mockResolvedValue({ success: false, error: { code: 'NETWORK_ERROR', message: 'Unavailable' } });
    render(<AuthContext.Provider value={account}><MembershipProbe /></AuthContext.Provider>);
    expect(await screen.findByText('Membership unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Active membership')).not.toBeInTheDocument();
  });
});
