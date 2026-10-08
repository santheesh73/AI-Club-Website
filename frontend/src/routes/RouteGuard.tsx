import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth, AUTHORIZED_ADMIN_EMAIL, normalizeEmail } from '@/features/auth';
import { useMembership } from '@/features/membership/useMembership';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';
import type { UserRole } from '@/types/user';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'public' | 'authenticated' | UserRole;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole = 'authenticated',
}) => {
  const { isAuthenticated, isLoading: isAuthLoading, profile, user } = useAuth();
  const { isActiveMember, isLoading: isMembershipLoading } = useMembership();
  const location = useLocation();

  const isCheckingMember = requiredRole === 'member' && isAuthenticated;
  const isLoading = isAuthLoading || (isCheckingMember && isMembershipLoading);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Verifying session authorization..." />
        <p className="text-xs text-ink-muted">Verifying credentials and authorization...</p>
      </div>
    );
  }

  // If unauthenticated and a protected route is requested
  if (!isAuthenticated && requiredRole !== 'public') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin access control - Strict email allowlist & role verification
  if (requiredRole === 'admin') {
    const userEmail = normalizeEmail(user?.email || profile?.email);
    const isExactAdminEmail = userEmail === AUTHORIZED_ADMIN_EMAIL;
    const isAdminRole = profile?.role === 'admin';

    if (!isExactAdminEmail || !isAdminRole) {
      // Phase 12 UX: Clean access-denied page: NOT HAVE ACCESS
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full text-center space-y-6 p-8 rounded-card-lg bg-surface border border-surface-border shadow-elevated">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                NOT HAVE ACCESS
              </h1>
              <p className="text-sm text-ink-muted">
                You do not have permission to access the admin portal.
              </p>
            </div>
            <div className="pt-2">
              <Link to={profile?.role === 'member' ? '/member/dashboard' : '/applicant/dashboard'}>
                <Button variant="primary" size="md" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // Member access control: User must have an ACTIVE database membership record (or be authorized admin)
  if (requiredRole === 'member') {
    const userEmail = normalizeEmail(user?.email || profile?.email);
    const isExactAdmin = userEmail === AUTHORIZED_ADMIN_EMAIL && profile?.role === 'admin';
    const isMemberRole = profile?.role === 'member';
    if (!isActiveMember && !isExactAdmin && !isMemberRole) {
      // Redirect to applicant portal if no active membership is established
      return <Navigate to="/applicant/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
