import React, { useState, useEffect, useCallback } from 'react';
import { intelligenceApi } from '@/services/intelligenceApi';
import type { AiInsight, AnalyticsPeriod } from '@/types/intelligence';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  Sparkles,
  RefreshCw,
  Lightbulb,
  ShieldCheck,
  BookOpen,
  Calendar,
  FolderGit2,
  Users,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const AdminIntelligencePage: React.FC = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await intelligenceApi.getAdminIntelligence(period);
      if (res.success) {
        setInsight(res.data);
      } else {
        setError(res.error.message || 'Failed to synthesize AI advisory report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await intelligenceApi.refreshAdminIntelligence(period);
      if (res.success) {
        setInsight(res.data);
      } else {
        setError(res.error.message || 'Failed to refresh AI intelligence');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent-orange" />
            <span>AI Platform Intelligence & Advisory</span>
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Autonomous analytical synthesis across platform telemetry, learner patterns, and club momentum.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-surface border border-surface-border p-1 rounded-pill">
            {(['7d', '30d', '90d', '12m', 'all'] as AnalyticsPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-semibold rounded-pill transition-colors ${
                  period === p
                    ? 'bg-ink text-canvas shadow-subtle'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="rounded-pill text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Analyzing...' : 'Refresh AI'}</span>
          </Button>
        </div>
      </div>

      {/* Advisory Guardrails Banner */}
      <div className="p-4 rounded-card border border-emerald-200 bg-emerald-50/40 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <p className="font-semibold">Advisory Architecture & Privacy Guardrail Active</p>
          <p className="mt-0.5 text-emerald-800">
            Insights are computed exclusively from anonymized aggregate metrics. No Personally Identifiable Information (PII) is processed. AI recommendations are strictly advisory and cannot execute state changes or record mutations without administrative verification.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-ink-muted" />
          <p className="text-xs text-ink-muted mt-3">Synthesizing platform intelligence...</p>
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-rose-600 text-sm">{error}</Card>
      ) : !insight ? (
        <Card className="p-6 text-center text-ink-muted text-sm">No insight available</Card>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <Card className="p-6 border-l-4 border-l-accent-orange bg-surface">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
              <span className="font-mono uppercase font-semibold text-accent-orange">
                Executive Synthesis • {period.toUpperCase()}
              </span>
              <span className="font-mono">
                Generated {new Date(insight.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-ink mb-2">Platform Trajectory Summary</h2>
            <p className="text-sm text-ink-secondary leading-relaxed">{insight.summary}</p>
          </Card>

          {/* Strategic Recommendations Card */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span>Actionable Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2.5">
              {insight.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-card-sm bg-canvas border border-surface-border"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-ink font-medium leading-relaxed">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Domain Specific Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Overview */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-ink">Platform Overview</h3>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {insight.platformOverview}
              </p>
            </Card>

            {/* Member Engagement */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-ink">Member Engagement</h3>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {insight.memberEngagement}
              </p>
            </Card>

            {/* Learning Insights */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-ink">Curriculum & Learning</h3>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {insight.learningInsights}
              </p>
            </Card>

            {/* Events Insights */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-ink">Events & Workshops</h3>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {insight.eventInsights}
              </p>
            </Card>
          </div>

          {/* Community Insights full width */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FolderGit2 className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-semibold text-ink">Community Showcase & Badges</h3>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {insight.communityInsights}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};
