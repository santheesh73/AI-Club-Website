import React, { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const PublicLayout: React.FC = () => {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    // Public page transitions start at the introduction; fragment links keep their target.
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  useEffect(() => {
    const labels: Record<string, string> = {
      '/': 'Learn AI by trying an idea', '/about': 'About the club', '/learn': 'Find your next learning direction',
      '/learn/first-model': 'Your first model', '/join': 'Joining guide', '/events': 'Club calendar',
      '/login': 'Sign in', '/register': 'Create an account', '/forgot-password': 'Password help',
      '/projects': 'Public projects', '/community': 'Public projects', '/community/projects': 'Public projects',
    };
    const label = labels[pathname] || (pathname.startsWith('/events/') ? 'Event details' : pathname.startsWith('/community/projects/') ? 'Project details' : 'AI Club');
    document.title = `${label} · AI Club at SIET`;
  }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <a href="#main-content" className="absolute left-4 top-4 z-50 -translate-y-24 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-canvas focus:translate-y-0">Skip to content</a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 w-full scroll-mt-24">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
