import React from 'react';
import { Link } from 'react-router-dom';
import { MembershipGuide } from '@/components/public/MembershipGuide';

export const AboutPage: React.FC = () => (
  <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-20">
    <header className="max-w-3xl">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">AI is better explored together.</h1>
      <p className="mt-6 text-lg text-ink-secondary leading-relaxed">AI CLUB at SIET is a student community for learning about artificial intelligence, developing projects, and sharing ideas.</p>
    </header>
    <section aria-labelledby="club-activities" className="mt-12 sm:mt-16 border-t border-surface-border pt-10">
      <h2 id="club-activities" className="text-3xl font-bold tracking-tight">Find your way into AI</h2>
      <div className="grid md:grid-cols-2 gap-10 mt-6">
        <div><h3 className="text-xl font-semibold">Start with an experiment</h3><p className="mt-3 text-ink-secondary leading-relaxed">Try the public starter lesson: make a prediction, inspect the result, and consider where a model gets things wrong. No account is needed. Then use the learning tracks to choose what you want to explore next.</p><Link to="/learn/first-model" className="public-text-link mt-3">Try your first model lesson</Link></div>
        <div><h3 className="text-xl font-semibold">See the work</h3><p className="mt-3 text-ink-secondary leading-relaxed">The public project catalogue brings together published member work. Project pages show descriptions, contributors, and supporting links when provided.</p><Link to="/community/projects" className="public-text-link mt-3">Browse member projects</Link></div>
      </div>
    </section>
    <section aria-labelledby="principles-heading" className="mt-12 sm:mt-16 border-t border-surface-border pt-10">
      <h2 id="principles-heading" className="text-3xl font-bold tracking-tight">What we value</h2>
      <dl className="mt-6 grid md:grid-cols-2 gap-x-12 gap-y-8">
        <div><dt className="text-lg font-semibold">Show your work</dt><dd className="mt-2 text-ink-secondary leading-relaxed">Explain what you tried, what happened, and what you would change. Working examples make ideas easier to discuss.</dd></div>
        <div><dt className="text-lg font-semibold">Learn with others</dt><dd className="mt-2 text-ink-secondary leading-relaxed">Ask questions, share what you discover, and offer specific, constructive feedback.</dd></div>
        <div><dt className="text-lg font-semibold">Question the evidence</dt><dd className="mt-2 text-ink-secondary leading-relaxed">Consider how a model was evaluated and whether its results support the claims being made.</dd></div>
        <div><dt className="text-lg font-semibold">Build responsibly</dt><dd className="mt-2 text-ink-secondary leading-relaxed">Think about data privacy, limitations, and the people affected by a system.</dd></div>
      </dl>
    </section>
    <div className="mt-12 sm:mt-16 border-t border-surface-border pt-10"><MembershipGuide compact /></div>
  </div>
);
