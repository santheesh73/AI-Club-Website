import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-surface-border bg-canvas-alt/50 py-12 px-6 sm:px-8 mt-auto">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-ink text-canvas text-xs flex items-center justify-center font-bold">
              AI
            </div>
            <span className="font-semibold text-sm tracking-tight text-ink">AI CLUB</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            The premier artificial intelligence innovation community platform.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-ink-muted">
          <Link to="/about" className="hover:text-ink transition-colors">
            About
          </Link>
          <Link to="/events" className="hover:text-ink transition-colors">
            Events
          </Link>
          <Link to="/projects" className="hover:text-ink transition-colors">
            Projects
          </Link>
          <a
            href="https://github.com/santheesh73/AI-Club-Website"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink transition-colors"
          >
            GitHub
          </a>
        </div>

        <p className="text-xs text-ink-faint">
          &copy; {new Date().getFullYear()} AI CLUB. Architectural Milestone 1.
        </p>
      </div>
    </footer>
  );
};
