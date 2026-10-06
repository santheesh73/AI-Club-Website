import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const ApplicantLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <header className="border-b border-surface-border bg-surface px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-ink text-canvas text-xs flex items-center justify-center font-bold">
              AI
            </div>
            <span className="font-semibold text-sm tracking-tight text-ink">AI CLUB</span>
            <span className="text-xs text-ink-muted">/ Applicant Portal</span>
          </Link>
          <div className="text-xs text-ink-muted">Application Cycle</div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
