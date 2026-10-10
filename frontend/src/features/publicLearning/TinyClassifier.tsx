import { useId, useState } from 'react';

type FlowerLabel = 'Meadow' | 'Ridge';
type Sample = { id: string; length: number; label: FlowerLabel; split: 'training' | 'test' };

export const DEFAULT_BOUNDARY = 24;
export const FLOWER_SAMPLES: readonly Sample[] = [
  { id: 'T1', length: 10, label: 'Meadow', split: 'training' },
  { id: 'T2', length: 14, label: 'Meadow', split: 'training' },
  { id: 'T3', length: 18, label: 'Meadow', split: 'training' },
  { id: 'T4', length: 30, label: 'Ridge', split: 'training' },
  { id: 'T5', length: 36, label: 'Ridge', split: 'training' },
  { id: 'T6', length: 42, label: 'Ridge', split: 'training' },
  { id: 'U1', length: 22, label: 'Meadow', split: 'test' },
  { id: 'U2', length: 27, label: 'Ridge', split: 'test' },
  { id: 'U3', length: 38, label: 'Meadow', split: 'test' },
];

export const predictFlower = (length: number, boundary: number): FlowerLabel => length >= boundary ? 'Ridge' : 'Meadow';

const score = (split: Sample['split'], boundary: number) => {
  const samples = FLOWER_SAMPLES.filter((sample) => sample.split === split);
  return { correct: samples.filter((sample) => predictFlower(sample.length, boundary) === sample.label).length, total: samples.length };
};

export function TinyClassifier({ compact = false }: { compact?: boolean }) {
  const [boundary, setBoundary] = useState(DEFAULT_BOUNDARY);
  const inputId = useId();
  const descriptionId = useId();
  const training = score('training', boundary);
  const test = score('test', boundary);
  const x = (length: number) => 60 + (length - 8) * 8;
  const y = (sample: Sample) => sample.split === 'training' ? 46 : 98;
  const counterexamplePrediction = predictFlower(38, boundary);

  return (
    <div className={compact ? 'w-full max-w-md' : 'w-full'}>
      <p className="text-sm text-ink-secondary leading-relaxed">A tiny classifier, using illustrative flower measurements. Circle = Meadow. Square = Ridge.</p>
      <svg viewBox="0 0 380 166" role="img" aria-label={`Petal lengths with a classification boundary at ${boundary} millimetres. Six training samples and three held-out samples; shapes show their known labels.`} className="mt-5 w-full text-ink">
        <text x="6" y="50" fontSize="11" fill="currentColor">Train</text>
        <text x="6" y="102" fontSize="11" fill="currentColor">Test</text>
        <line x1="52" x2="352" y1="46" y2="46" stroke="currentColor" strokeOpacity="0.15" />
        <line x1="52" x2="352" y1="98" y2="98" stroke="currentColor" strokeOpacity="0.15" />
        <line x1={x(boundary)} x2={x(boundary)} y1="20" y2="117" stroke="var(--learning-accent, #8D3F2D)" strokeWidth="2" strokeDasharray="4 4" />
        <text x={x(boundary)} y="13" textAnchor="middle" fontSize="11" fill="var(--learning-accent, #8D3F2D)">{boundary} mm</text>
        {FLOWER_SAMPLES.map((sample) => sample.label === 'Meadow'
          ? <circle key={sample.id} cx={x(sample.length)} cy={y(sample)} r="6" fill="currentColor"><title>{sample.id}: {sample.length} mm, known label Meadow, predicted {predictFlower(sample.length, boundary)}</title></circle>
          : <rect key={sample.id} x={x(sample.length) - 6} y={y(sample) - 6} width="12" height="12" fill="var(--learning-accent, #8D3F2D)"><title>{sample.id}: {sample.length} mm, known label Ridge, predicted {predictFlower(sample.length, boundary)}</title></rect>)}
        {[10, 20, 30, 40].map((length) => <g key={length}><line x1={x(length)} x2={x(length)} y1="125" y2="130" stroke="currentColor" /><text x={x(length)} y="143" textAnchor="middle" fontSize="11" fill="currentColor">{length}</text></g>)}
        <text x="204" y="163" textAnchor="middle" fontSize="11" fill="currentColor">Petal length (mm)</text>
      </svg>
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><label htmlFor={inputId} className="font-semibold text-sm">Move the decision boundary</label><output htmlFor={inputId} className="font-semibold tabular-nums text-sm">{boundary} mm</output></div>
        <input id={inputId} type="range" min="12" max="40" step="1" value={boundary} onChange={(event) => setBoundary(Number(event.target.value))} aria-describedby={descriptionId} aria-valuetext={`${boundary} millimetres`} className="mt-2 min-h-11 w-full cursor-pointer accent-ink" />
        <p id={descriptionId} className="text-sm text-ink-secondary leading-relaxed">Below {boundary} mm → Meadow. At least {boundary} mm → Ridge. Use arrow keys to adjust.</p>
      </div>
      <div aria-live="polite" aria-atomic="true" className="mt-5 border-t border-surface-border pt-4 text-sm leading-relaxed">
        <p className="font-semibold tabular-nums">Training: {training.correct}/{training.total} correct · Held-out: {test.correct}/{test.total} correct</p>
        <p className="mt-2 text-ink-secondary">The 38 mm test flower is Meadow. This rule predicts {counterexamplePrediction}{counterexamplePrediction === 'Meadow' ? ' correctly, but check what changed for the other samples.' : '—an error. One measurement does not explain every label.'}</p>
      </div>
      <button type="button" onClick={() => setBoundary(DEFAULT_BOUNDARY)} className="public-text-link mt-2 underline">Reset to 24 mm</button>
      {!compact && <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm tabular-nums">
          <caption className="mb-3 text-left font-semibold">Check the held-out examples</caption>
          <thead><tr className="border-b border-surface-border"><th scope="col" className="py-3 pr-3 font-medium">Petal</th><th scope="col" className="py-3 pr-3 font-medium">Known label</th><th scope="col" className="py-3 font-medium">Prediction</th></tr></thead>
          <tbody>{FLOWER_SAMPLES.filter((sample) => sample.split === 'test').map((sample) => {
            const prediction = predictFlower(sample.length, boundary);
            return <tr key={sample.id} className="border-b border-surface-border"><th scope="row" className="py-3 pr-3 font-medium">{sample.length} mm</th><td className="py-3 pr-3">{sample.label}</td><td className="py-3">{prediction}<span className="block text-xs text-ink-secondary">{prediction === sample.label ? 'Correct' : 'Incorrect'}</span></td></tr>;
          })}</tbody>
        </table>
      </div>}
    </div>
  );
}
