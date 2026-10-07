import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { SafeQuestion, QuestionOption } from '@/types/assessment';

interface QuestionCardProps {
  question: SafeQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOption?: QuestionOption;
  onSelectOption: (option: QuestionOption) => void;
  disabled?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  disabled = false,
}) => {
  const options: { key: QuestionOption; text: string }[] = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  const getDifficultyBadge = () => {
    switch (question.difficulty) {
      case 'easy':
        return <Badge variant="success">Easy</Badge>;
      case 'hard':
        return <Badge variant="error">Hard</Badge>;
      case 'medium':
      default:
        return <Badge variant="orange">Medium</Badge>;
    }
  };

  return (
    <div className="w-full bg-surface border border-surface-border rounded-card p-6 sm:p-8 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-ink-faint">•</span>
          <span className="text-xs font-medium text-ink-secondary bg-canvas-alt px-2.5 py-0.5 rounded-pill border border-surface-border">
            {question.category}
          </span>
        </div>
        <div>{getDifficultyBadge()}</div>
      </div>

      {/* Question Text */}
      <div className="py-2">
        <h3 className="text-base sm:text-lg font-medium text-ink leading-relaxed">
          {question.questionText}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-3 pt-2">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;
          return (
            <label
              key={opt.key}
              onClick={() => {
                if (!disabled) onSelectOption(opt.key);
              }}
              className={`flex items-start gap-4 p-4 rounded-card-sm border transition-all cursor-pointer ${
                isSelected
                  ? 'border-ink bg-surface-muted ring-1 ring-ink/20 shadow-sm'
                  : 'border-surface-border bg-surface hover:bg-canvas-alt/50 hover:border-ink-faint'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-mono font-bold mt-0.5 transition-colors ${
                  isSelected
                    ? 'bg-ink text-canvas'
                    : 'bg-canvas-alt border border-surface-border text-ink-secondary'
                }`}
              >
                {opt.key}
              </div>
              <div className="flex-1 text-sm text-ink leading-normal pt-0.5 select-none">
                {opt.text}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
