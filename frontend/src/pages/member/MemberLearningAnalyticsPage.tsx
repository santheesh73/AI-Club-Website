import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { intelligenceApi } from '@/services/intelligenceApi';
import type { MemberLearningAnalytics } from '@/types/intelligence';
import { MetricCard } from '@/features/analytics/MetricCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookOpen, CheckCircle, Flame, GraduationCap, ArrowRight } from 'lucide-react';

export const MemberLearningAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<MemberLearningAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLearningAnalytics() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await intelligenceApi.getMemberLearningAnalytics();
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error.message || 'Failed to load learning analytics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    loadLearningAnalytics();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-accent-orange" />
          <span>My Learning Analytics</span>
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Detailed metrics and telemetry on your course curriculums and lesson completion milestones.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-ink-muted" />
          <p className="text-xs text-ink-muted mt-3">Loading learning telemetry...</p>
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-rose-600 text-sm">{error}</Card>
      ) : !data ? (
        <EmptyState
          title="No learning data available"
          description="Enroll in club courses to start tracking your curriculum progress and skills."
        />
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Enrolled Courses"
              value={data.enrolledCoursesCount}
              subtext="Active curriculums"
              icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
            />
            <MetricCard
              label="Completed Courses"
              value={data.completedCoursesCount}
              subtext="Fully certified"
              icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            />
            <MetricCard
              label="Lessons Finished"
              value={data.lessonsCompletedCount}
              subtext="Lectures & modules"
              icon={<Flame className="w-5 h-5 text-amber-500" />}
            />
            <MetricCard
              label="Avg Progress"
              value={`${data.averageProgressPercentage}%`}
              subtext="Curriculum completion"
              icon={<GraduationCap className="w-5 h-5 text-accent-orange" />}
            />
          </div>

          {/* Active Courses Progress Breakdown */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-lg font-semibold text-ink">
                Course Progress Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentCourses.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-muted">
                  You are not enrolled in any courses yet.{' '}
                  <Link to="/member/courses" className="text-accent-orange underline font-semibold">
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {data.recentCourses.map((c) => (
                    <div key={c.courseId} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-ink">{c.title}</h4>
                          <span className="text-[11px] font-mono text-ink-muted uppercase">
                            Status: {c.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-ink">
                            {c.progressPercentage}%
                          </span>
                          <Link
                            to={`/member/courses/${c.slug}`}
                            className="p-1.5 rounded-full hover:bg-canvas border border-transparent hover:border-surface-border text-ink-secondary hover:text-ink transition-colors"
                            title="Go to Course"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className="h-full bg-ink rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(c.progressPercentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
