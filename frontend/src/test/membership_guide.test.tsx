import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MembershipGuide } from '@/components/public/MembershipGuide';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), membership: vi.fn() }));
vi.mock('@/features/auth', () => ({ useAuth: mocks.auth }));
vi.mock('@/features/membership', () => ({ useMembership: mocks.membership }));

afterEach(cleanup);
beforeEach(() => {
  mocks.auth.mockReturnValue({ isAuthenticated: false, isAdmin: false });
  mocks.membership.mockReturnValue({ isActiveMember: false, isLoading: false, error: null, refetch: vi.fn() });
});

function renderGuide(compact = false) {
  return render(<MemoryRouter><MembershipGuide compact={compact} /></MemoryRouter>);
}

describe('Public membership guidance', () => {
  it('explains verified assessment rules and separates public events from membership', () => {
    renderGuide();
    expect(screen.getByRole('heading', { name: 'Before you apply', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('25 multiple-choice questions')).toBeInTheDocument();
    expect(screen.getByText('30 minutes')).toBeInTheDocument();
    expect(screen.getByText('60% — 15 out of 25')).toBeInTheDocument();
    expect(screen.getByText('One per application')).toBeInTheDocument();
    expect(screen.getByText(/membership requires approval and activation/)).toBeInTheDocument();
    expect(screen.getByText(/Creating an account does not start the timer/)).toBeInTheDocument();
    expect(screen.getByText(/The membership assessment is separate/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create an account to apply' })).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('button', { name: /start|begin/i })).not.toBeInTheDocument();
  });

  it('provides a public preparation exercise without claiming it guarantees a pass', () => {
    renderGuide();
    expect(screen.getByRole('link', { name: 'Try a lesson first' })).toHaveAttribute('href', '/learn/first-model');
    expect(screen.getByText(/not an assessment question bank or a guarantee of passing/)).toBeInTheDocument();
  });

  it('sends an active member to their workspace instead of asking them to apply', () => {
    mocks.auth.mockReturnValue({ isAuthenticated: true, isAdmin: false, profile: { role: 'member' } });
    mocks.membership.mockReturnValue({ isActiveMember: true, isLoading: false });
    renderGuide(true);
    expect(screen.getByRole('link', { name: 'Open member workspace' })).toHaveAttribute('href', '/member/dashboard');
    expect(screen.queryByRole('link', { name: 'Create an account to apply' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read the joining guide' })).toHaveAttribute('href', '/join');
  });

  it('uses authoritative membership rather than profile role when directing an account holder', () => {
    mocks.auth.mockReturnValue({ isAuthenticated: true, isAdmin: false, profile: { role: 'member' } });
    renderGuide();
    expect(screen.getByRole('link', { name: 'View your application' })).toHaveAttribute('href', '/applicant/dashboard');
    expect(screen.queryByRole('link', { name: 'Open member workspace' })).not.toBeInTheDocument();
  });

  it('waits for membership status before choosing an authenticated destination', () => {
    mocks.auth.mockReturnValue({ isAuthenticated: true, isAdmin: false });
    mocks.membership.mockReturnValue({ isActiveMember: false, isLoading: true });
    renderGuide();
    expect(screen.getByRole('status')).toHaveTextContent('Checking your membership');
    expect(screen.queryByRole('link', { name: 'View your application' })).not.toBeInTheDocument();
  });

  it('directs the authorized admin to the admin workspace', () => {
    mocks.auth.mockReturnValue({ isAuthenticated: true, isAdmin: true });
    renderGuide();
    expect(screen.getByRole('link', { name: 'Open admin workspace' })).toHaveAttribute('href', '/admin');
  });
});
