import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="border-t border-surface-border bg-canvas-alt/50 py-10 px-6 sm:px-8 mt-auto">
    <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <p className="font-semibold">AI CLUB</p>
        <p className="mt-1 text-sm text-ink-secondary">Learn about AI. Build something together.</p>
      </div>
      <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <Link to="/about" className="public-text-link">About</Link>
        <Link to="/learn" className="public-text-link">Learn</Link>
        <Link to="/events" className="public-text-link">Events</Link>
        <a href="https://github.com/santheesh73/AI-Club-Website" target="_blank" rel="noreferrer" className="public-text-link">Website source <span className="sr-only">(opens in a new tab)</span></a>
      </nav>
      <p className="text-sm text-ink-secondary">© {new Date().getFullYear()} AI CLUB</p>
    </div>
  </footer>
);
