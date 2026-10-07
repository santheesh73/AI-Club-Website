import React from 'react';
import type { QuestionOption } from '@/types/assessment';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, QuestionOption>;
  questionIds: string[];
  onSelectIndex: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  onSelectIndex,
}) => {
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="w-full bg-surface border border-surface-border rounded-card p-5 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase font-mono tracking-wider text-ink-muted">
          Question Palette
        </h4>
        <span className="text-xs font-mono font-medium text-ink">
          {answeredCount}/{totalQuestions} Answered
        </span>
      </div>

      {/* Grid of 25 buttons */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const qId = questionIds[i];
          const isAnswered = !!(qId && answers[qId]);
          const isCurrent = currentIndex === i;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectIndex(i)}
              className={`h-9 w-full rounded-lg font-mono text-xs font-semibold flex items-center justify-center transition-all ${
                isCurrent
                  ? 'bg-ink text-canvas ring-2 ring-ink ring-offset-2 ring-offset-surface'
                  : isAnswered
                  ? 'bg-accent-green-subtle text-accent-green-dark border border-accent-green/30 hover:bg-accent-green-subtle/80'
                  : 'bg-canvas-alt text-ink-muted border border-surface-border hover:border-ink-faint hover:text-ink'
              }`}
              title={`Jump to Question ${i + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
              aria-label={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-surface-border grid grid-cols-3 gap-1 text-[11px] text-ink-muted text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink" />
          <span>Current</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-green" />
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-surface-border" />
          <span>Left ({unansweredCount})</span>
        </div>
      </div>
    </div>
  );
};
