import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useNotifications } from './useNotifications';
import { NotificationItemCard } from './NotificationItemCard';
import { cn } from '@/utils/cn';

interface NotificationBellProps {
  viewAllLink?: string;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  viewAllLink = '/member/notifications',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } =
    useNotifications(true);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications(false, 5, 0);
    }
    setIsOpen(!isOpen);
  };

  const previewNotifications = notifications.slice(0, 5);

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative p-2 rounded-full text-ink-secondary hover:text-ink hover:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent-orange/40"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-accent-orange rounded-full shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-card bg-surface border border-surface-border shadow-card z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-canvas/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-ink">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-accent-orange-subtle text-accent-orange-dark font-medium px-2 py-0.5 rounded-pill">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-accent-orange transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border/50">
            {previewNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Inbox className="w-8 h-8 text-ink-muted/50 mb-2" />
                <p className="text-sm font-medium text-ink-secondary">No notifications yet</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  You're completely up to date.
                </p>
              </div>
            ) : (
              previewNotifications.map((item) => (
                <NotificationItemCard
                  key={item.id}
                  notification={item}
                  compact={true}
                  onMarkAsRead={(id) => markAsRead(id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-surface-border bg-canvas/40 text-center">
            <Link
              to={viewAllLink}
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-ink hover:text-accent-orange transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
