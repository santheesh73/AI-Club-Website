import React from 'react';
import { Link } from 'react-router-dom';

const learningTracks = [
  { title: 'Mathematical foundations', startingPoint: 'For learners building their understanding of the maths behind machine learning.', outcome: 'Explore how vectors, probability, and optimization help describe and train models.', topics: ['Linear algebra', 'Probability and statistics', 'Gradient descent', 'Optimization'] },
  { title: 'Deep learning and computer vision', startingPoint: 'For learners familiar with core machine learning concepts.', outcome: 'Understand how neural networks learn patterns and how vision models work with images.', topics: ['Neural networks', 'Convolutional networks', 'Vision transformers', 'Detection and segmentation'] },
  { title: 'Generative AI and language models', startingPoint: 'For learners ready to explore attention and modern language models.', outcome: 'Explore how language models generate text and how retrieval and fine-tuning adapt their behavior.', topics: ['Attention mechanisms', 'Language model fundamentals', 'Retrieval-augmented generation', 'Parameter-efficient fine-tuning'] },
  { title: 'Deployment and AI agents', startingPoint: 'For learners interested in taking a model beyond an experiment.', outcome: 'Explore serving models, monitoring their behavior, and connecting them with tools.', topics: ['Inference APIs', 'Containers', 'Model monitoring', 'Agent workflows'] },
];

export const LearnPage: React.FC = () => (
  <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-20">
    <header className="max-w-3xl">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">Find your starting point in AI.</h1>
      <p className="mt-6 text-lg text-ink-secondary leading-relaxed">These tracks describe the club’s curriculum, from mathematical foundations to deploying models. Choose a direction that fits what you know and what you want to explore.</p>
      <p className="mt-4 text-ink-secondary">This is a curriculum overview. Course content is available through the member learning workspace.</p>
    </header>
    <section aria-label="Learning tracks" className="mt-12 sm:mt-16">
      {learningTracks.map((track) => <article key={track.title} className="border-t border-surface-border py-8 sm:py-10 grid md:grid-cols-[1fr_1.2fr] gap-5 md:gap-12">
        <div><h2 className="text-2xl font-semibold tracking-tight">{track.title}</h2><p className="mt-3 text-ink-secondary leading-relaxed">{track.startingPoint}</p></div>
        <div><p className="text-ink-secondary leading-relaxed">{track.outcome}</p><h3 className="mt-4 text-sm font-semibold">Topics to explore</h3><ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-2 list-disc pl-5 text-sm text-ink-secondary">{track.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul></div>
      </article>)}
    </section>
    <section aria-labelledby="learning-next-step" className="mt-6 rounded-xl bg-canvas-alt p-6 sm:p-10">
      <h2 id="learning-next-step" className="text-2xl sm:text-3xl font-bold tracking-tight">Put an idea into practice</h2>
      <p className="mt-4 max-w-2xl text-ink-secondary leading-relaxed">Look at published member projects to see how ideas become working examples. To use the member workspace, apply for membership through the assessment and administrative review process.</p>
      <div className="mt-6 flex flex-wrap gap-4"><Link to="/community/projects" className="public-action">Explore projects</Link><Link to="/register" className="public-action-secondary">Apply to join</Link></div>
    </section>
  </div>
);
