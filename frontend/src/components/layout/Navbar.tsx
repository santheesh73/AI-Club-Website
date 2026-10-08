import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { getContextualHomePath } from '@/utils/navigation';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, profile, signOut, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const homeTarget = getContextualHomePath(isAuthenticated, profile, isAdmin);
  const navLinks = [
    { label: 'About', path: '/about' },
    { label: 'Learn', path: '/learn' },
    { label: 'Events', path: '/events' },
  ];

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); navigate('/'); }
    finally { setSigningOut(false); }
  };

  const accountLinks = isAuthenticated ? (
    <>
      <Link to={homeTarget} className="public-action">{isAdmin ? 'Admin center' : profile?.role === 'member' ? 'Member portal' : 'My application'}</Link>
      <button type="button" onClick={handleSignOut} disabled={signingOut} className="public-text-link disabled:opacity-50">{signingOut ? 'Signing out…' : 'Sign out'}</button>
    </>
  ) : (
    <>
      <Link to="/login" className="public-text-link">Sign in</Link>
      <Link to="/register" className="public-action">Join Club</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-canvas">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6 sm:px-8">
        <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="AI Club home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-canvas font-bold text-lg" aria-hidden="true">AI</span>
          <span className="font-semibold text-lg tracking-tight">AI CLUB</span>
        </Link>
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => <Link key={link.path} to={link.path} aria-current={location.pathname === link.path ? 'page' : undefined} className="public-text-link aria-[current=page]:underline">{link.label}</Link>)}
        </nav>
        <div className="hidden md:flex items-center gap-4">{accountLinks}</div>
        <button ref={menuButton} type="button" aria-expanded={menuOpen} aria-controls="public-mobile-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border hover:bg-surface-muted">
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
      {menuOpen && <nav id="public-mobile-navigation" aria-label="Mobile navigation" className="md:hidden border-t border-surface-border px-6 py-4 flex flex-col gap-2">
        {navLinks.map((link) => <Link key={link.path} to={link.path} aria-current={location.pathname === link.path ? 'page' : undefined} className="public-text-link justify-start aria-[current=page]:underline">{link.label}</Link>)}
        <div className="flex flex-wrap items-center gap-4 border-t border-surface-border pt-4 mt-2">{accountLinks}</div>
      </nav>}
    </header>
  );
};
