import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth';
import { getContextualHomePath } from '@/utils/navigation';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, profile, signOut, isAdmin } = useAuth();
  const isLandingPage = location.pathname === '/';
  const homeTarget = getContextualHomePath(isAuthenticated, profile, isAdmin);

  const navLinks = [
    { label: 'About', path: '/about' },
    { label: 'Learn', path: '/learn' },
    { label: 'Events', path: '/events' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
        {/* Brand Logo */}
        <Link to={homeTarget} className="flex items-center gap-3 group">
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

        {/* Action Buttons: Suppressed on Landing Page per strict requirement */}
        {!isLandingPage && (
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {profile?.role === 'applicant' && (
                  <Link to="/applicant/assessment">
                    <Button variant="primary" size="sm" className="hidden sm:inline-flex shadow-subtle">
                      Take Assessment &rarr;
                    </Button>
                  </Link>
                )}
                {profile?.role === 'member' && (
                  <Link to="/member/dashboard">
                    <Button variant="primary" size="sm" className="hidden sm:inline-flex shadow-subtle">
                      Member Portal &rarr;
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="primary" size="sm" className="hidden sm:inline-flex shadow-subtle">
                      Admin Center &rarr;
                    </Button>
                  </Link>
                )}
                <Link
                  to={
                    profile?.role === 'member'
                      ? '/member/profile'
                      : isAdmin
                      ? '/admin'
                      : '/applicant/assessment'
                  }
                  className="flex items-center gap-2 group"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName || 'User'}
                      className="h-8 w-8 rounded-full object-cover border border-surface-border group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-ink text-canvas text-xs font-semibold flex items-center justify-center group-hover:scale-105 transition-transform">
                      {getInitials(profile?.fullName)}
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-medium text-ink group-hover:underline">
                    {profile?.fullName || (profile?.role === 'member' ? 'Member' : 'Applicant')}
                  </span>
                </Link>
                <Button onClick={handleSignOut} variant="ghost" size="sm">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Join AI CLUB
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
