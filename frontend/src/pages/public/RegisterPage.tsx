import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { clearEventReturn, eventAuthUrl, rememberEventReturn, resolveEventReturn } from '@/features/auth/authReturn';

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [eventReturn] = useState(() => resolveEventReturn(location.search, location.state, false));
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length > 100) {
      newErrors.fullName = 'Full name must be under 100 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    if (eventReturn) rememberEventReturn(eventReturn);
    let result;
    try {
      result = await signUp(email.trim(), password, fullName.trim(), undefined, eventReturn || undefined);
    } catch {
      setGeneralError('We could not create your account. Please try again.');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

    if (!result.success) {
      setGeneralError(result.error || 'Failed to register account');
      return;
    }

    if (result.requiresEmailVerification || result.hasSession === false) {
      setVerificationEmail(email.trim());
      return;
    }
    if (eventReturn) clearEventReturn();
    navigate(eventReturn || '/applicant/dashboard', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <Card className="shadow-elevated border-surface-border">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold tracking-tight">{verificationEmail ? 'Check your email' : 'Create an AI Club account'}</CardTitle>
            <CardDescription>
              {verificationEmail ? `A confirmation step is required for ${verificationEmail}. Open the verification link in your email, then sign in.` : eventReturn ? 'Create an account, then return to the event to review RSVP eligibility. Public events do not require the membership assessment.' : 'Start your membership application. You can review the next steps before choosing to begin the assessment.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {generalError && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-cardSm bg-red-50 border border-red-200 text-xs text-red-800 font-medium"
              >
                {generalError}
              </div>
            )}

            {verificationEmail ? <div className="space-y-5 text-sm text-ink-secondary"><p>{eventReturn ? 'Your event destination is saved. After verification, return to the event and choose RSVP to reserve your place.' : 'After verification, sign in to review your membership application steps.'}</p><p>Creating an account does not reserve an event place or start a timed assessment.</p><Link to={eventAuthUrl('login', eventReturn)} className="inline-flex min-h-11 items-center rounded-pill bg-ink text-canvas px-5 py-2.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">Continue to sign in</Link></div> : <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Full Name"
                placeholder="Ada Lovelace"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                autoComplete="name"
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="ada@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="new-password"
                helperText="Must be at least 6 characters"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
                required
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  className="w-full shadow-subtle"
                  isLoading={isSubmitting}
                >
                  Create account
                </Button>
              </div>
            </form>}
          </CardContent>

          <CardFooter className="justify-center text-xs text-ink-muted">
            Already have an account?{' '}
            <Link to={eventAuthUrl('login', eventReturn)} className="ml-1 text-ink font-semibold hover:underline underline-offset-4">
              Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
