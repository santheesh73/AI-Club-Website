import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export const MemberLayout: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/member' },
    { name: 'Courses', href: '/member/courses' },
    { name: 'Events', href: '/member/events' },
    { name: 'Projects', href: '/member/projects' },
    { name: 'Community', href: '/member/community' },
    { name: 'Achievements', href: '/member/achievements' },
    { name: 'Notifications', href: '/member/notifications' },
    { name: 'AI Assistant', href: '/member/ai' },
    { name: 'Profile', href: '/member/profile' },
  ];

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar */}
      <aside className="w-64 border-r border-surface-border bg-surface p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-ink text-canvas font-bold flex items-center justify-center">
              AI
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-ink block">AI CLUB</span>
              <span className="text-[10px] tracking-wider text-accent-green uppercase font-medium">Member Area</span>
            </div>
          </Link>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-cardSm text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-muted text-ink font-semibold'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-muted/50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-surface-border text-xs text-ink-muted">
          Member Session Active
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-surface-border bg-surface px-6 flex items-center justify-between">
          <div className="text-sm font-medium text-ink-muted">
            AI Innovation Collective
          </div>
          <div className="flex items-center gap-3">
            <Link to="/member/profile" className="text-xs font-medium text-ink hover:underline">
              Member Profile
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
