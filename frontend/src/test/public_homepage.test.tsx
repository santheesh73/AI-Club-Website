import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '@/pages/public/LandingPage';
import { communityApi } from '@/services/communityApi';
import { eventsApi } from '@/services/eventsApi';
import type { PublicEventDto } from '@/types/events';

const auth = vi.hoisted(() => ({ account: { isAuthenticated: false, isAdmin: false, profile: null as null | { role: string } } }));
vi.mock('@/features/auth', () => ({ useAuth: () => auth.account }));
vi.mock('@/components/public/MembershipGuide', () => ({ MembershipGuide: () => <section>Joining guide</section> }));

const exampleEvent = (eligibility: PublicEventDto['eligibility'], slug: string): PublicEventDto => ({
  id: slug, slug, title: slug === 'public-workshop' ? 'A public workshop' : 'A member workshop',
  shortDescription: 'A published event', description: 'Event description', category: 'workshop',
  eventMode: 'physical', location: 'Campus', isOnline: false, startAt: '2100-01-02T10:00:00Z',
  endAt: '2100-01-02T12:00:00Z', registrationOpenAt: '2020-01-01T00:00:00Z',
  registrationCloseAt: '2100-01-01T00:00:00Z', eligibility, status: 'published', tags: [],
  capacity: 20, availableSeats: 20, isFull: false,
});

describe('Public homepage evidence and first action', () => {
  beforeEach(() => {
    auth.account = { isAuthenticated: false, isAdmin: false, profile: null };
    vi.spyOn(communityApi, 'getProjects').mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, pageSize: 3, totalPages: 0 } });
    vi.spyOn(eventsApi, 'getPublicEvents').mockResolvedValue({ success: true, data: [] });
  });
  afterEach(() => vi.restoreAllMocks());

  it('offers a working experiment while keeping empty club records honest and compact', async () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Try the first lesson' })).toHaveAttribute('href', '/learn/first-model');
    expect(screen.getByRole('link', { name: 'How to join' })).toHaveAttribute('href', '/join');
    expect(screen.getByRole('slider', { name: 'Move the decision boundary' })).toBeInTheDocument();
    expect(await screen.findByText(/No public projects have been published yet/)).toBeInTheDocument();
    expect(await screen.findByText(/No upcoming events are listed right now/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'See what members are building' })).not.toBeInTheDocument();
  });

  it('labels a members-only preview correctly rather than reporting all activity absent', async () => {
    vi.mocked(eventsApi.getPublicEvents).mockResolvedValue({ success: true, data: [exampleEvent('members_only', 'member-workshop')] });
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(await screen.findByText('Members-only event · Active membership required')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View event details' })).toHaveAttribute('href', '/events/member-workshop');
    expect(screen.queryByText(/No upcoming events/)).not.toBeInTheDocument();
  });

  it('prefers an available public event over a members-only preview', async () => {
    vi.mocked(eventsApi.getPublicEvents).mockResolvedValue({ success: true, data: [exampleEvent('members_only', 'member-workshop'), exampleEvent('public', 'public-workshop')] });
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'A public workshop' })).toBeInTheDocument();
    expect(screen.getByText('Public event · An account is enough to RSVP')).toBeInTheDocument();
  });

  it('distinguishes failed requests from empty content and recovers through retry', async () => {
    vi.mocked(communityApi.getProjects).mockResolvedValueOnce({ success: false, error: { code: 'UNAVAILABLE', message: 'Unavailable' } });
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load the projects");
    expect(screen.queryByText(/No public projects have been published yet/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry projects' }));
    expect(await screen.findByText(/No public projects have been published yet/)).toBeInTheDocument();
  });

  it('gives existing account holders a workspace action instead of another application prompt', () => {
    auth.account = { isAuthenticated: true, isAdmin: false, profile: { role: 'member' } };
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Open my workspace' })).toHaveAttribute('href', '/member');
    expect(screen.queryByRole('link', { name: 'How to join' })).not.toBeInTheDocument();
  });
});
