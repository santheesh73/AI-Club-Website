import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/features/auth';

const mocks = vi.hoisted(() => ({ signUp: vi.fn(), post: vi.fn(), signInWithPassword: vi.fn() }));
vi.mock('@/lib/env', () => ({ env: { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'test-key' } }));
vi.mock('@/services/apiClient', () => ({ apiClient: { post: mocks.post } }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
  signUp: mocks.signUp,
  signInWithPassword: mocks.signInWithPassword,
} } }));

function Signup({ returnTo }: { returnTo: string }) {
  const { signUp, isAuthenticated } = useAuth();
  const [result, setResult] = useState<{ success: boolean; hasSession?: boolean; requiresEmailVerification?: boolean } | null>(null);
  return <div><p>{isAuthenticated ? 'Signed in' : 'Signed out'}</p><button onClick={async () => setResult(await signUp('ada@example.com', 'safe-password', 'Ada', undefined, returnTo))}>Create test account</button>{result && <p>{result.requiresEmailVerification && !result.hasSession ? 'Verification required' : result.success ? 'Account session ready' : 'No active session'}</p>}</div>;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.post.mockResolvedValue({ success: false, error: { code: 'NETWORK_ERROR', message: 'Offline' } });
  mocks.signUp.mockResolvedValue({ data: { user: { id: 'user-1', email: 'ada@example.com' }, session: null }, error: null });
});

describe('Signup session and email verification contract', () => {
  it.each([
    ['/events/public-workshop', '/login?returnTo=%2Fevents%2Fpublic-workshop'],
    ['https://evil.example', '/login'],
  ])('keeps a confirmation-only signup signed out and validates the verification destination %s', async (returnTo, expectedPath) => {
    render(<AuthProvider><Signup returnTo={returnTo} /></AuthProvider>);
    fireEvent.click(screen.getByRole('button', { name: /create test account/i }));
    expect(await screen.findByText('Verification required')).toBeInTheDocument();
    expect(screen.getByText('Signed out')).toBeInTheDocument();
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({ options: expect.objectContaining({ emailRedirectTo: window.location.origin + expectedPath }) }));
  });

  it('does not claim an account session exists when backend signup produces no sign-in session', async () => {
    mocks.post.mockResolvedValue({ success: true, data: { userId: 'user-1', email: 'ada@example.com', role: 'applicant' } });
    mocks.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: null });
    render(<AuthProvider><Signup returnTo="/events/public-workshop" /></AuthProvider>);
    fireEvent.click(screen.getByRole('button', { name: /create test account/i }));
    expect(await screen.findByText('No active session')).toBeInTheDocument();
    expect(screen.getByText('Signed out')).toBeInTheDocument();
  });
});
