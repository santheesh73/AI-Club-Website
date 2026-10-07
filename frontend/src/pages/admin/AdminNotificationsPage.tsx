import React, { useState, useEffect, useCallback } from 'react';
import { intelligenceApi } from '@/services/intelligenceApi';
import type { NotificationItem } from '@/types/intelligence';
import { NotificationItemCard } from '@/features/notifications/NotificationItemCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, Megaphone, Send, Check } from 'lucide-react';

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  // Broadcast state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'member' | 'admin'>('all');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const fetchAdminNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const typeParam = filterType === 'all' ? undefined : filterType;
      const res = await intelligenceApi.getAdminNotifications(typeParam, 50, 0);
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setTotal(res.data.total);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchAdminNotifications();
  }, [fetchAdminNotifications]);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setBroadcasting(true);
    setBroadcastSuccess(null);
    try {
      const res = await intelligenceApi.broadcastAnnouncement({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        targetRole: broadcastTarget,
      });

      if (res.success && res.data) {
        setBroadcastSuccess(`Announcement broadcast to ${res.data.count} recipients.`);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setTimeout(() => {
          setShowBroadcastModal(false);
          setBroadcastSuccess(null);
        }, 2000);
        fetchAdminNotifications();
      }
    } catch {
      // Non-blocking
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Bell className="w-6 h-6 text-accent-orange" />
            <span>Admin Notification & Broadcast Center</span>
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Monitor incoming system events, application queues, moderation reports, and issue club-wide announcements.
          </p>
        </div>

        <Button
          onClick={() => setShowBroadcastModal(true)}
          className="rounded-pill text-xs font-semibold px-4 self-start sm:self-auto"
        >
          <Megaphone className="w-4 h-4 mr-1.5" />
          <span>New Broadcast</span>
        </Button>
      </div>

      {/* Broadcast Modal / Card */}
      {showBroadcastModal && (
        <Card className="p-6 border-accent-orange/40 bg-accent-orange-subtle/10">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-accent-orange" />
              <span>Broadcast Official Announcement</span>
            </CardTitle>
            <CardDescription className="text-xs">
              This notice will be immediately dispatched to members' inboxes and notification bells.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase mb-1">
                  Announcement Title
                </label>
                <Input
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. AI Club Hackathon 2026 Registration Open"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase mb-1">
                  Announcement Message
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter full announcement message for club members..."
                  rows={3}
                  required
                  className="w-full rounded-card-sm border border-surface-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase mb-1">
                    Audience Scope
                  </label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) =>
                      setBroadcastTarget(e.target.value as 'all' | 'member' | 'admin')
                    }
                    className="rounded-card-sm border border-surface-border bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                  >
                    <option value="all">All Users & Applicants</option>
                    <option value="member">Active Members Only</option>
                    <option value="admin">Administrators Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {broadcastSuccess && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {broadcastSuccess}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBroadcastModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={broadcasting}
                    className="text-xs font-semibold"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {broadcasting ? 'Sending...' : 'Dispatch Broadcast'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1 overflow-x-auto">
        {[
          { label: 'All Events', value: 'all' },
          { label: 'Applications', value: 'NEW_APPLICATION' },
          { label: 'Reports', value: 'NEW_REPORT' },
          { label: 'Alerts', value: 'SYSTEM_ALERT' },
          { label: 'Announcements', value: 'ADMIN_ANNOUNCEMENT' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilterType(tab.value)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-pill transition-colors whitespace-nowrap ${
              filterType === tab.value
                ? 'bg-ink text-canvas shadow-subtle'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono text-ink-muted">Total: {total}</span>
      </div>

      {/* Notification Stream */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-ink-muted" />
          <p className="text-xs text-ink-muted mt-3">Loading administrative stream...</p>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No administrative notifications"
          description="Incoming application submissions, moderation flags, and system events will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotificationItemCard key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
};
