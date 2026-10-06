import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { Spinner } from '@/components/ui/Spinner';

export type UserRole = 'public' | 'applicant' | 'member' | 'admin';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'public' | 'authenticated' | 'applicant' | 'member' | 'admin';
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole = 'authenticated',
}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setIsAuthenticated(Boolean(data.session));
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(Boolean(session));
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Verifying session authorization..." />
        <p className="text-xs text-ink-muted">Verifying credentials...</p>
      </div>
    );
  }

  // If unauthenticated and a protected role is required
  if (!isAuthenticated && requiredRole !== 'public') {
    // In Milestone 1, we allow local development fallback if no Supabase credentials exist yet
    const isMockLocal = !env.supabaseUrl;
    if (isMockLocal) {
      return <>{children}</>;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
