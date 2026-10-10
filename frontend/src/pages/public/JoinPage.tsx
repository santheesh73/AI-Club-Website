import { Link } from 'react-router-dom';
import { MembershipGuide } from '@/components/public/MembershipGuide';

export function JoinPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
      <header className="mb-10 max-w-3xl space-y-5">
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">Choose how you'd like to take part.</h1>
        <p className="text-lg leading-relaxed text-ink-secondary">Try a public lesson, attend an eligible event, or apply for club membership. You can understand the next steps before creating an account.</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2"><Link to="/learn/first-model" className="public-text-link underline">Start with a public lesson</Link><Link to="/events" className="public-text-link underline">Explore events</Link></div>
      </header>
      <div className="border-t border-surface-border pt-10"><MembershipGuide /></div>
    </div>
  );
}
