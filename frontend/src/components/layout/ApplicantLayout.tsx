import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getContextualHomePath } from '@/utils/navigation';
import { Button } from '@/components/ui/Button';
import { LayoutDashboard, FileText, CheckSquare, Award, User, LogOut, Shield, ArrowRight } from 'lucide-react';

export const ApplicantLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin, isAuthenticated } = useAuth();
  const homeTarget = getContextualHomePath(isAuthenticated, profile, isAdmin);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/applicant', icon: LayoutDashboard },
    { label: 'Application', path: '/applicant/application', icon: FileText },
    { label: 'Assessment', path: '/applicant/assessment', icon: CheckSquare },
    { label: 'Results', path: '/applicant/result', icon: Award },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/90 backdrop-blur-md px-6 py-3.5">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to={homeTarget} className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-ink text-canvas text-xs flex items-center justify-center font-bold">
                AI
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-ink leading-tight">
                  AI CLUB
                </span>
                <span className="text-[10px] text-ink-muted uppercase font-mono tracking-wider">
                  Applicant Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-surface-border">
              {navItems.map((item) => {
                const isActive =
                  item.path === '/applicant'
                    ? location.pathname === '/applicant'
                    : location.pathname.startsWith(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card-sm text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-canvas-alt text-ink font-semibold border border-surface-border'
                        : 'text-ink-secondary hover:text-ink hover:bg-canvas-alt/50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="primary" size="sm" className="bg-ink text-canvas hover:bg-ink-muted">
                  <Shield className="h-3.5 w-3.5 mr-1" />
                  <span>Admin Center</span>
                </Button>
              </Link>
            )}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-ink leading-tight">
                {profile?.fullName || 'Applicant'}
              </span>
              <span className="text-[10px] text-ink-muted font-mono">{profile?.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-ink-muted hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {isAdmin && (
        <div className="bg-surface-muted border-b border-surface-border px-6 py-2 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
          <span>You are viewing the Applicant Portal as Administrator.</span>
          <Link to="/admin" className="font-semibold text-ink underline hover:text-ink-secondary flex items-center gap-1">
            Open Admin Control Center <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Mobile Navigation bar */}
      <div className="md:hidden border-b border-surface-border bg-surface px-4 py-2 overflow-x-auto flex items-center gap-1">
        {navItems.map((item) => {
          const isActive =
            item.path === '/applicant'
              ? location.pathname === '/applicant'
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1 px-3 py-1 rounded-card-sm text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-canvas-alt text-ink font-semibold border border-surface-border'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
