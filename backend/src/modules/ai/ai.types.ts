import { AnalyticsPeriod, PlatformOverviewMetrics } from '../analytics/analytics.types';

export interface AiInsightDto {
  id: string;
  period: AnalyticsPeriod;
  summary: string;
  platformOverview: string;
  memberEngagement: string;
  learningInsights: string;
  eventInsights: string;
  communityInsights: string;
  recommendations: string[];
  metricsSnapshot: Partial<PlatformOverviewMetrics>;
  createdAt: string;
}

export interface GenerateInsightRequestDto {
  period: AnalyticsPeriod;
  forceRefresh?: boolean;
}
