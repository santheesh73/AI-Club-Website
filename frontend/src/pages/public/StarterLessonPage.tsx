import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TinyClassifier } from '@/features/publicLearning/TinyClassifier';

export function StarterLessonPage() {
  const [answer, setAnswer] = useState<'training' | 'unseen' | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-20">
      <Link to="/learn" className="public-text-link">Back to learning</Link>
      <header className="mt-5 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">Teach a rule. Find its limits.</h1>
        <p className="mt-6 text-lg text-ink-secondary leading-relaxed">Your first model can be one adjustable rule. In this self-paced lesson, predict a flower’s label from its petal length, then test the rule on examples it has not seen.</p>
        <p className="mt-4 text-sm text-ink-secondary">No account, code, or prior AI knowledge required. All measurements and flower labels below are invented for this exercise.</p>
      </header>
      <section aria-labelledby="model-example-heading" className="mt-12 sm:mt-16 border-t border-surface-border pt-8 grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-16">
        <div>
          <h2 id="model-example-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight">One feature. One boundary.</h2>
          <p className="mt-4 text-ink-secondary leading-relaxed">We know the labels of six training flowers. Their Meadow petals measure 10, 14, and 18 mm; their Ridge petals measure 30, 36, and 42 mm. A boundary at 24 mm separates those training examples.</p>
          <dl className="mt-6 space-y-4 text-sm leading-relaxed">
            <div><dt className="font-semibold">Feature</dt><dd className="mt-1 text-ink-secondary">The measured input: petal length in millimetres.</dd></div>
            <div><dt className="font-semibold">Label</dt><dd className="mt-1 text-ink-secondary">The answer we want to predict: Meadow or Ridge.</dd></div>
            <div><dt className="font-semibold">Parameter</dt><dd className="mt-1 text-ink-secondary">The adjustable boundary. You choose it here; a training algorithm could choose it by comparing predictions with known labels.</dd></div>
          </dl>
          <p className="mt-6 text-ink-secondary leading-relaxed">Try 12 mm, then 24 mm, then 39 mm. Compare both scores. Can one boundary correctly label all three held-out flowers?</p>
        </div>
        <div className="rounded-xl bg-canvas-alt p-5 sm:p-8"><TinyClassifier /></div>
      </section>
      <section aria-labelledby="model-limit-heading" className="mt-12 sm:mt-16 max-w-3xl">
        <h2 id="model-limit-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight">A perfect training score is only the beginning.</h2>
        <p className="mt-4 text-ink-secondary leading-relaxed">At 24 mm, the model gets every training label right. It still gets the 38 mm Meadow test flower wrong. Moving the boundary above 38 mm fixes that flower but mislabels shorter Ridge flowers. A single length threshold cannot describe these overlapping labels.</p>
        <p className="mt-4 text-ink-secondary leading-relaxed">A useful next experiment could measure petal width, collect more representative examples, or try a different rule. Changing the model to chase these test answers would also make this test less independent; you would need fresh examples to evaluate the new model.</p>
        <fieldset className="mt-8 border-t border-surface-border pt-6">
          <legend className="float-left w-full text-lg font-semibold mb-4">Which evidence better checks whether a model generalizes?</legend>
          <div className="clear-both space-y-3">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed"><input type="radio" name="generalization-check" value="training" checked={answer === 'training'} onChange={() => setAnswer('training')} className="mt-1 h-4 w-4 accent-ink" /><span>A perfect score on the examples used to choose its boundary.</span></label>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed"><input type="radio" name="generalization-check" value="unseen" checked={answer === 'unseen'} onChange={() => setAnswer('unseen')} className="mt-1 h-4 w-4 accent-ink" /><span>Its score on fresh examples kept separate from training.</span></label>
          </div>
          {answer && <p role="status" aria-label="Knowledge check feedback" className="mt-4 text-sm text-ink-secondary leading-relaxed">{answer === 'unseen' ? 'Yes. Separate examples reveal errors the training score can hide. They still need to represent the situations where the model will be used.' : 'That tells you how well the rule fits its training examples. Check separate examples to learn whether it works beyond them.'}</p>}
        </fieldset>
      </section>
      <nav aria-label="Continue learning" className="mt-12 border-t border-surface-border pt-8 flex flex-wrap gap-4"><Link to="/learn" className="public-action">Explore learning paths</Link><Link to="/join" className="public-action-secondary">How club membership works</Link></nav>
    </div>
  );
}
