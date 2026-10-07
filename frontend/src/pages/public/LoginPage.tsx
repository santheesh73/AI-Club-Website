import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, ShieldCheck, GraduationCap, FileText, ArrowRight, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<'admin' | 'member' | 'applicant' | null>(null);

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

  const handleDemoLogin = async (role: 'admin' | 'member' | 'applicant' = 'admin') => {
    setError(null);
    setActiveDemoRole(role);
    setIsDemoSubmitting(true);

    try {
      if (loginAsDemo) {
        const result = await loginAsDemo(role);
        if (!result.success) {
          setError(result.error || 'Failed to initialize demo session');
          setIsDemoSubmitting(false);
          return;
        }
      }

      // Redirect to target workspace based on selected role
      const destination =
        from && from !== '/profile'
          ? from
          : role === 'admin'
          ? '/admin'
          : role === 'member'
          ? '/member'
          : '/applicant';

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login error');
    } finally {
      setIsDemoSubmitting(false);
      setActiveDemoRole(null);
    }
  };

  const handleFillCredentials = (role: 'admin' | 'member' | 'applicant') => {
    if (role === 'admin') {
      setEmail('admin@aiclub.internal');
      setPassword('password123');
    } else if (role === 'member') {
      setEmail('member@aiclub.internal');
      setPassword('password123');
    } else {
      setEmail('applicant@aiclub.internal');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-lg">
        <Card className="shadow-elevated border-surface-border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 flex items-center justify-center gap-2">
              <Badge variant="neutral">Member Gateway</Badge>
              <Badge variant="lavender" className="hidden sm:inline-flex">Demo Ready</Badge>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Sign In to AI CLUB</CardTitle>
            <CardDescription>
              Access your student identity, applications, and innovation portal.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div
                role="alert"
                className="p-4 rounded-cardSm bg-red-50 border border-red-200 text-xs text-red-800 font-medium"
              >
                {error}
              </div>
            )}

            {/* Instant Demo Access Showcase */}
            <div className="rounded-card border border-amber-300/60 bg-gradient-to-br from-amber-50/70 via-canvas to-amber-50/30 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold tracking-wide uppercase text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  Instant Demo Showcase
                </span>
                <span className="text-[11px] text-ink-muted">No credentials required</span>
              </div>

              <p className="text-xs text-ink-muted mb-3.5 leading-relaxed">
                Experience all platform features instantly with pre-provisioned roles:
              </p>

              {/* Primary One-Click Demo Button (Admin - All Functions) */}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleDemoLogin('admin')}
                isLoading={isDemoSubmitting && activeDemoRole === 'admin'}
                disabled={isDemoSubmitting}
                className="w-full bg-ink hover:bg-ink-secondary text-canvas flex items-center justify-center gap-2 shadow-sm font-semibold"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>One-Click Demo Login (Admin — All Functions)</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
              </Button>

              {/* Secondary Role Switchers */}
              <div className="mt-3 pt-3 border-t border-amber-200/60 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('member')}
                  isLoading={isDemoSubmitting && activeDemoRole === 'member'}
                  disabled={isDemoSubmitting}
                  className="bg-white/80 hover:bg-white text-xs border-amber-200 text-ink flex items-center justify-center gap-1.5"
                  title="Explore Member Dashboard, Digital ID Card, Courses, Projects & AI Assistant"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Demo Member</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('applicant')}
                  isLoading={isDemoSubmitting && activeDemoRole === 'applicant'}
                  disabled={isDemoSubmitting}
                  className="bg-white/80 hover:bg-white text-xs border-amber-200 text-ink flex items-center justify-center gap-1.5"
                  title="Explore Applicant Intake & 25-MCQ Timed Assessment"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>Demo Applicant</span>
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-surface-border w-full" />
              <span className="bg-canvas px-3 text-[11px] uppercase tracking-wider text-ink-muted font-medium absolute">
                Or sign in with email
              </span>
            </div>

            {/* Standard Email/Password Form */}
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

              <div className="flex items-center justify-between pt-1 text-xs text-ink-muted">
                <span>Auto-fill sample credentials:</span>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('admin')}
                  className="inline-flex items-center gap-1 text-ink hover:text-ink-secondary font-medium hover:underline"
                >
                  <KeyRound className="w-3 h-3 text-amber-600" />
                  admin@aiclub.internal
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  className="w-full shadow-subtle"
                  isLoading={isSubmitting}
                  disabled={isDemoSubmitting}
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
