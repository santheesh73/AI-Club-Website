import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  BookOpen,
  FolderGit2,
  Award,
  Megaphone,
  BarChart3,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

import { NotificationBell } from '@/features/notifications';
import { getContextualHomePath } from '@/utils/navigation';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const homeTarget = getContextualHomePath(isAuthenticated, profile, isAdmin);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-canvas">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-card-lg bg-surface border border-surface-border shadow-elevated">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <ShieldCheck className="w-8 h-8" />
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

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, activeInM4: true },
    { name: 'Applications', href: '/admin/applications', icon: FileText, activeInM4: true },
    { name: 'Question Bank', href: '/admin/assessment', icon: HelpCircle, activeInM4: true },
    { name: 'Members', href: '/admin/members', icon: Users, activeInM4: true },
    { name: 'Events', href: '/admin/events', icon: Calendar, activeInM4: true },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen, activeInM4: true },
    { name: 'External Courses', href: '/admin/external-courses', icon: ExternalLink, activeInM4: true },
    { name: 'Projects', href: '/admin/projects', icon: FolderGit2, activeInM4: true },

    { name: 'Achievements', href: '/admin/achievements', icon: Award, activeInM4: true },
    { name: 'Announcements', href: '/admin/announcements', icon: Megaphone, activeInM4: false },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, activeInM4: true },
    { name: 'AI Intelligence', href: '/admin/intelligence', icon: Sparkles, activeInM4: true },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: History, activeInM4: false },
    { name: 'Settings', href: '/admin/settings', icon: Settings, activeInM4: false },
  ];

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Desktop Admin Sidebar */}
      <aside className="w-64 border-r border-surface-border bg-surface p-6 flex-col justify-between hidden md:flex flex-shrink-0">
        <div className="space-y-6">
          <Link to={homeTarget} className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-ink text-canvas font-bold flex items-center justify-center group-hover:scale-105 transition-transform">
              AI
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-ink block">
                AI CLUB
              </span>
              <span className="text-[10px] tracking-wider text-ink-muted uppercase font-mono font-bold">
                CONTROL
              </span>
            </div>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-card-sm text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-ink text-canvas font-semibold shadow-subtle'
                      : 'text-ink-secondary hover:text-ink hover:bg-canvas-alt'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {!item.activeInM4 && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-canvas-alt text-ink-muted font-mono">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-surface-border space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-green" />
              <span>Admin Role Verified</span>
            </span>
            <span className="h-2 w-2 rounded-full bg-accent-green" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-ink-muted hover:text-ink"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Admin Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-surface-border bg-surface px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-canvas-alt"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to={homeTarget} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-sm font-semibold text-ink">AI CLUB CONTROL</span>
              <span className="text-xs text-ink-muted hidden sm:inline">• Administrative Console</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell viewAllLink="/admin/notifications" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-ink leading-tight">
                {profile?.fullName || 'Administrator'}
              </p>
              <p className="text-[10px] font-mono text-ink-muted">{profile?.email}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-ink text-canvas text-xs font-bold flex items-center justify-center font-mono">
              ADM
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-surface-border bg-surface p-4 space-y-1 animate-in fade-in">
            {navItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-card-sm text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-ink text-canvas font-semibold'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {!item.activeInM4 && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-canvas-alt text-ink-muted font-mono">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
