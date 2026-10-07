import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useMembership } from '@/features/membership';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard,
  User,
  CreditCard,
  FileText,
  Award,
  BookOpen,
  Calendar,
  FolderGit2,
  Trophy,
  Sparkles,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const MemberLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { membership } = useMembership();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const coreNavigation = [
    { name: 'Dashboard', href: '/member', icon: LayoutDashboard },
    { name: 'Courses', href: '/member/courses', icon: BookOpen },
    { name: 'Events', href: '/member/events', icon: Calendar },
    { name: 'My Profile', href: '/member/profile', icon: User },
    { name: 'Membership', href: '/member/membership', icon: CreditCard },
    { name: 'Application', href: '/member/application', icon: FileText },
    { name: 'Assessment', href: '/member/assessment', icon: Award },
  ];

  const upcomingNavigation = [
    { name: 'Projects', href: '/member/projects', icon: FolderGit2 },
    { name: 'Achievements', href: '/member/achievements', icon: Trophy },
    { name: 'AI Assistant', href: '/member/ai', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-surface-border bg-surface p-6 flex flex-col justify-between hidden lg:flex flex-shrink-0">
        <div className="space-y-6">
          {/* Brand & Identity */}
          <Link to="/member" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-ink text-canvas font-bold flex items-center justify-center tracking-wider text-sm shadow-subtle group-hover:scale-105 transition-transform">
              AI
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-ink block">AI CLUB</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] tracking-wider uppercase font-semibold text-accent-green">
                  Member Space
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
              </div>
            </div>
          </Link>

          {/* Member Identity Snippet */}
          <div className="p-3.5 rounded-card-sm bg-canvas border border-surface-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Member ID
              </span>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-xs font-mono font-bold text-ink">
              {membership?.memberNumber || 'AIC-MEMBER'}
            </p>
          </div>

          {/* Primary Navigation */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-ink-muted block pb-1">
              Member Workspace
            </span>
            <nav className="space-y-0.5">
              {coreNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-card-sm text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-ink text-canvas font-semibold shadow-subtle'
                        : 'text-ink-secondary hover:text-ink hover:bg-surface-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Upcoming Modules (Read-only placeholders for future milestones) */}
          <div className="space-y-1 pt-2 border-t border-surface-border">
            <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-ink-muted block pb-1">
              Upcoming Modules
            </span>
            <nav className="space-y-0.5">
              {upcomingNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-card-sm text-xs transition-colors ${
                      isActive
                        ? 'bg-surface-muted text-ink font-semibold'
                        : 'text-ink-muted hover:text-ink-secondary hover:bg-surface-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 flex-shrink-0 opacity-70" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[9px] font-mono uppercase text-ink-muted/80 bg-canvas-alt px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Footer & Sign Out */}
        <div className="pt-4 border-t border-surface-border space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-canvas-alt border border-surface-border flex items-center justify-center font-bold text-xs text-ink">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink truncate">
                {profile?.fullName || 'Active Member'}
              </p>
              <p className="text-[10px] text-ink-muted truncate font-mono">
                {profile?.email}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-ink-muted hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-surface-border bg-surface px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-card-sm text-ink-secondary hover:text-ink hover:bg-surface-muted"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-ink-muted uppercase tracking-wider">
                Member Portal
              </span>
              <span className="text-ink-muted/50 hidden sm:inline">•</span>
              <span className="text-xs text-ink-secondary font-mono hidden sm:inline">
                {membership?.memberNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/member/membership">
              <Badge variant="success" className="hidden sm:inline-flex">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Active Member
              </Badge>
            </Link>
            <Link to="/member/profile" className="flex items-center gap-2 text-xs font-medium text-ink hover:underline">
              <span>{profile?.fullName || 'My Profile'}</span>
              <ChevronRight className="h-3 w-3 text-ink-muted" />
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-surface border-b border-surface-border p-4 space-y-4 animate-in slide-in-from-top duration-200">
            <div className="p-3 rounded-card-sm bg-canvas border border-surface-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink">{profile?.fullName}</p>
                <p className="text-[10px] font-mono text-ink-muted">{membership?.memberNumber}</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <nav className="grid grid-cols-2 gap-2">
              {coreNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-2.5 rounded-card-sm text-xs font-medium ${
                      isActive
                        ? 'bg-ink text-canvas font-semibold'
                        : 'text-ink-secondary hover:bg-surface-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-surface-border flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-600 text-xs">
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        )}

        {/* Primary Page Canvas */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
