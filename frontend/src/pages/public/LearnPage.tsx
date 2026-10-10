import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useMembership } from '@/features/membership';

const learningTracks = [
  { title: 'Mathematical foundations', startingPoint: 'Start here if you want to understand the maths behind a model.', outcome: 'Use vectors to describe inputs and probability to express uncertainty.', topics: ['Linear algebra', 'Probability and statistics', 'Gradient descent', 'Optimization'], search: 'linear algebra', action: 'Find foundation courses' },
  { title: 'Deep learning and computer vision', startingPoint: 'Build on basic machine learning and an understanding of vectors.', outcome: 'Explore how neural networks turn image pixels into useful predictions.', topics: ['Neural networks', 'Convolutional networks', 'Vision transformers', 'Detection and segmentation'], search: 'computer vision', action: 'Find vision courses' },
  { title: 'Generative AI and language models', startingPoint: 'Explore this after you understand training, evaluation, and neural networks.', outcome: 'Investigate text generation and how retrieval supplies a model with relevant context.', topics: ['Attention mechanisms', 'Language model fundamentals', 'Retrieval-augmented generation', 'Parameter-efficient fine-tuning'], search: 'language models', action: 'Find language model courses' },
  { title: 'Deployment and AI agents', startingPoint: 'For learners who have a working experiment and want to make it usable.', outcome: 'Explore serving a model, monitoring errors, and connecting it with tools.', topics: ['Inference APIs', 'Containers', 'Model monitoring', 'Agent workflows'], search: 'deployment', action: 'Find deployment courses' },
];

export function LearnPage() {
  const { isAdmin, isAuthenticated } = useAuth();
  const { isActiveMember } = useMembership();
  const canUseWorkspace = isAuthenticated && (isActiveMember || isAdmin);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-20">
      <header className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">Start with a model you can understand.</h1>
        <p className="mt-6 text-lg text-ink-secondary leading-relaxed">You do not need to master every topic before trying AI. Make one prediction, test it, and see where it fails. Then choose the ideas you want to explore next.</p>
      </header>
      <section aria-labelledby="starter-lesson-heading" className="mt-10 sm:mt-12 border-y border-surface-border py-8 sm:py-10 grid md:grid-cols-[1.15fr_1fr] gap-6 md:gap-12">
        <div><h2 id="starter-lesson-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight">Teach a rule. Find its limits.</h2><p className="mt-4 text-ink-secondary leading-relaxed">Move a decision boundary to classify illustrative flower measurements. You will learn what features, labels, and parameters mean—and why a perfect training score is not enough.</p></div>
        <div className="md:self-center"><p className="text-sm text-ink-secondary leading-relaxed">A self-paced interactive lesson. No code, account, or prior AI knowledge required.</p><Link to="/learn/first-model" className="public-action mt-5">Try your first model</Link></div>
      </section>
      <section aria-labelledby="learning-tracks-heading" className="mt-12 sm:mt-16">
        <h2 id="learning-tracks-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight">Choose your next question.</h2>
        <p className="mt-4 max-w-3xl text-ink-secondary leading-relaxed">These paths describe areas to explore. Members can search the course catalogue for each topic; the catalogue shows what is currently published.</p>
        <div className="mt-8">{learningTracks.map((track) => <article key={track.title} className="border-t border-surface-border py-8 sm:py-10 grid md:grid-cols-[1fr_1.2fr] gap-5 md:gap-12">
          <div><h3 className="text-2xl font-semibold tracking-tight">{track.title}</h3><p className="mt-3 text-ink-secondary leading-relaxed">{track.startingPoint}</p>{canUseWorkspace && <Link to={`/member/courses?search=${encodeURIComponent(track.search)}`} className="public-text-link mt-4 underline">{track.action}</Link>}</div>
          <div><p className="text-ink-secondary leading-relaxed">{track.outcome}</p><ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 list-disc pl-5 text-sm text-ink-secondary">{track.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul></div>
        </article>)}</div>
      </section>
      <section aria-labelledby="learning-next-step" className="mt-6 border-t border-surface-border pt-8">
        <h2 id="learning-next-step" className="text-2xl sm:text-3xl font-semibold tracking-tight">{canUseWorkspace ? 'Continue in your learning workspace.' : 'Learn with the club.'}</h2>
        <p className="mt-4 max-w-3xl text-ink-secondary leading-relaxed">{canUseWorkspace ? 'Browse published courses or return to a course you have already joined.' : 'The starter lesson is open to everyone. Member courses use a separate workspace; club admission includes an assessment and administrative review.'}</p>
        <div className="mt-6 flex flex-wrap gap-4">{canUseWorkspace ? <><Link to="/member/courses" className="public-action">Browse member courses</Link><Link to="/member/my-courses" className="public-action-secondary">My courses</Link></> : <><Link to="/learn/first-model" className="public-action">Try the public lesson</Link><Link to="/join" className="public-action-secondary">How to join the club</Link></>}</div>
      </section>
    </div>
  );
}
