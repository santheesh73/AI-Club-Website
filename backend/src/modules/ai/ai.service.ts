import { supabaseAdmin } from '../../services/supabase';
import { logger } from '../../utils/logger';
import { auditService } from '../admin/audit.service';
import { analyticsService } from '../analytics/analytics.service';
import { AnalyticsPeriod } from '../analytics/analytics.types';
import { AiInsightDto } from './ai.types';

// In-memory cache for fallback / test mode
export const localMemoryAiInsights = new Map<string, AiInsightDto>();

export class AiIntelligenceService {
  /**
   * Reset local state for testing isolation
   */
  public resetLocalState(): void {
    localMemoryAiInsights.clear();
  }

  /**
   * Synthesize advisory insights from structured analytics context
   * Uses deterministic intelligence heuristics with graceful degradation
   */
  async generateAdvisoryInsight(
    period: AnalyticsPeriod = '30d',
    forceRefresh: boolean = false,
    actorId?: string
  ): Promise<AiInsightDto> {
    const cacheKey = `insight-${period}`;
    const cached = localMemoryAiInsights.get(cacheKey);

    // If cache is fresh (< 1 hour) and forceRefresh is false, return cached
    if (cached && !forceRefresh) {
      const cacheAgeMs = Date.now() - new Date(cached.createdAt).getTime();
      if (cacheAgeMs < 60 * 60 * 1000) {
        return cached;
      }
    }

    // 1. Gather authoritative aggregated metrics (strictly non-PII)
    const [overview, courses, events, community] = await Promise.all([
      analyticsService.getPlatformOverview(period),
      analyticsService.getCourseAnalytics(period),
      analyticsService.getEventAnalytics(period),
      analyticsService.getCommunityAnalytics(period),
    ]);

    // 2. Synthesize advisory analytical insights
    const courseCompRate = courses.courseCompletionRate;
    const eventCancelRate = events.cancellationRate;
    const openReportsCount = community.openReports;

    const summary = `AI CLUB platform engagement remains robust for the ${period} timeframe with ${overview.activeMembers} active student members, ${courses.publishedCourses} published curriculum tracks, and ${community.publishedProjects} community showcase projects.`;

    const platformOverview = `Overall platform health demonstrates strong intake momentum with ${overview.approvedApplications} approved applicants and ${overview.activeMembers} actively participating student members across campus departments.`;

    const memberEngagement = `High weekly participation registered with ${events.totalRegistrations} workshop reservations and ${courses.totalEnrollments} active course track enrollments. Event seat cancellation rate is low at ${eventCancelRate}%.`;

    let learningInsights = `Curriculum adoption is solid with ${courses.totalEnrollments} total enrollments across ${courses.publishedCourses} published courses.`;
    if (courseCompRate >= 25) {
      learningInsights += ` Completion rate stands at a healthy ${courseCompRate}% with ${courses.completedEnrollments} completed track credentials issued.`;
    } else {
      learningInsights += ` Average course progress is at ${courses.averageProgressPercentage}%. Increasing lab checkpoints may accelerate course completions.`;
    }

    const eventInsights = `Technical workshops and symposiums operate near capacity with ${events.totalRegistrations} total confirmed attendees across ${events.totalEvents} events. Cancellation rates remain minimal (${eventCancelRate}%).`;

    let communityInsights = `Member community showcases ${community.publishedProjects} active AI repositories and ${community.achievementsAwarded} earned milestone achievements.`;
    if (openReportsCount > 0) {
      communityInsights += ` Note: ${openReportsCount} community review reports are currently pending administrator moderation attention.`;
    } else {
      communityInsights += ` No open moderation violations or content reports currently pending.`;
    }

    const recommendations: string[] = [];
    if (openReportsCount > 0) {
      recommendations.push(`Review and resolve the ${openReportsCount} open community project report(s) in the Moderation Queue.`);
    }
    if (overview.pendingApplications > 0) {
      recommendations.push(`Evaluate ${overview.pendingApplications} pending entrance intake applications currently awaiting decision.`);
    }
    if (events.upcomingEvents <= 2) {
      recommendations.push(`Schedule additional interactive technical workshops for upcoming cohort milestones.`);
    }
    if (courses.courseCompletionRate < 30) {
      recommendations.push(`Host guided office hours or review sessions for introductory machine learning courses.`);
    }
    if (recommendations.length === 0) {
      recommendations.push(`Continue current curriculum scheduling and spotlight top featured community projects.`);
    }

    const id = `insight-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insight: AiInsightDto = {
      id,
      period,
      summary,
      platformOverview,
      memberEngagement,
      learningInsights,
      eventInsights,
      communityInsights,
      recommendations,
      metricsSnapshot: overview,
      createdAt: now,
    };

    localMemoryAiInsights.set(cacheKey, insight);

    // Persist to Supabase if available
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('ai_insights').insert({
          id,
          period,
          summary,
          platform_overview: platformOverview,
          member_engagement: memberEngagement,
          learning_insights: learningInsights,
          event_insights: eventInsights,
          community_insights: communityInsights,
          recommendations,
          metrics_snapshot: overview,
          created_by: actorId || null,
          created_at: now,
        });
      } catch (err) {
        logger.warn('Failed to persist AI insight to Supabase, cached locally:', { error: String(err) });
      }
    }

    if (actorId) {
      await auditService.createLog({
        actorId,
        action: 'AI_INSIGHT_GENERATED',
        entityType: 'AI_INSIGHT',
        entityId: id,
        metadata: { period, recommendationsCount: recommendations.length },
      });
    }

    return insight;
  }

  /**
   * Retrieve latest cached insight or generate fresh
   */
  async getLatestInsight(period: AnalyticsPeriod = '30d'): Promise<AiInsightDto> {
    const cacheKey = `insight-${period}`;
    const cached = localMemoryAiInsights.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('ai_insights')
          .select('*')
          .eq('period', period)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const loaded: AiInsightDto = {
            id: data.id,
            period: data.period as AnalyticsPeriod,
            summary: data.summary,
            platformOverview: data.platform_overview,
            memberEngagement: data.member_engagement,
            learningInsights: data.learning_insights,
            eventInsights: data.event_insights,
            communityInsights: data.community_insights,
            recommendations: data.recommendations || [],
            metricsSnapshot: data.metrics_snapshot || {},
            createdAt: data.created_at,
          };
          localMemoryAiInsights.set(cacheKey, loaded);
          return loaded;
        }
      } catch {
        // Fall back to on-demand generation
      }
    }

    return this.generateAdvisoryInsight(period, false);
  }
}

export const aiIntelligenceService = new AiIntelligenceService();
