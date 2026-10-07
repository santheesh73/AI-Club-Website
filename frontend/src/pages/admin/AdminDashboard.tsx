import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/services/adminApi';
import type { AdminDashboardSummary } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Award,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDashboardSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      } else if (!res.success) {
        setError(res.error.message || 'Failed to load control center metrics');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching summary';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading control center metrics..." />
        <p className="text-xs text-ink-muted">Aggregating admissions data...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-semibold text-ink">Dashboard Data Unavailable</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {error || 'Unable to retrieve real database metrics.'}
        </p>
        <Button variant="primary" onClick={fetchSummary}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          <span>Retry Loading</span>
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Applications',
      value: summary.totalApplications,
      icon: FileText,
      color: 'text-ink',
      bg: 'bg-canvas-alt',
    },
    {
      label: 'Pending Committee Review',
      value: summary.pendingReview,
      icon: Clock,
      color: 'text-accent-orange-dark',
      bg: 'bg-accent-orange-subtle/60',
    },
    {
      label: 'Tests Completed',
      value: summary.testsCompleted,
      icon: CheckCircle2,
      color: 'text-accent-lavender-dark',
      bg: 'bg-accent-lavender-subtle/60',
    },
    {
      label: 'Approved Candidates',
      value: summary.approved,
      icon: CheckCircle2,
      color: 'text-accent-green-dark',
      bg: 'bg-accent-green-subtle/60',
    },
    {
      label: 'Waitlisted',
      value: summary.waitlisted,
      icon: Clock,
      color: 'text-ink-secondary',
      bg: 'bg-surface-muted',
    },
    {
      label: 'Rejected',
      value: summary.rejected,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'under_review':
        return <Badge variant="orange">Under Review</Badge>;
      case 'waitlisted':
        return <Badge variant="neutral">Waitlisted</Badge>;
      case 'rejected':
        return <Badge variant="error">Declined</Badge>;
      default:
        return <Badge variant="neutral">{status.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted uppercase">
            <span>AI CLUB CONTROL</span>
            <span>/</span>
            <span className="text-ink">Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
            Admissions Control Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/assessment">
            <Button variant="outline" size="sm" className="gap-1.5 shadow-subtle">
              <Sparkles className="h-3.5 w-3.5 text-accent-lavender" />
              <span>Question Bank & AI</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchSummary}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>
          <Link to="/admin/applications">
            <Button variant="primary" size="sm">
              <span>Review Queue</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-5 rounded-card bg-surface border border-surface-border shadow-soft space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted font-medium">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold font-mono ${card.color}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Secondary Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase text-ink-muted">
              Average Exam Performance
            </span>
            <p className="text-3xl font-bold font-mono text-ink">
              {summary.averageScore} <span className="text-sm font-normal text-ink-muted">/ 25</span>
            </p>
            <p className="text-xs text-ink-secondary">Across all completed applicant assessments</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-accent-lavender-subtle flex items-center justify-center text-accent-lavender-dark">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase text-ink-muted">
              Entrance Exam Pass Rate
            </span>
            <p className="text-3xl font-bold font-mono text-ink">{summary.passRate}%</p>
            <p className="text-xs text-ink-secondary">Candidates scoring ≥ 60% threshold</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-accent-green-subtle flex items-center justify-center text-accent-green-dark">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Recent Applications Feed */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div>
            <h3 className="text-base font-semibold text-ink">Recent Intake Submissions</h3>
            <p className="text-xs text-ink-muted">Latest candidates entering the admissions queue</p>
          </div>
          <Link to="/admin/applications">
            <Button variant="ghost" size="sm">
              <span>View All Applications</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {summary.recentApplications.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">
            No applicant submissions recorded in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted font-mono uppercase">
                  <th className="pb-3 font-semibold">Application</th>
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Dept / Year</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {summary.recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-canvas-alt/50 transition-colors">
                    <td className="py-3 font-mono font-medium text-ink">
                      {app.applicationNumber}
                    </td>
                    <td className="py-3 text-ink font-medium">{app.studentName}</td>
                    <td className="py-3 text-ink-secondary">
                      {app.department} • Yr {app.year}
                    </td>
                    <td className="py-3 font-mono text-ink">
                      {app.assessmentScore !== null ? `${app.assessmentScore}/25` : '—'}
                    </td>
                    <td className="py-3">{getStatusBadge(app.status)}</td>
                    <td className="py-3 text-right">
                      <Link to={`/admin/applications/${app.id}`}>
                        <Button variant="ghost" size="sm">
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
