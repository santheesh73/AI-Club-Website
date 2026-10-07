import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface AssessmentTimerProps {
  initialRemainingSeconds: number;
  onTimeExpired: () => void;
  isSubmitting?: boolean;
}

export const AssessmentTimer: React.FC<AssessmentTimerProps> = ({
  initialRemainingSeconds,
  onTimeExpired,
  isSubmitting = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(Math.max(0, initialRemainingSeconds));

  useEffect(() => {
    setSecondsLeft(Math.max(0, initialRemainingSeconds));
  }, [initialRemainingSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!isSubmitting) {
        onTimeExpired();
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isSubmitting) {
            onTimeExpired();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onTimeExpired, isSubmitting]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = secondsLeft <= 300 && secondsLeft > 60;
  const isCritical = secondsLeft <= 60;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-pill font-mono text-sm font-semibold transition-all ${
        isCritical
          ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
          : isWarning
          ? 'bg-accent-orange-subtle text-accent-orange-dark border border-accent-orange/30'
          : 'bg-canvas-alt text-ink border border-surface-border'
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="h-4 w-4 text-red-600 animate-bounce" />
      ) : (
        <Clock className="h-4 w-4 text-ink-muted" />
      )}
      <span>{formatted}</span>
      <span className="text-[11px] font-sans font-normal text-ink-muted hidden sm:inline">remaining</span>
    </div>
  );
};
