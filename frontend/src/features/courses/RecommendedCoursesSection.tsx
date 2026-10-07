import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ExternalCourseCard } from './ExternalCourseCard';
import { externalCoursesApi } from '@/services/externalCoursesApi';
import type { CourseRecommendationDto, MemberLearningSignals } from '@/types/externalCourses';

export const RecommendedCoursesSection: React.FC = () => {
  const [recommendations, setRecommendations] = useState<CourseRecommendationDto[]>([]);
  const [signals, setSignals] = useState<MemberLearningSignals | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<boolean>(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);

  const fetchRecommendations = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await externalCoursesApi.getRecommendations({ forceRefresh, limit: 6 });

      if (response.success && response.data) {
        setRecommendations(response.data.recommendations || []);
        setSignals(response.data.signals || null);
        setCached(Boolean(response.data.cached));
        setRateLimitRemaining(
          typeof response.data.rateLimitRemaining === 'number'
            ? response.data.rateLimitRemaining
            : null
        );
      } else {
        setError(!response.success ? response.error.message : 'Unable to fetch recommendations');
      }

    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err?.message || 'Failed to load external course recommendations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const hasSignals =
    signals &&
    (signals.skills?.length > 0 ||
      signals.interests?.length > 0 ||
      signals.completedCourses?.length > 0 ||
      signals.projectTopics?.length > 0);

  return (
    <div className="space-y-6 pt-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-green/10 text-accent-green text-xs font-semibold font-mono border border-accent-green/20">
              <Sparkles className="h-3 w-3" />
              <span>AI Recommendation Engine</span>
            </span>
            {cached && (
              <span className="text-[11px] text-ink-muted font-mono hidden sm:inline">
                • Cached for performance
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight mt-1.5">
            Recommended For You
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5 max-w-xl">
            Curated external industry courses from Coursera, freeCodeCamp, Udemy, and Unstop matched to your technical profile and project journey.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {rateLimitRemaining !== null && (
            <span className="text-[11px] font-mono text-ink-muted hidden md:inline">
              {rateLimitRemaining} refreshes left
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchRecommendations(true)}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Recommendations'}</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 bg-surface/50 rounded-card border border-surface-border">
          <Spinner size="md" label="Analyzing learning profile..." />
          <p className="text-xs text-ink-muted">
            Matching skills, projects, and learning history against verified course catalog...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-card bg-surface border border-surface-border text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-orange-500 mx-auto" />
          <p className="text-sm font-semibold text-ink">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => fetchRecommendations(true)}>
            Try Again
          </Button>
        </div>
      ) : recommendations.length === 0 ? (
        // Empty State / Insufficient Signals State
        <div className="p-8 sm:p-10 rounded-card-lg bg-surface border border-surface-border text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-canvas border border-surface-border flex items-center justify-center mx-auto text-ink-muted">
            <UserCheck className="h-6 w-6 text-accent-green" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">
              {!hasSignals
                ? 'Complete your profile to get better course recommendations'
                : 'No course recommendations available right now'}
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-md mx-auto leading-relaxed">
              {!hasSignals
                ? 'Add your technical skills, research interests, and project portfolio in your member profile so our AI engine can tailor learning paths for you.'
                : 'Our recommendation engine will refresh candidates shortly. You can also trigger an on-demand refresh.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link to="/member/profile">
              <Button variant="primary" size="sm" className="gap-1.5">
                <span>Update Member Profile</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchRecommendations(true)}
              disabled={isRefreshing}
            >
              Refresh Now
            </Button>
          </div>
        </div>
      ) : (
        // Recommendations Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <ExternalCourseCard key={rec.course.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
};
