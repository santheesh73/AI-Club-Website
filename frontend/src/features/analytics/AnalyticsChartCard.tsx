import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

export interface BreakdownItem {
  label: string;
  value: number;
  sublabel?: string;
  colorClass?: string;
}

interface AnalyticsChartCardProps {
  title: string;
  description?: string;
  items: BreakdownItem[];
  emptyMessage?: string;
  className?: string;
}

export const AnalyticsChartCard: React.FC<AnalyticsChartCardProps> = ({
  title,
  description,
  items,
  emptyMessage = 'No data available for this range',
  className,
}) => {
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card className={cn('p-5 flex flex-col', className)}>
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col justify-center">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">{emptyMessage}</div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const percentage = Math.round((item.value / maxValue) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink truncate pr-2">{item.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold text-ink">{item.value.toLocaleString()}</span>
                      {item.sublabel && (
                        <span className="text-ink-muted">({item.sublabel})</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        item.colorClass || 'bg-ink'
                      )}
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
