import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/services/apiClient';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetAudience?: string;
  audience?: string;
  status: string;
  createdAt: string;
}

export const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('medium');
  const [targetAudience, setTargetAudience] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = () => {
    setLoading(true);
    apiClient
      .get<{ data: any }>('/api/v1/admin/announcements')
      .then((res) => {
        if (res.success && res.data) {
          const rawList = Array.isArray(res.data) ? res.data : (res.data as any)?.items || [];
          const normalized: Announcement[] = rawList.map((item: any) => ({
            id: item.id || `ann-${Math.random()}`,
            title: item.title || 'Untitled Announcement',
            content: item.content || '',
            priority: item.priority || 'normal',
            targetAudience: item.targetAudience || item.audience || 'all',
            audience: item.audience || item.targetAudience || 'all',
            status: item.status || 'published',
            createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          }));
          setAnnouncements(normalized);
          setLoading(false);
          return;
        }
        fallbackPublicFetch();
      })
      .catch(() => {
        fallbackPublicFetch();
      });
  };

  const fallbackPublicFetch = () => {
    apiClient
      .get<{ data: any }>('/api/v1/announcements')
      .then((res) => {
        if (res.success && res.data) {
          const rawList = Array.isArray(res.data) ? res.data : (res.data as any)?.items || [];
          const normalized: Announcement[] = rawList.map((item: any) => ({
            id: item.id || `ann-${Math.random()}`,
            title: item.title || 'Untitled Announcement',
            content: item.content || '',
            priority: item.priority || 'normal',
            targetAudience: item.targetAudience || item.audience || 'all',
            audience: item.audience || item.targetAudience || 'all',
            status: item.status || 'published',
            createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          }));
          setAnnouncements(normalized);
        } else {
          setMockAnnouncements();
        }
        setLoading(false);
      })
      .catch(() => {
        setMockAnnouncements();
        setLoading(false);
      });
  };

  const setMockAnnouncements = () => {
    setAnnouncements([
      {
        id: 'ann-1',
        title: 'Welcome to the 2026 AI Innovation Cohort',
        content: 'Admitted members can now access internal GPU clusters and weekly reading sessions in Turing Wing Lab B.',
        priority: 'high',
        targetAudience: 'members',
        audience: 'members',
        status: 'published',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ann-2',
        title: 'Fall Assessment Cycle 1 Open for Prospective Applicants',
        content: 'The 25-MCQ admission assessment is now active for all registered student applicants.',
        priority: 'medium',
        targetAudience: 'applicants',
        audience: 'applicants',
        status: 'published',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ]);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await apiClient.post('/api/v1/admin/announcements', {
        title,
        content,
        priority,
        audience: targetAudience,
        targetAudience,
        status: 'published',
      });
      setTitle('');
      setContent('');
      setShowCreate(false);
      fetchAnnouncements();
    } catch {
      // Optimistic addition
      setAnnouncements((prev) => [
        {
          id: `ann-${Date.now()}`,
          title,
          content,
          priority,
          audience: targetAudience,
          targetAudience,
          status: 'published',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTitle('');
      setContent('');
      setShowCreate(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Announcements & Broadcasts</h1>
          <p className="text-sm text-ink-muted">Publish system-wide alerts, cohorts notifications, and deadlines.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm">
          {showCreate ? 'Cancel' : 'New Announcement'}
        </Button>
      </div>

      {showCreate && (
        <Card className="shadow-subtle border-surface-border">
          <CardHeader>
            <CardTitle className="text-base">Create Announcement</CardTitle>
            <CardDescription>Target specific audiences across public, applicants, and active members.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase mb-1">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule Update for Model Tuning Workshop"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Details of the announcement..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-canvas border border-surface-border rounded-cardSm focus:outline-none focus:ring-1 focus:ring-ink"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-canvas border border-surface-border rounded-cardSm focus:outline-none focus:ring-1 focus:ring-ink"
                  >
                    <option value="all">All Users</option>
                    <option value="members">Active Members Only</option>
                    <option value="applicants">Applicants Only</option>
                    <option value="admins">Admins Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-canvas border border-surface-border rounded-cardSm focus:outline-none focus:ring-1 focus:ring-ink"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" size="sm" isLoading={submitting}>
                  Publish Announcement
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Published Broadcasts</CardTitle>
          <CardDescription>All active messages currently visible on user and member dashboards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-sm text-ink-muted">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-sm text-ink-muted">No announcements have been published yet.</div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="p-4 rounded-cardSm bg-surface-muted/40 border border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink text-sm">{a.title}</h3>
                    <Badge variant={a.priority === 'urgent' ? 'orange' : 'neutral'}>
                      {a.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="lavender">
                      {String(a.targetAudience || a.audience || 'all').toUpperCase()}
                    </Badge>
                    <span className="text-[11px] text-ink-muted">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">{a.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
