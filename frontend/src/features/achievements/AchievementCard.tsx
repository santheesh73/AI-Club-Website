import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { AchievementDto } from '@/types/community';
import { Award, ExternalLink, Calendar, Building, Edit2, Trash2 } from 'lucide-react';

interface AchievementCardProps {
  achievement: AchievementDto;
  onEdit?: (achievement: AchievementDto) => void;
  onDelete?: (achievementId: string) => void;
  showActions?: boolean;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  return (
    <Card className="flex flex-col h-full hover:shadow-card-hover transition-all duration-200 border-surface-border">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Badge variant="orange" className="text-[10px] tracking-wider">
          {achievement.category.name}
        </Badge>

        {showActions && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(achievement)}
                className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
                title="Edit Achievement"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(achievement.id)}
                className="p-1 rounded text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete Achievement"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-accent-orange-subtle text-accent-orange-dark flex items-center justify-center shrink-0 mt-0.5">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-base text-ink leading-snug line-clamp-2">
            {achievement.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {achievement.issuer}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {achievement.issuedAt}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-ink-secondary leading-relaxed line-clamp-3 mb-4 mt-1">
        {achievement.description}
      </p>

      {/* Footer Details: Credential ID / Link */}
      <div className="mt-auto pt-3 border-t border-surface-border flex items-center justify-between text-xs text-ink-muted">
        {achievement.credentialId ? (
          <span className="font-mono text-[11px] bg-surface-muted px-2 py-0.5 rounded border border-surface-border truncate max-w-[150px]">
            ID: {achievement.credentialId}
          </span>
        ) : (
          <span />
        )}

        {achievement.credentialUrl && (
          <a
            href={achievement.credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-ink font-medium hover:text-accent-orange-dark transition-colors"
          >
            <span>Verify Credential</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </Card>
  );
};
