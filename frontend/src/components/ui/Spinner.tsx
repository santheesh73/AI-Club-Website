import React from 'react';
import { cn } from '@/utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  label = 'Loading...',
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-3',
  };

  return (
    <div className="inline-flex items-center justify-center" role="status">
      <div
        className={cn(
          'animate-spin rounded-full border-surface-border border-t-ink',
          sizes[size],
          className
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};
