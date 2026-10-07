import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Calendar,
  Trophy,
  Sparkles,
  ShieldAlert,
  Megaphone,
  CheckCircle,
  AlertTriangle,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';
import type { NotificationItem, NotificationType } from '@/types/intelligence';
import { cn } from '@/utils/cn';

interface NotificationItemCardProps {
  notification: NotificationItem;
  onMarkAsRead?: (id: string) => void;
  compact?: boolean;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'APPLICATION_STATUS_CHANGED':
    case 'MEMBERSHIP_ACTIVATED':
      return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    case 'EVENT_PUBLISHED':
    case 'EVENT_REGISTRATION_CONFIRMED':
    case 'EVENT_REMINDER':
      return <Calendar className="w-5 h-5 text-blue-600" />;
    case 'EVENT_CANCELLED':
      return <Calendar className="w-5 h-5 text-rose-600" />;
    case 'COURSE_PUBLISHED':
    case 'COURSE_ENROLLMENT_CONFIRMED':
    case 'COURSE_COMPLETED':
      return <BookOpen className="w-5 h-5 text-purple-600" />;
    case 'ACHIEVEMENT_UNLOCKED':
      return <Trophy className="w-5 h-5 text-amber-500" />;
    case 'PROJECT_FEATURED':
      return <Sparkles className="w-5 h-5 text-amber-600" />;
    case 'PROJECT_MODERATION':
      return <FolderGit2 className="w-5 h-5 text-rose-600" />;
    case 'ADMIN_ANNOUNCEMENT':
      return <Megaphone className="w-5 h-5 text-indigo-600" />;
    case 'SYSTEM_ALERT':
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    case 'NEW_APPLICATION':
    case 'NEW_REPORT':
    case 'COURSE_ACTIVITY_ALERT':
    case 'EVENT_ACTIVITY_ALERT':
      return <ShieldAlert className="w-5 h-5 text-red-600" />;
    default:
      return <Bell className="w-5 h-5 text-ink-muted" />;
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const NotificationItemCard: React.FC<NotificationItemCardProps> = ({
  notification,
  onMarkAsRead,
  compact = false,
}) => {
  const isUnread = !notification.readAt;

  const handleClick = () => {
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex items-start gap-3 rounded-card transition-all duration-150',
        compact ? 'p-3 hover:bg-surface-muted/60' : 'p-4 border border-surface-border bg-surface hover:shadow-subtle',
        isUnread ? 'bg-amber-50/20' : 'bg-surface'
      )}
    >
      <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-canvas border border-surface-border/60">
        {getNotificationIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                'text-sm truncate',
                isUnread ? 'font-semibold text-ink' : 'font-medium text-ink-secondary'
              )}
            >
              {notification.title}
            </h4>
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-accent-orange shrink-0 animate-pulse" />
            )}
          </div>
          <span className="text-xs text-ink-muted whitespace-nowrap shrink-0">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p
          className={cn(
            'text-sm text-ink-secondary mt-1 leading-relaxed',
            compact && 'line-clamp-2 text-xs'
          )}
        >
          {notification.message}
        </p>

        {notification.actionUrl && (
          <div className="mt-2.5 flex items-center gap-2">
            {notification.actionUrl.startsWith('http') ? (
              <a
                href={notification.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent-orange hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <span>View Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <Link
                to={notification.actionUrl}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent-orange hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <span>View Details</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}
      </div>

      {isUnread && onMarkAsRead && !compact && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          title="Mark as read"
          className="shrink-0 text-xs text-ink-muted hover:text-ink px-2 py-1 rounded-pill hover:bg-canvas border border-transparent hover:border-surface-border transition-colors"
        >
          Mark read
        </button>
      )}
    </div>
  );
};
