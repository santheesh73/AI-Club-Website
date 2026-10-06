import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'card' | 'pill';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  rounded = 'card',
  ...props
}) => {
  const roundness = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    card: 'rounded-card',
    pill: 'rounded-pill',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-surface-muted border border-surface-border/50',
        roundness[rounded],
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
};
