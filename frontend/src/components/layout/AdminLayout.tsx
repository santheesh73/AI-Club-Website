import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Overview', href: '/admin' },
    { name: 'Applications', href: '/admin/applications' },
    { name: 'Members', href: '/admin/members' },
    { name: 'Events', href: '/admin/events' },
    { name: 'Courses', href: '/admin/courses' },
    { name: 'Projects', href: '/admin/projects' },
    { name: 'Achievements', href: '/admin/achievements' },
    { name: 'Announcements', href: '/admin/announcements' },
    { name: 'Notifications', href: '/admin/notifications' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Audit Logs', href: '/admin/audit-logs' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-surface-border bg-surface p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-ink text-canvas font-bold flex items-center justify-center">
              AI
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-ink block">AI CLUB</span>
              <span className="text-[10px] tracking-wider text-red-600 uppercase font-semibold">Admin Center</span>
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
                      ? 'bg-ink text-canvas font-semibold'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-muted/60'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-surface-border text-xs text-ink-muted flex items-center justify-between">
          <span>Authoritative Mode</span>
          <span className="h-2 w-2 rounded-full bg-accent-green" />
        </div>
      </aside>

      {/* Admin Main Body */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-surface-border bg-surface px-6 flex items-center justify-between">
          <div className="text-sm font-semibold text-ink">
            Administrative Management Console
          </div>
          <div className="text-xs text-ink-muted">
            Privileged Boundary
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
