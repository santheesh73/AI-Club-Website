import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AUTHORIZED_ADMIN_EMAIL } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GraduationCap, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState<'student' | 'member' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  const handleRoleSwitch = (role: 'student' | 'member' | 'admin') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'member') {
      setEmail('alex.member@aiclub.org');
      setPassword('demo-member-2026');
    } else if (role === 'admin') {
      setEmail(AUTHORIZED_ADMIN_EMAIL);
      setPassword('');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleDemoLogin = async (demoRole: 'member' | 'applicant') => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await loginAsDemo(demoRole);
      if (result.success) {
        if (demoRole === 'member') {
          navigate('/member/dashboard', { replace: true });
        } else {
          navigate('/applicant/assessment', { replace: true });
        }
      }
    } catch {
      setError('Unable to activate demo mode. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If in Member demo mode, use direct demo login
    if (selectedRole === 'member') {
      await handleDemoLogin('member');
      return;
    }

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    const userEmail = email.trim().toLowerCase();

    // Strict client-side check if Admin mode is chosen
    if (selectedRole === 'admin' && userEmail !== AUTHORIZED_ADMIN_EMAIL) {
      setError(`ACCESS IS DENIED. U CAN'T SIGNIN THROUGH THE ADMIN GATEWAY`);
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Invalid credentials');
      return;
    }

    const isAdmin = userEmail === AUTHORIZED_ADMIN_EMAIL;
    const isMember = result.profile?.role === 'member';

    // Role-based authoritative navigation
    if (selectedRole === 'admin') {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        setError(`ACCESS IS DENIED. U CAN'T SIGNIN THROUGH THE ADMIN GATEWAY`);
      }
      return;
    }

    // Student / Member flow
    if (from && from !== '/profile') {
      if (from.startsWith('/admin')) {
        navigate(isAdmin ? from : isMember ? '/member/dashboard' : '/applicant/assessment', { replace: true });
      } else if (from.startsWith('/member')) {
        navigate(isMember || isAdmin ? from : '/applicant/assessment', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (isMember) {
        navigate('/member/dashboard', { replace: true });
      } else {
        navigate('/applicant/assessment', { replace: true });
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <Card className="shadow-elevated border-surface-border">
          <CardHeader className="text-center pb-2">
            {/* Role-based [STUDENT / MEMBER / ADMIN] switching tabs */}
            <div className="grid grid-cols-3 p-1 mb-5 rounded-xl bg-canvas border border-surface-border shadow-inner">
              <button
                type="button"
                onClick={() => handleRoleSwitch('student')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'student'
                    ? 'bg-ink text-canvas shadow-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>STUDENT</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('member')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'member'
                    ? 'bg-ink text-canvas shadow-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <UserCheck className={`h-3.5 w-3.5 ${selectedRole === 'member' ? 'text-accent-lavender' : ''}`} />
                <span>MEMBER</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'admin'
                    ? 'bg-ink text-canvas shadow-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <ShieldCheck className={`h-3.5 w-3.5 ${selectedRole === 'admin' ? 'text-accent-green' : ''}`} />
                <span>ADMIN</span>
              </button>
            </div>

            <div className="mx-auto mb-2">
              <Badge variant={selectedRole === 'admin' ? 'orange' : selectedRole === 'member' ? 'lavender' : 'neutral'}>
                {selectedRole === 'admin'
                  ? 'Admin Gateway'
                  : selectedRole === 'member'
                  ? 'Member Demo Experience'
                  : 'Student Applicant Gateway'}
              </Badge>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight">
              {selectedRole === 'admin'
                ? 'Sign In as Administrator'
                : selectedRole === 'member'
                ? 'Explore as Club Member'
                : 'Sign In to AI CLUB'}
            </CardTitle>
            <CardDescription>
              {selectedRole === 'admin'
                ? 'Restricted control console for authorized AI CLUB administration.'
                : selectedRole === 'member'
                ? 'Instant preview of the inducted member dashboard, digital ID card, courses, and projects.'
                : 'Access your student identity, applications, and entrance assessment.'}
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
                label={
                  selectedRole === 'admin'
                    ? 'Authorized Admin Email'
                    : selectedRole === 'member'
                    ? 'Demo Member Email'
                    : 'Student Email Address'
                }
                type="email"
                placeholder={
                  selectedRole === 'admin'
                    ? 'admin@aiclub.org'
                    : selectedRole === 'member'
                    ? 'alex.member@aiclub.org'
                    : 'ada@university.edu'
                }
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
                  {selectedRole !== 'member' && (
                    <Link
                      to="/forgot-password"
                      className="text-xs text-ink-muted hover:text-ink hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
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
                  {selectedRole === 'admin'
                    ? 'Sign In to Admin Portal'
                    : selectedRole === 'member'
                    ? 'Enter Member Portal (Demo) →'
                    : 'Sign In'}
                </Button>
              </div>
            </form>

            {/* Quick 1-Click Demo Actions */}
            <div className="mt-6 pt-5 border-t border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent-lavender" />
                  Quick Demo Access
                </span>
                <span className="text-[10px] text-ink-muted">1-Click Launch</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('member')}
                  disabled={isSubmitting}
                  className="p-2.5 text-left rounded-cardSm border border-surface-border bg-canvas hover:border-ink hover:bg-surface transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-ink">Demo Member</span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Active</span>
                  </div>
                  <p className="text-[10px] text-ink-muted leading-tight">
                    Member dashboard, digital ID & internal learning
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('applicant')}
                  disabled={isSubmitting}
                  className="p-2.5 text-left rounded-cardSm border border-surface-border bg-canvas hover:border-ink hover:bg-surface transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-ink">Demo Applicant</span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-surface-muted text-ink font-semibold">Test</span>
                  </div>
                  <p className="text-[10px] text-ink-muted leading-tight">
                    Entrance test assessment & applicant timeline
                  </p>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-center text-xs text-ink-muted">
            {selectedRole === 'admin' ? (
              <span className="font-mono text-[11px] text-ink-muted">
                Admin access restricted to verified allowlist.
              </span>
            ) : selectedRole === 'member' ? (
              <span className="text-xs text-ink-muted">
                Viewing demo mode as an inducted member.
              </span>
            ) : (
              <>
                Don't have an account yet?{' '}
                <Link to="/register" className="ml-1 text-ink font-semibold hover:underline">
                  Create Account
                </Link>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

