import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ContextType } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/features/auth/AuthContext';
import { AppRoutes } from '@/routes';
import { eventsApi } from '@/services/eventsApi';
import { membershipApi } from '@/services/membershipApi';
import type { EventDetailDto } from '@/types/events';

vi.mock('@/features/notifications', () => ({ NotificationBell: () => null }));

const stamp = '2026-01-01T00:00:00.000Z';
const account: NonNullable<ContextType<typeof AuthContext>> = {
  user: { id: 'route-member', email: 'member@example.test', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: stamp },
  profile: { id: 'route-member', fullName: 'Route Member', email: 'member@example.test', role: 'member', skills: [], interests: [], createdAt: stamp, updatedAt: stamp },
  session: null, isAuthenticated: true, isAdmin: false, isLoading: false,
  signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), resetPassword: vi.fn(),
  updatePassword: vi.fn(), refreshProfile: vi.fn(), updateProfile: vi.fn(), loginAsDemo: vi.fn(),
};

const event: EventDetailDto = {
  id: 'route-event', slug: 'working-with-models', title: 'Working with models',
  shortDescription: 'Build a small classifier together.', description: 'Compare your model results.',
  category: 'workshop', eventMode: 'physical', location: 'Learning laboratory', isOnline: false,
  startAt: '2100-01-02T10:00:00.000Z', endAt: '2100-01-02T12:00:00.000Z',
  registrationOpenAt: stamp, registrationCloseAt: '2100-01-01T10:00:00.000Z',
  eligibility: 'members_only', status: 'published', capacity: 20, tags: [],
  createdAt: stamp, updatedAt: stamp, registeredCount: 0, availableSeats: 20,
  isFull: false, isRegistered: false,
};

describe('Member event route integration', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads the slug through the actual protected route instead of remaining on the loading screen', async () => {
    vi.spyOn(membershipApi, 'getMyMembership').mockResolvedValue({ success: true, data: {
      id: 'route-membership', userId: 'route-member', applicationId: 'route-application',
      memberNumber: 'AIC-ROUTE-001', status: 'active', joinedAt: stamp, activatedAt: stamp,
      createdAt: stamp, updatedAt: stamp,
    } });
    const getEvent = vi.spyOn(eventsApi, 'getMemberEventBySlug').mockResolvedValue({ success: true, data: event });
    render(
      <AuthContext.Provider value={account}>
        <MemoryRouter initialEntries={['/member/events/working-with-models']}><AppRoutes /></MemoryRouter>
      </AuthContext.Provider>
    );
    expect(await screen.findByRole('heading', { name: event.title })).toBeInTheDocument();
    expect(getEvent).toHaveBeenCalledWith('working-with-models');
    expect(screen.getByText('Learning laboratory')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register for Event' })).toBeEnabled();
    expect(screen.queryByText('Retrieving verified event schedule and attendance roster...')).not.toBeInTheDocument();
  });
});
