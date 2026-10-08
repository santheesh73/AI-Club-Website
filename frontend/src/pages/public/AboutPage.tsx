import React from 'react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => (
  <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-20">
    <header className="max-w-3xl">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">AI is better explored together.</h1>
      <p className="mt-6 text-lg text-ink-secondary leading-relaxed">AI CLUB at SIET is a student community for learning about artificial intelligence, developing projects, and sharing ideas.</p>
    </header>
    <section aria-labelledby="club-activities" className="mt-12 sm:mt-16 border-t border-surface-border pt-10">
      <h2 id="club-activities" className="text-3xl font-bold tracking-tight">Find your way into AI</h2>
      <div className="grid md:grid-cols-2 gap-10 mt-6">
        <div><h3 className="text-xl font-semibold">Start with a question</h3><p className="mt-3 text-ink-secondary leading-relaxed">Use the learning tracks to identify a topic you want to understand. The curriculum spans mathematical foundations, deep learning, language models, and deployment.</p><Link to="/learn" className="public-text-link mt-3">Explore the curriculum</Link></div>
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
    <section aria-labelledby="membership-heading" className="mt-12 sm:mt-16 rounded-xl bg-canvas-alt p-6 sm:p-10">
      <h2 id="membership-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">Membership and events</h2>
      <p className="mt-4 max-w-2xl text-ink-secondary leading-relaxed">Membership starts with an account, an entrance assessment, and administrative review. Read the assessment instructions before you begin and follow your application status in your account.</p>
      <p className="mt-4 max-w-2xl text-ink-secondary leading-relaxed">Public events are a separate way to participate. An account lets you RSVP to events marked public; members-only events require active membership.</p>
      <div className="mt-6 flex flex-wrap gap-4"><Link to="/register" className="public-action">Apply to join</Link><Link to="/events" className="public-action-secondary">Find an event</Link></div>
    </section>
  </div>
);
