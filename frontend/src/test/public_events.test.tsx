import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { EventsPage } from '@/pages/public/EventsPage';
import { PublicEventDetailPage } from '@/pages/public/PublicEventDetailPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { eventsApi } from '@/services/eventsApi';
import { readRememberedEventReturn } from '@/features/auth/authReturn';
import type { EventRegistrationRecord, PublicEventDto } from '@/types/events';

const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  isAdmin: false,
  user: null as { id: string } | null,
  profile: null as { role: string } | null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  loginAsDemo: vi.fn(),
}));

vi.mock('@/features/auth', () => ({ useAuth: () => auth, AUTHORIZED_ADMIN_EMAIL: 'admin@example.com', isAuthorizedAdmin: (email: string | undefined, role: string | undefined) => email === 'admin@example.com' && role === 'admin' }));
vi.mock('@/services/eventsApi', () => ({ eventsApi: {
  getPublicEvents: vi.fn(),
  getPublicEventBySlug: vi.fn(),
  getPublicEventRegistration: vi.fn(),
  registerForPublicEvent: vi.fn(),
  cancelPublicEventRegistration: vi.fn(),
} }));

const event: PublicEventDto = {
  id: 'event-1', slug: 'public-workshop', title: 'Public workshop',
  shortDescription: 'An approved public session.', description: 'Workshop details supplied by the organizer.',
  category: 'workshop', eventMode: 'physical', location: 'Main hall', isOnline: false,
  startAt: '2099-11-15T10:00:00Z', endAt: '2099-11-15T12:00:00Z',
  registrationOpenAt: '2020-01-01T00:00:00Z', registrationCloseAt: '2099-11-14T23:59:59Z',
  eligibility: 'public', status: 'published', capacity: 10, availableSeats: 5, isFull: false, tags: [],
};

const record: EventRegistrationRecord = {
  id: 'registration-1', eventId: event.id, userId: 'applicant-1', status: 'registered',
  registeredAt: '2026-10-08T10:00:00Z', createdAt: '2026-10-08T10:00:00Z', updatedAt: '2026-10-08T10:00:00Z',
};

function Destination() {
  const location = useLocation();
  return <p>Destination: {location.pathname}</p>;
}

function renderFlow(path = '/events/public-workshop') {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/events" element={<EventsPage />} />
    <Route path="/events/:slug" element={<PublicEventDetailPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="*" element={<Destination />} />
  </Routes></MemoryRouter>);
}

function authenticateApplicant() {
  auth.isAuthenticated = true;
  auth.user = { id: record.userId };
  auth.profile = { role: 'applicant' };
}

function fillSignup() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ada Lovelace' } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ada@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'safe-password' } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'safe-password' } });
  fireEvent.click(screen.getByRole('button', { name: /create account/i }));
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  auth.isAuthenticated = false;
  auth.isLoading = false;
  auth.isAdmin = false;
  auth.user = null;
  auth.profile = null;
  vi.mocked(eventsApi.getPublicEvents).mockResolvedValue({ success: true, data: [event] });
  vi.mocked(eventsApi.getPublicEventBySlug).mockResolvedValue({ success: true, data: event });
  vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValue({ success: true, data: { isRegistered: false, registration: null, meetingUrl: null } });
  vi.mocked(eventsApi.registerForPublicEvent).mockImplementation(async () => {
    vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValue({ success: true, data: { isRegistered: true, registration: record, meetingUrl: null } });
    return { success: true, data: record };
  });
  vi.mocked(eventsApi.cancelPublicEventRegistration).mockImplementation(async () => {
    const cancelledRecord: EventRegistrationRecord = { ...record, status: 'cancelled' };
    vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValue({ success: true, data: { isRegistered: false, registration: cancelledRecord, meetingUrl: null } });
    return { success: true, data: cancelledRecord };
  });
  auth.signIn.mockImplementation(async () => {
    authenticateApplicant();
    return { success: true, profile: auth.profile };
  });
  auth.signUp.mockImplementation(async () => {
    authenticateApplicant();
    return { success: true, hasSession: true };
  });
});

describe('Public event discovery and RSVP', () => {
  it('distinguishes a failed calendar from an empty calendar and supports retry', async () => {
    vi.mocked(eventsApi.getPublicEvents).mockResolvedValueOnce({ success: false, error: { code: 'NETWORK_ERROR', message: 'Offline' } });
    renderFlow('/events');
    expect(screen.getByRole('status')).toHaveTextContent('Loading events');
    expect(await screen.findByRole('alert')).toHaveTextContent('could not load');
    expect(screen.queryByText(/No upcoming events/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry loading events/i }));
    expect(await screen.findByRole('heading', { name: event.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view event/i })).toHaveAttribute('href', '/events/public-workshop');
  });

  it('uses an honest empty state after a successful response', async () => {
    vi.mocked(eventsApi.getPublicEvents).mockResolvedValue({ success: true, data: [] });
    renderFlow('/events');
    expect(await screen.findByText('No upcoming events yet')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects a legacy or malformed date contract instead of presenting an invalid event', async () => {
    vi.mocked(eventsApi.getPublicEvents).mockResolvedValue({ success: true, data: [{ ...event, startAt: 'invalid' }] });
    renderFlow('/events');
    expect(await screen.findByRole('alert')).toHaveTextContent('incomplete information');
    expect(screen.queryByRole('link', { name: /view event/i })).not.toBeInTheDocument();
  });

  it('requires a separate explicit RSVP after sign in and keeps the event return in signup links', async () => {
    renderFlow();
    fireEvent.click(await screen.findByRole('link', { name: /sign in to rsvp/i }));
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/register?returnTo=%2Fevents%2Fpublic-workshop');
    expect(screen.queryByText(/Quick Demo Access/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'safe-password' } });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    const rsvp = await screen.findByRole('button', { name: /rsvp to this event/i });
    expect(eventsApi.registerForPublicEvent).not.toHaveBeenCalled();
    fireEvent.click(rsvp);
    expect(await screen.findByText('Your RSVP is confirmed.')).toBeInTheDocument();
    expect(eventsApi.registerForPublicEvent).toHaveBeenCalledWith(event.id);
  });

  it('lets a registered applicant see persisted status and cancel without member routes', async () => {
    authenticateApplicant();
    vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValue({ success: true, data: { isRegistered: true, registration: record, meetingUrl: null } });
    renderFlow();
    fireEvent.click(await screen.findByRole('button', { name: /cancel my rsvp/i }));
    expect(await screen.findByText('Your RSVP has been cancelled.')).toBeInTheDocument();
    expect(eventsApi.cancelPublicEventRegistration).toHaveBeenCalledWith(event.id);
    expect(await screen.findByRole('button', { name: /rsvp to this event/i })).toBeInTheDocument();
  });

  it('shows a membership application action and no RSVP for an applicant at a members-only event', async () => {
    authenticateApplicant();
    vi.mocked(eventsApi.getPublicEventBySlug).mockResolvedValue({ success: true, data: { ...event, eligibility: 'members_only' } });
    renderFlow();
    expect(await screen.findByRole('link', { name: /apply to join/i })).toHaveAttribute('href', '/applicant/dashboard');
    expect(screen.queryByRole('button', { name: /rsvp to this event/i })).not.toBeInTheDocument();
    expect(eventsApi.registerForPublicEvent).not.toHaveBeenCalled();
  });

  it.each([
    [{ isFull: true, availableSeats: 0 }, /event is full/i],
    [{ registrationOpenAt: '2099-11-01T00:00:00Z' }, /registration opens/i],
    [{ registrationCloseAt: '2020-02-01T00:00:00Z' }, /registration is closed/i],
    [{ status: 'cancelled' }, /event has been cancelled/i],
  ])('explains registration availability without offering an invalid RSVP (%j)', async (fields, message) => {
    authenticateApplicant();
    vi.mocked(eventsApi.getPublicEventBySlug).mockResolvedValue({ success: true, data: { ...event, ...fields } as PublicEventDto });
    renderFlow();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rsvp to this event/i })).not.toBeInTheDocument();
  });

  it('allows an existing attendee to cancel even when the event is full', async () => {
    authenticateApplicant();
    vi.mocked(eventsApi.getPublicEventBySlug).mockResolvedValue({ success: true, data: { ...event, isFull: true, availableSeats: 0 } });
    vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValue({ success: true, data: { isRegistered: true, registration: record, meetingUrl: null } });
    renderFlow();
    expect(await screen.findByRole('button', { name: /cancel my rsvp/i })).toBeEnabled();
  });

  it('reveals the online attendance link only through an attendee\'s authenticated status', async () => {
    authenticateApplicant();
    vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValue({ success: true, data: { isRegistered: true, registration: record, meetingUrl: 'https://meet.example.com/public-workshop' } });
    renderFlow();
    const join = await screen.findByRole('link', { name: /join online event/i });
    expect(join).toHaveAttribute('href', 'https://meet.example.com/public-workshop');
    expect(join).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not turn a dangerous meeting URL into an attendance link', async () => {
    authenticateApplicant();
    vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValue({ success: true, data: { isRegistered: true, registration: record, meetingUrl: 'javascript:alert(1)' } });
    renderFlow();
    await screen.findByRole('button', { name: /cancel my rsvp/i });
    expect(screen.queryByRole('link', { name: /join online event/i })).not.toBeInTheDocument();
  });

  it('explains the cancellation cutoff after an event starts', async () => {
    authenticateApplicant();
    vi.mocked(eventsApi.getPublicEventBySlug).mockResolvedValue({ success: true, data: { ...event, startAt: '2020-01-02T10:00:00Z', endAt: '2020-01-02T12:00:00Z', registrationCloseAt: '2020-01-02T09:00:00Z' } });
    vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValue({ success: true, data: { isRegistered: true, registration: record, meetingUrl: null } });
    renderFlow();
    expect(await screen.findByText(/cancellation window has closed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel my rsvp/i })).not.toBeInTheDocument();
  });

  it('does not offer RSVP when status failed or belongs to another account', async () => {
    authenticateApplicant();
    vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValueOnce({ success: false, error: { code: 'UNAVAILABLE', message: 'Offline' } });
    renderFlow();
    expect(await screen.findByRole('alert')).toHaveTextContent('could not check your RSVP');
    expect(screen.queryByRole('button', { name: /rsvp to this event/i })).not.toBeInTheDocument();
    vi.mocked(eventsApi.getPublicEventRegistration).mockResolvedValue({ success: true, data: { isRegistered: true, registration: { ...record, userId: 'another-user' }, meetingUrl: null } });
    fireEvent.click(screen.getByRole('button', { name: /retry rsvp status/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('incomplete information');
    expect(screen.queryByRole('button', { name: /cancel my rsvp/i })).not.toBeInTheDocument();
  });

  it('does not claim RSVP success after a failed mutation', async () => {
    authenticateApplicant();
    vi.mocked(eventsApi.registerForPublicEvent).mockResolvedValue({ success: false, error: { code: 'EVENT_FULL', message: 'The event is now full.' } });
    renderFlow();
    fireEvent.click(await screen.findByRole('button', { name: /rsvp to this event/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The event is now full.');
    expect(screen.queryByText('Your RSVP is confirmed.')).not.toBeInTheDocument();
  });
});

describe('Signup journey separation', () => {
  it('returns event signup to the event without starting an assessment or making an RSVP', async () => {
    renderFlow('/register?returnTo=%2Fevents%2Fpublic-workshop');
    fillSignup();
    expect(await screen.findByRole('button', { name: /rsvp to this event/i })).toBeInTheDocument();
    expect(eventsApi.registerForPublicEvent).not.toHaveBeenCalled();
    expect(auth.signUp).toHaveBeenCalledWith('ada@example.com', 'safe-password', 'Ada Lovelace', undefined, '/events/public-workshop');
  });

  it('sends normal membership signup to preparation', async () => {
    localStorage.setItem('ai_club_event_return', JSON.stringify({ path: '/events/public-workshop', savedAt: Date.now() }));
    renderFlow('/register');
    fillSignup();
    expect(await screen.findByText('Destination: /applicant/dashboard')).toBeInTheDocument();
  });

  it('explains email verification and preserves the event through the subsequent login', async () => {
    auth.signUp.mockResolvedValue({ success: true, hasSession: false, requiresEmailVerification: true });
    renderFlow('/register?returnTo=%2Fevents%2Fpublic-workshop');
    fillSignup();
    expect(await screen.findByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByText(/confirmation step is required for ada@example.com/i)).toBeInTheDocument();
    expect(readRememberedEventReturn()).toBe('/events/public-workshop');
    expect(screen.getByRole('link', { name: /continue to sign in/i })).toHaveAttribute('href', '/login?returnTo=%2Fevents%2Fpublic-workshop');
    expect(eventsApi.registerForPublicEvent).not.toHaveBeenCalled();
  });

  it('rejects an external auth return and uses the role destination', async () => {
    renderFlow('/login?returnTo=https%3A%2F%2Fevil.example');
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'safe-password' } });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByText('Destination: /applicant/dashboard')).toBeInTheDocument());
  });

  it('returns an email-verification session to its saved event without reserving a place', async () => {
    authenticateApplicant();
    localStorage.setItem('ai_club_event_return', JSON.stringify({ path: '/events/public-workshop', savedAt: Date.now() }));
    renderFlow('/login');
    expect(await screen.findByRole('button', { name: /rsvp to this event/i })).toBeInTheDocument();
    expect(auth.signIn).not.toHaveBeenCalled();
    expect(eventsApi.registerForPublicEvent).not.toHaveBeenCalled();
  });
});
