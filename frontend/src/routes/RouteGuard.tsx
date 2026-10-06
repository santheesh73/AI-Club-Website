import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
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
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Verifying session authorization..." />
        <p className="text-xs text-ink-muted">Verifying credentials...</p>
      </div>
    );
  }

  // If unauthenticated and a protected route is requested
  if (!isAuthenticated && requiredRole !== 'public') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role authorization check
  if (requiredRole === 'admin' && profile?.role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  if (requiredRole === 'member' && profile?.role !== 'member' && profile?.role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};
