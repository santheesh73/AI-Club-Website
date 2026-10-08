import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { RouteGuard } from '@/routes/RouteGuard';
import * as authContext from '@/features/auth';
import * as membershipContext from '@/features/membership/useMembership';

// Component that deliberately throws an error for ErrorBoundary testing
const BuggyComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Critical component render crash simulation');
  }
  return <div>Component rendered safely</div>;
};

describe('Milestone 10: Frontend Production Readiness & Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Global Error Boundary Containment', () => {
    it('catches uncaught component crashes and renders graceful fallback UI without crashing the app', () => {
      // Suppress console.error in test runner for expected caught error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <BuggyComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText('An unexpected error occurred while rendering this interface.')
      ).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('renders normal children when no error is thrown', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component rendered safely')).toBeInTheDocument();
    });
  });

  describe('2. Client-Side RouteGuard Enforcement', () => {
    it('redirects unauthenticated visitors to /login', () => {
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        profile: null,
        user: null,
        session: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        refreshProfile: vi.fn(),
        updateProfile: vi.fn(),
        loginAsDemo: vi.fn(),
      });

      vi.spyOn(membershipContext, 'useMembership').mockReturnValue({
        membership: null,
        isActiveMember: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/member']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/member"
              element={
                <RouteGuard requiredRole="member">
                  <div>Protected Member Dashboard</div>
                </RouteGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Member Dashboard')).not.toBeInTheDocument();
    });

    it('blocks non-admin authenticated users attempting /admin route with NOT HAVE ACCESS', () => {
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isAuthenticated: true,
        isAdmin: false,
        isLoading: false,
        profile: {
          id: 'u-1',
          email: 'student@example.com',
          fullName: 'Student User',
          role: 'member',
          skills: [],
          interests: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        user: null,
        session: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        refreshProfile: vi.fn(),
        updateProfile: vi.fn(),
        loginAsDemo: vi.fn(),
      });

      vi.spyOn(membershipContext, 'useMembership').mockReturnValue({
        membership: null,
        isActiveMember: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/profile" element={<div>Profile Page</div>} />
            <Route
              path="/admin"
              element={
                <RouteGuard requiredRole="admin">
                  <div>Admin Control Center</div>
                </RouteGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('NOT HAVE ACCESS')).toBeInTheDocument();
      expect(screen.queryByText('Admin Control Center')).not.toBeInTheDocument();
    });

    it('permits active member into /member route', () => {
      vi.spyOn(authContext, 'useAuth').mockReturnValue({
        isAuthenticated: true,
        isAdmin: false,
        isLoading: false,
        profile: {
          id: 'u-1',
          email: 'member@example.com',
          fullName: 'Active Member',
          role: 'member',
          skills: [],
          interests: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        user: null,
        session: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        refreshProfile: vi.fn(),
        updateProfile: vi.fn(),
        loginAsDemo: vi.fn(),
      });

      vi.spyOn(membershipContext, 'useMembership').mockReturnValue({
        membership: {
          id: 'm-1',
          userId: 'u-1',
          applicationId: 'app-1',
          memberNumber: 'AIC-2026-0001',
          status: 'active',
          joinedAt: new Date().toISOString(),
          activatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isActiveMember: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/member']}>
          <Routes>
            <Route
              path="/member"
              element={
                <RouteGuard requiredRole="member">
                  <div>Protected Member Dashboard</div>
                </RouteGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Member Dashboard')).toBeInTheDocument();
    });
  });
});
