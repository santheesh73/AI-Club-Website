import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { intelligenceApi } from '@/services/intelligenceApi';
import type { MemberActivityItem } from '@/types/intelligence';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  History,
  Award,
  BookOpen,
  Calendar,
  FolderGit2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

function getActivityIcon(type: MemberActivityItem['type']) {
  switch (type) {
    case 'APPLICATION':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'MEMBERSHIP':
      return <Award className="w-4 h-4 text-blue-600" />;
    case 'EVENT':
      return <Calendar className="w-4 h-4 text-purple-600" />;
    case 'COURSE':
      return <BookOpen className="w-4 h-4 text-indigo-600" />;
    case 'PROJECT':
      return <FolderGit2 className="w-4 h-4 text-amber-600" />;
    case 'ACHIEVEMENT':
      return <Award className="w-4 h-4 text-yellow-500" />;
    default:
      return <History className="w-4 h-4 text-ink-muted" />;
  }
}

export const MemberActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<MemberActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivity() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await intelligenceApi.getMemberActivityTimeline();
        if (res.success) {
          setActivities(res.data);
        } else {
          setError(res.error.message || 'Failed to load activity timeline');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    loadActivity();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
          <History className="w-6 h-6 text-accent-orange" />
          <span>My Activity Timeline</span>
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Complete historical chronicle of your journey across the AI CLUB ecosystem.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-ink-muted" />
          <p className="text-xs text-ink-muted mt-3">Loading activity stream...</p>
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-rose-600 text-sm">{error}</Card>
      ) : activities.length === 0 ? (
        <EmptyState
          title="No recorded activities yet"
          description="Your engagements with courses, events, projects, and achievements will chronologically appear here."
        />
      ) : (
        <div className="relative border-l border-surface-border ml-4 sm:ml-6 pl-6 space-y-6">
          {activities.map((item) => {
            const date = new Date(item.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node bullet */}
                <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-surface border-2 border-surface-border flex items-center justify-center group-hover:border-ink transition-colors">
                  {getActivityIcon(item.type)}
                </div>

                {/* Content Card */}
                <div className="p-4 rounded-card border border-surface-border bg-surface shadow-subtle hover:border-ink-muted transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-ink-muted bg-canvas px-2 py-0.5 rounded border border-surface-border/50">
                      {item.type}
                    </span>
                    <span className="text-xs text-ink-muted font-mono">{date}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-ink mt-2">{item.title}</h3>
                  <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  {item.link && (
                    <div className="mt-3">
                      <Link
                        to={item.link}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent-orange hover:underline"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
