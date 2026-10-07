import React from 'react';
import { cn } from '@/utils/cn';

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'primary' | 'success' | 'accent';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  showLabel = false,
  size = 'md',
  className,
  variant = 'primary',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  const colorClass = {
    primary: 'bg-ink',
    success: 'bg-accent-green',
    accent: 'bg-accent-orange',
  }[variant];

  return (
    <div className={cn('w-full space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-mono text-ink-muted">
          <span>Progress</span>
          <span className="font-semibold text-ink">{clamped}%</span>
        </div>
      )}
      <div
        className={cn('w-full bg-surface-border rounded-full overflow-hidden', heightClass)}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${clamped}% complete`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
