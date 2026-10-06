import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'success' | 'lavender' | 'orange' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-ink text-canvas',
    neutral: 'bg-surface-muted text-ink-secondary border border-surface-border',
    success: 'bg-accent-green-subtle text-accent-green-dark border border-accent-green/20',
    lavender: 'bg-accent-lavender-subtle text-accent-lavender-dark border border-accent-lavender/20',
    orange: 'bg-accent-orange-subtle text-accent-orange-dark border border-accent-orange/20',
    outline: 'border border-surface-border text-ink bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-pill text-xs font-medium tracking-wide uppercase',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
