import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/features/notifications/useNotifications';
import { NotificationItemCard } from '@/features/notifications/NotificationItemCard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Bell, CheckCheck, Settings2, SlidersHorizontal, Check } from 'lucide-react';

export const MemberNotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'preferences'>('all');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  const {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    fetchPreferences,
    updatePreferences,
  } = useNotifications(false);

  const [localPrefs, setLocalPrefs] = useState({
    applicationUpdates: true,
    membershipUpdates: true,
    eventUpdates: true,
    courseUpdates: true,
    communityUpdates: true,
    systemNotifications: true,
  });

  useEffect(() => {
    if (activeTab === 'preferences') {
      fetchPreferences();
    } else {
      fetchNotifications(activeTab === 'unread');
    }
  }, [activeTab, fetchNotifications, fetchPreferences]);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        applicationUpdates: preferences.applicationUpdates,
        membershipUpdates: preferences.membershipUpdates,
        eventUpdates: preferences.eventUpdates,
        courseUpdates: preferences.courseUpdates,
        communityUpdates: preferences.communityUpdates,
        systemNotifications: preferences.systemNotifications,
      });
    }
  }, [preferences]);

  const handleTogglePref = (key: keyof typeof localPrefs) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPrefSaveSuccess(false);
    const result = await updatePreferences(localPrefs);
    setSavingPrefs(false);
    if (result.success) {
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Bell className="w-6 h-6 text-accent-orange" />
            <span>Notification Center</span>
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Stay up to date with events, courses, achievements, and announcements.
          </p>
        </div>

        {unreadCount > 0 && activeTab !== 'preferences' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            className="self-start sm:self-auto text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-pill transition-colors ${
            activeTab === 'all'
              ? 'bg-ink text-canvas shadow-subtle'
              : 'text-ink-secondary hover:text-ink hover:bg-surface-muted'
          }`}
        >
          All Notifications
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 text-xs font-semibold rounded-pill transition-colors flex items-center gap-1.5 ${
            activeTab === 'unread'
              ? 'bg-ink text-canvas shadow-subtle'
              : 'text-ink-secondary hover:text-ink hover:bg-surface-muted'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'unread'
                  ? 'bg-accent-orange text-white'
                  : 'bg-accent-orange-subtle text-accent-orange-dark'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 text-xs font-semibold rounded-pill transition-colors flex items-center gap-1.5 ml-auto ${
            activeTab === 'preferences'
              ? 'bg-ink text-canvas shadow-subtle'
              : 'text-ink-secondary hover:text-ink hover:bg-surface-muted'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Preferences</span>
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'preferences' ? (
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-ink-muted" />
              <span>Delivery Preferences</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Configure which alerts and notifications appear in your dashboard and notification bell.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4 pt-2">
            {[
              {
                key: 'applicationUpdates' as const,
                title: 'Application Updates',
                desc: 'Alerts regarding review progress, interviews, and status decisions.',
              },
              {
                key: 'membershipUpdates' as const,
                title: 'Membership & Renewal',
                desc: 'Notices on member verification, ID issuance, and status lifecycle.',
              },
              {
                key: 'eventUpdates' as const,
                title: 'Events & Workshops',
                desc: 'Invitations, registration confirmations, schedule updates, and reminders.',
              },
              {
                key: 'courseUpdates' as const,
                title: 'Courses & Learning',
                desc: 'Course releases, module enrollments, and completion credentials.',
              },
              {
                key: 'communityUpdates' as const,
                title: 'Projects & Achievements',
                desc: 'Community project spotlights, team invites, and badge awards.',
              },
              {
                key: 'systemNotifications' as const,
                title: 'System & Announcements',
                desc: 'Platform announcements, maintenance notices, and administrative broadcasts.',
              },
            ].map((pref) => (
              <div
                key={pref.key}
                className="flex items-center justify-between p-3.5 rounded-card-sm border border-surface-border bg-canvas/40"
              >
                <div>
                  <h4 className="text-sm font-semibold text-ink">{pref.title}</h4>
                  <p className="text-xs text-ink-muted mt-0.5">{pref.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={localPrefs[pref.key]}
                    onChange={() => handleTogglePref(pref.key)}
                  />
                  <div className="w-11 h-6 bg-surface-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ink"></div>
                </label>
              </div>
            ))}

            <div className="pt-4 flex items-center justify-between">
              {prefSaveSuccess && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Preferences updated successfully
                </span>
              )}
              <div className="ml-auto">
                <Button
                  size="sm"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className="rounded-pill text-xs font-semibold px-5"
                >
                  {savingPrefs ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-ink-muted" />
          <p className="text-xs text-ink-muted mt-3">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title={activeTab === 'unread' ? 'No unread notifications' : 'Your inbox is clear'}
          description={
            activeTab === 'unread'
              ? "You've caught up with all incoming updates."
              : 'Notifications from events, courses, and platform updates will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItemCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={(id) => markAsRead(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
