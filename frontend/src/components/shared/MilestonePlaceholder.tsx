import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface MilestonePlaceholderProps {
  title: string;
  milestone: string;
  description: string;
  badge?: string;
}

export const MilestonePlaceholder: React.FC<MilestonePlaceholderProps> = ({
  title,
  milestone,
  description,
  badge = 'Architectural Foundation',
}) => {
  return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="neutral">{badge}</Badge>
            <span className="text-xs font-mono text-ink-muted">{milestone}</span>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base mt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-cardSm bg-surface-muted border border-surface-border text-xs text-ink-muted leading-relaxed">
            <strong className="text-ink font-medium">Milestone 1 Specification:</strong> This route is registered in the routing table with proper layouts and access guards. Business logic will be implemented in subsequent milestones per the system roadmap.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
