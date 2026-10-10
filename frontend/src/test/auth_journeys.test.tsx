import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import type { UserProfile } from '@/types/user';

const auth = vi.hoisted(() => ({
  isAuthenticated: false, isLoading: false, profile: null as UserProfile | null,
  signIn: vi.fn(), signUp: vi.fn(), loginAsDemo: vi.fn(),
}));

vi.mock('@/features/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/features/auth')>(), useAuth: () => auth,
}));

const profile = (role: UserProfile['role'], email = 'ada@example.com'): UserProfile => ({
  id: 'account-1', role, email, fullName: 'Ada Lovelace', skills: [], interests: [],
  createdAt: '2026-10-09T00:00:00Z', updatedAt: '2026-10-09T00:00:00Z',
});

function Destination() {
  return <p>Destination: {useLocation().pathname}</p>;
}

function renderAuth(path = '/login', state?: unknown) {
  return render(<MemoryRouter initialEntries={[{ pathname: path.split('?')[0], search: path.includes('?') ? `?${path.split('?')[1]}` : '', state }]}><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="*" element={<Destination />} />
  </Routes></MemoryRouter>);
}

function signIn(email = 'ada@example.com') {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'my-real-password' } });
  fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  auth.isAuthenticated = false;
  auth.isLoading = false;
  auth.profile = null;
  auth.signIn.mockResolvedValue({ success: true, profile: profile('applicant') });
});

describe('One account sign-in', () => {
  it('authenticates a real member with credentials instead of launching a demo', async () => {
    auth.signIn.mockResolvedValue({ success: true, profile: profile('member') });
    renderAuth();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign in to AI Club');
    expect(screen.queryByRole('button', { name: /^member$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
    signIn(' ada@example.com ');
    expect(await screen.findByText('Destination: /member/dashboard')).toBeInTheDocument();
    expect(auth.signIn).toHaveBeenCalledWith('ada@example.com', 'my-real-password');
    expect(auth.loginAsDemo).not.toHaveBeenCalled();
  });

  it.each([
    ['admin', 'santheesh651@gmail.com', '/admin'],
    ['applicant', 'santheesh651@gmail.com', '/applicant/dashboard'],
    ['admin', 'other-admin@example.com', '/applicant/dashboard'],
  ] as const)('requires the authorized identity and admin role (%s, %s)', async (role, email, destination) => {
    auth.signIn.mockResolvedValue({ success: true, profile: profile(role, email) });
    renderAuth();
    signIn(email);
    expect(await screen.findByText(`Destination: ${destination}`)).toBeInTheDocument();
  });

  it('gives a selected public event priority over an admin dashboard', async () => {
    auth.signIn.mockResolvedValue({ success: true, profile: profile('admin', 'santheesh651@gmail.com') });
    renderAuth('/login?returnTo=%2Fevents%2Fpublic-workshop');
    signIn();
    expect(await screen.findByText('Destination: /events/public-workshop')).toBeInTheDocument();
  });

  it('retains a safe member portal destination for a member', async () => {
    auth.signIn.mockResolvedValue({ success: true, profile: profile('member') });
    renderAuth('/login', { from: { pathname: '/member/my-courses' } });
    signIn();
    expect(await screen.findByText('Destination: /member/my-courses')).toBeInTheDocument();
  });

  it('does not send an applicant into a requested admin portal', async () => {
    renderAuth('/login', { from: { pathname: '/admin/events' } });
    signIn();
    expect(await screen.findByText('Destination: /applicant/dashboard')).toBeInTheDocument();
  });

  it('redirects an already authenticated member without submitting credentials', async () => {
    auth.isAuthenticated = true;
    auth.profile = profile('member');
    renderAuth();
    expect(await screen.findByText('Destination: /member/dashboard')).toBeInTheDocument();
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it('focuses a failed sign-in message and offers recovery', async () => {
    auth.signIn.mockResolvedValue({ success: false, error: 'Check your email and password.' });
    renderAuth();
    signIn();
    const error = await screen.findByRole('alert');
    await waitFor(() => expect(error).toHaveFocus());
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
  });
});

describe('Account creation recovery and session handling', () => {
  it('announces blank registration errors and focuses the first invalid field', () => {
    renderAuth('/register');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create an AI Club account');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    const first = screen.getByLabelText(/full name/i);
    expect(screen.getByRole('alert')).toHaveTextContent('Check the 4 highlighted fields');
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute('aria-invalid', 'true');
    expect(first).toHaveAttribute('aria-describedby', 'register-full-name-error');
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('focuses password confirmation when it is the only invalid field', () => {
    renderAuth('/register');
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ada Lovelace' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'safe-password' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different-password' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByLabelText(/confirm password/i)).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Check the highlighted field');
  });

  it.each([
    ['member', 'ada@example.com', '/member/dashboard'],
    ['applicant', 'ada@example.com', '/applicant/dashboard'],
    ['admin', 'santheesh651@gmail.com', '/admin'],
    ['applicant', 'santheesh651@gmail.com', '/applicant/dashboard'],
  ] as const)('protects authenticated accounts from duplicate signup (%s)', async (role, email, destination) => {
    auth.isAuthenticated = true;
    auth.profile = profile(role, email);
    renderAuth('/register');
    expect(await screen.findByText(`Destination: ${destination}`)).toBeInTheDocument();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('takes an authenticated signup visit back to its selected event', async () => {
    auth.isAuthenticated = true;
    auth.profile = profile('member');
    renderAuth('/register?returnTo=%2Fevents%2Fpublic-workshop');
    expect(await screen.findByText('Destination: /events/public-workshop')).toBeInTheDocument();
    expect(auth.signUp).not.toHaveBeenCalled();
  });
});
