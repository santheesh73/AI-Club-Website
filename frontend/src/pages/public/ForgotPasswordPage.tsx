import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('mode') === 'reset';
  const { resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(email);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to send recovery email');
      return;
    }

    setIsSubmitted(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to update password');
      return;
    }

    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <Card className="shadow-elevated border-surface-border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2">
              <Badge variant="neutral">Recovery</Badge>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isResetMode ? 'Set New Password' : 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {isResetMode
                ? 'Choose a new, strong password for your account.'
                : 'Enter your account email to receive a secure recovery link.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-cardSm bg-red-50 border border-red-200 text-xs text-red-800 font-medium"
              >
                {error}
              </div>
            )}

            {isSubmitted ? (
              <div className="py-4 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-green-subtle text-accent-green">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-ink">Check Your Inbox</h4>
                <p className="text-xs text-ink-muted leading-relaxed max-w-xs mx-auto">
                  If an account exists for <strong className="text-ink">{email}</strong>, we have dispatched a password recovery link.
                </p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="w-full">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : isResetMode ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Update Password
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="ada@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <div className="pt-2">
                  <Button
                    type="submit"
                    size="md"
                    className="w-full shadow-subtle"
                    isLoading={isSubmitting}
                  >
                    Send Recovery Email
                  </Button>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="justify-center text-xs text-ink-muted">
            Remembered your password?{' '}
            <Link to="/login" className="ml-1 text-ink font-semibold hover:underline">
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
