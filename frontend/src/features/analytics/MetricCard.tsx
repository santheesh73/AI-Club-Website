import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  className,
}) => {
  return (
    <Card className={cn('relative overflow-hidden p-5 flex flex-col justify-between', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">{label}</p>
        {icon && (
          <div className="p-2 rounded-xl bg-canvas border border-surface-border text-ink-secondary">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{value}</div>
        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'font-semibold px-1.5 py-0.5 rounded-sm',
                  trend.isPositive
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-rose-700 bg-rose-50'
                )}
              >
                {trend.value}
              </span>
            )}
            {subtext && <span className="text-ink-muted">{subtext}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};
