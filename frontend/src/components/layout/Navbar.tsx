import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { label: 'About', path: '/about' },
    { label: 'Learn', path: '/learn' },
    { label: 'Events', path: '/events' },
    { label: 'Projects', path: '/projects' },
    { label: 'Community', path: '/community' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-canvas font-bold text-lg tracking-wider group-hover:scale-105 transition-transform">
            AI
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg tracking-tight text-ink">AI CLUB</span>
            <span className="text-[10px] tracking-widest text-ink-muted uppercase">Innovation Hub</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive ? 'text-ink font-semibold' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/join">
            <Button variant="primary" size="sm">
              Join AI CLUB
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
