import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useMembership } from '@/features/membership';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/features/notifications';
import { getContextualHomePath } from '@/utils/navigation';
import { LayoutDashboard, BookOpen, Calendar, FolderGit2, Trophy, Sparkles, User, CreditCard, FileText, Award, Bell, History, BarChart2, LogOut, Menu, X } from 'lucide-react';

const workspace = [
  { name: 'Dashboard', href: '/member', icon: LayoutDashboard },
  { name: 'Learn', href: '/member/courses', icon: BookOpen },
  { name: 'My courses', href: '/member/my-courses', icon: BookOpen },
  { name: 'Projects', href: '/member/projects', icon: FolderGit2 },
  { name: 'Events', href: '/member/events', icon: Calendar },
];
const community = [
  { name: 'Achievements', href: '/member/achievements', icon: Trophy },
  { name: 'AI Assistant', href: '/member/ai', icon: Sparkles },
];
const account = [
  { name: 'My profile', href: '/member/profile', icon: User },
  { name: 'Membership card', href: '/member/membership', icon: CreditCard },
  { name: 'Notifications', href: '/member/notifications', icon: Bell },
  { name: 'Learning stats', href: '/member/learning', icon: BarChart2 },
  { name: 'Activity', href: '/member/activity', icon: History },
  { name: 'Application history', href: '/member/application', icon: FileText },
  { name: 'Assessment results', href: '/member/assessment', icon: Award },
];

export const MemberLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, isAdmin, isAuthenticated } = useAuth();
  const { membership } = useMembership();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const homeTarget = getContextualHomePath(isAuthenticated, profile, isAdmin);
  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isMobileMenuOpen]);
  const isActive = (href: string) => href === '/member'
    ? location.pathname === '/member' || location.pathname === '/member/dashboard'
    : location.pathname === href || location.pathname.startsWith(`${href}/`);
  const links = (items: typeof workspace) => items.map(({ name, href, icon: Icon }) => (
    <Link key={href} to={href} aria-current={isActive(href) ? 'page' : undefined}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm ${isActive(href) ? 'bg-ink text-canvas font-semibold' : 'text-ink-secondary hover:bg-surface-muted hover:text-ink'}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{name}
    </Link>
  ));
  const navigation = (label: string) => (
    <nav aria-label={label} className="space-y-6">
      <div className="space-y-1">{links(workspace)}</div>
      <div className="space-y-1 border-t border-surface-border pt-4">
        <p className="px-3 pb-1 text-sm font-semibold text-ink">Community</p>{links(community)}
      </div>
      <details key={location.pathname} open={account.some(item => isActive(item.href))} className="border-t border-surface-border pt-4">
        <summary className="min-h-11 cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-ink">Account & history</summary>
        <div className="mt-1 space-y-1">{links(account)}</div>
      </details>
    </nav>
  );
  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-surface-border bg-surface p-5 lg:flex">
        <Link to={homeTarget} className="mb-6 flex min-h-11 items-center gap-3 font-semibold text-ink">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-canvas">AI</span>
          <span>AI CLUB</span>
        </Link>
        {navigation('Member workspace')}
        <div className="mt-auto border-t border-surface-border pt-5">
          <p className="truncate text-sm font-semibold">{profile?.fullName || 'Member'}</p>
          <p className="mt-1 text-xs text-ink-muted">{membership?.memberNumber || 'Member workspace'}</p>
          <Button onClick={handleSignOut} variant="ghost" className="mt-3 min-h-11 w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />Sign out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-surface-border bg-surface px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button ref={toggleRef} type="button" aria-label={isMobileMenuOpen ? 'Close member menu' : 'Open member menu'}
              aria-expanded={isMobileMenuOpen} aria-controls="member-mobile-navigation"
              onClick={() => setIsMobileMenuOpen(open => !open)} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-surface-muted lg:hidden">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-sm font-semibold">Member workspace</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <NotificationBell viewAllLink="/member/notifications" />
            <Link to="/member/profile" className="flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline">My profile</Link>
          </div>
        </header>
        {isMobileMenuOpen && (
          <div id="member-mobile-navigation" className="border-b border-surface-border bg-surface p-4 lg:hidden">
            {navigation('Mobile member workspace')}
            <Button onClick={handleSignOut} variant="ghost" className="mt-4 min-h-11"><LogOut className="mr-2 h-4 w-4" aria-hidden="true" />Sign out</Button>
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
};
