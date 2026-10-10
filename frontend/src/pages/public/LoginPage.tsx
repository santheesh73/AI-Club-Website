import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAuthorizedAdmin, useAuth } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { clearEventReturn, eventAuthUrl, rememberEventReturn, resolveEventReturn, validatePortalReturn } from '@/features/auth/authReturn';
import type { UserProfile } from '@/types/user';

function accountDestination(profile: UserProfile | null | undefined, from: string | null): string {
  const isAdmin = isAuthorizedAdmin(profile?.email, profile?.role);
  const isMember = profile?.role === 'member';
  const dashboard = isAdmin ? '/admin' : isMember ? '/member/dashboard' : '/applicant/dashboard';
  if (!from) return dashboard;
  if (from.startsWith('/admin')) return isAdmin ? from : dashboard;
  if (from.startsWith('/member')) return isMember || isAdmin ? from : dashboard;
  return from;
}

export const LoginPage: React.FC = () => {
  const { signIn, isAuthenticated, isLoading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [eventReturn] = useState(() => resolveEventReturn(location.search, location.state));
  const from = validatePortalReturn(location.state);

  useEffect(() => {
    if (eventReturn) rememberEventReturn(eventReturn);
    if (isAuthenticated && !authLoading && !isSubmitting) {
      if (eventReturn) clearEventReturn();
      navigate(eventReturn || accountDestination(profile, from), { replace: true });
    }
  }, [eventReturn, isAuthenticated, authLoading, isSubmitting, profile, from, navigate]);

  useEffect(() => {
    if (fieldErrors.email) emailRef.current?.focus();
    else if (fieldErrors.password) passwordRef.current?.focus();
    else if (error) errorRef.current?.focus();
  }, [error, fieldErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const invalid: Record<string, string> = {};
    if (!email.trim()) invalid.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) invalid.email = 'Enter a valid email address.';
    if (!password) invalid.password = 'Enter your password.';
    setFieldErrors(invalid);
    if (Object.keys(invalid).length) return;

    setIsSubmitting(true);
    try {
      const result = await signIn(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'We could not sign you in. Check your email and password, then try again.');
        return;
      }
      if (eventReturn) clearEventReturn();
      navigate(eventReturn || accountDestination(result.profile, from), { replace: true });
    } catch {
      setError('We could not sign you in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if ((authLoading && !isSubmitting) || isAuthenticated) {
    return <div role="status" className="min-h-[50vh] flex items-center justify-center p-6 text-sm text-ink-secondary">Opening your account…</div>;
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle as="h1" className="text-3xl font-bold tracking-tight">Sign in to AI Club</CardTitle>
            <CardDescription>
              {eventReturn ? 'Sign in, then return to the event and choose RSVP to reserve your place. Public events do not require the membership assessment.' : 'Use your account email and password. We’ll take you to your workspace.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div ref={errorRef} role="alert" tabIndex={-1} className="mb-6 rounded-cardSm bg-red-50 p-4 text-sm text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-800">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-busy={isSubmitting}>
              <Input ref={emailRef} id="login-email" label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} autoComplete="email" required />
              <Input ref={passwordRef} id="login-password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password} autoComplete="current-password" required />
              <Button type="submit" className="w-full min-h-11" isLoading={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Button>
              <div className="text-center"><Link to="/forgot-password" className="inline-flex min-h-11 items-center rounded px-2 text-sm text-ink-secondary underline underline-offset-4 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">Forgot password?</Link></div>
            </form>
          </CardContent>
          <CardFooter className="justify-center flex-wrap gap-x-1 text-sm text-ink-secondary">
            <span>New to the club?</span><Link to={eventAuthUrl('register', eventReturn)} className="inline-flex min-h-11 items-center rounded px-2 font-semibold text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">Create account</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
