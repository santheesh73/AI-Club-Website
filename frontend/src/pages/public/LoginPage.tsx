import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Invalid credentials');
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <Card className="shadow-elevated border-surface-border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2">
              <Badge variant="neutral">Member Gateway</Badge>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Sign In to AI CLUB</CardTitle>
            <CardDescription>
              Access your student identity, applications, and innovation portal.
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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="ada@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-sm font-medium text-ink">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-ink-muted hover:text-ink hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  className="w-full shadow-subtle"
                  isLoading={isSubmitting}
                >
                  Sign In
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="justify-center text-xs text-ink-muted">
            Don't have an account yet?{' '}
            <Link to="/register" className="ml-1 text-ink font-semibold hover:underline">
              Create Account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
