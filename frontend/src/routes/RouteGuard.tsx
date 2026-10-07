import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useMembership } from '@/features/membership/useMembership';
import { Spinner } from '@/components/ui/Spinner';
import type { UserRole } from '@/types/user';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'public' | 'authenticated' | UserRole;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole = 'authenticated',
}) => {
  const { isAuthenticated, isLoading: isAuthLoading, profile } = useAuth();
  const { isActiveMember, isLoading: isMembershipLoading } = useMembership();
  const location = useLocation();

  const isCheckingMember = requiredRole === 'member' && isAuthenticated;
  const isLoading = isAuthLoading || (isCheckingMember && isMembershipLoading);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Verifying session authorization..." />
        <p className="text-xs text-ink-muted">Verifying credentials and membership...</p>
      </div>
    );
  }

  // If unauthenticated and a protected route is requested
  if (!isAuthenticated && requiredRole !== 'public') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin access control
  if (requiredRole === 'admin' && profile?.role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  // Member access control: User must have an ACTIVE database membership record (or be an admin)
  if (requiredRole === 'member') {
    const isAdmin = profile?.role === 'admin';
    if (!isActiveMember && !isAdmin) {
      // Redirect to applicant portal if no active membership is established
      return <Navigate to="/applicant" replace />;
    }
  }

  return <>{children}</>;
};
