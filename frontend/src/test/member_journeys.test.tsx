import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { MemberDashboard } from '@/pages/member/MemberDashboard';
import { ApplicantDashboard } from '@/pages/applicant/ApplicantDashboard';

const mocks = vi.hoisted(() => ({
  application: vi.fn(), createApplication: vi.fn(), learning: vi.fn(), events: vi.fn(), dashboard: vi.fn(),
}));
vi.mock('@/features/auth', () => ({ useAuth: () => ({ profile: { fullName: 'Club Student', role: 'member' }, isAuthenticated: true, isAdmin: false, signOut: vi.fn() }) }));
vi.mock('@/features/membership', () => ({ useMemberDashboard: mocks.dashboard, useMembership: () => ({ membership: { memberNumber: 'AIC-2026-0042' } }) }));
vi.mock('@/features/events', () => ({ useRegisteredEvents: mocks.events }));
vi.mock('@/features/courses', () => ({ useMyCourses: mocks.learning, ProgressBar: () => <div /> }));
vi.mock('@/features/dashboard', () => ({ DashboardFlashcard: () => <div /> }));
vi.mock('@/features/notifications', () => ({ NotificationBell: () => <span /> }));
vi.mock('@/features/applications', () => ({ useApplication: mocks.application, ApplicationCard: () => <p>Application status</p>, ApplicationTimeline: () => <p>Application timeline</p> }));

describe('Member and applicant journeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createApplication.mockResolvedValue({ success: false, error: 'Application service unavailable' });
    mocks.application.mockReturnValue({ application: null, statusData: { hasApplication: false }, isLoading: false, error: null, createApplication: mocks.createApplication, refreshStatus: vi.fn() });
    mocks.learning.mockReturnValue({ stats: null, isLoading: false, error: null, refetch: vi.fn() });
    mocks.events.mockReturnValue({ upcoming: [], isLoading: false, error: null, refetch: vi.fn() });
    mocks.dashboard.mockReturnValue({ isLoading: false, error: null, refetch: vi.fn(), data: { profile: { fullName: 'Club Student' }, membership: { status: 'active', memberNumber: 'AIC-2026-0042' }, application: { applicationNumber: 'AIC-2026-000042' }, assessment: null } });
  });

  it('does not start an application until the applicant confirms readiness and chooses to begin', async () => {
    render(<MemoryRouter><ApplicantDashboard /></MemoryRouter>);
    const start = screen.getByRole('button', { name: 'Start membership assessment' });
    expect(start).toBeDisabled();
    expect(mocks.createApplication).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Explore public events' })).toHaveAttribute('href', '/events');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(start);
    expect(mocks.createApplication).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('alert')).toHaveTextContent('Application service unavailable');
  });

  it('offers the resumable lesson as the main next action and uses the correct My courses route', () => {
    mocks.learning.mockReturnValue({ stats: { enrolledCount: 1, completedCount: 0, continueLearning: { lessonTitle: 'Build a classifier', courseTitle: 'Learning Python', courseSlug: 'python', lessonSlug: 'classifier', progressPercentage: 25 } }, isLoading: false, error: null });
    render(<MemoryRouter><MemberDashboard /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Continue learning' })).toHaveAttribute('href', '/member/learn/python?lesson=classifier');
    expect(screen.getByRole('link', { name: 'My courses' })).toHaveAttribute('href', '/member/my-courses');
  });

  it('distinguishes unavailable event data from no upcoming registrations', () => {
    mocks.events.mockReturnValue({ upcoming: [], isLoading: false, error: 'Events unavailable', refetch: vi.fn() });
    render(<MemoryRouter><MemberDashboard /></MemoryRouter>);
    expect(screen.getByRole('alert')).toHaveTextContent('Events unavailable');
    expect(screen.queryByText("You haven't registered for an upcoming event.")).not.toBeInTheDocument();
  });

  it('provides mobile member destinations and closes the menu with Escape, restoring focus', () => {
    render(<MemoryRouter><MemberLayout /></MemoryRouter>);
    const toggle = screen.getByRole('button', { name: 'Open member menu' });
    fireEvent.click(toggle);
    const menu = screen.getByRole('navigation', { name: 'Mobile member workspace' });
    const eventLink = within(menu).getByRole('link', { name: 'Events' });
    expect(eventLink).toHaveAttribute('href', '/member/events');
    eventLink.focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'Mobile member workspace' })).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });
});
