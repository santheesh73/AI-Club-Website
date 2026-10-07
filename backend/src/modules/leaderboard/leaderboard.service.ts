import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { auditService } from '../admin/audit.service';
import { logger } from '../../utils/logger';

export interface LeaderboardMemberDto {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  department?: string;
  role: string;
  totalPoints: number;
  contributionCount: number;
  lastActiveAt?: string;
  rank: number;
}

export interface ContributionRuleDto {
  id: string;
  activityType: string;
  displayName: string;
  points: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberContributionDto {
  id: string;
  userId: string;
  activityType: string;
  entityType: string;
  entityId: string;
  points: number;
  idempotencyKey?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export class LeaderboardService {
  /**
   * Retrieves active leaderboard rules
   */
  async getRules(): Promise<ContributionRuleDto[]> {
    if (!supabaseAdmin) {
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('contribution_rules')
      .select('*')
      .order('points', { ascending: false });

    if (error) {
      throw new AppError(`Failed to fetch contribution rules: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return (data || []).map((row) => ({
      id: row.id,
      activityType: row.activity_type,
      displayName: row.display_name,
      points: Number(row.points),
      description: row.description || undefined,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Admin: Update points for an existing contribution rule
   */
  async updateRule(
    activityType: string,
    points: number,
    actorId: string,
    requestId?: string
  ): Promise<ContributionRuleDto> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    if (points < 0) {
      throw new AppError('Points must be a positive integer', 400, 'BAD_REQUEST');
    }

    const { data, error } = await supabaseAdmin
      .from('contribution_rules')
      .update({ points, updated_at: new Date().toISOString() })
      .eq('activity_type', activityType)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Failed to update contribution rule: ${error?.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'CONTRIBUTION_RULE_UPDATED',
      entityType: 'CONTRIBUTION_RULE',
      entityId: data.id,
      metadata: { activityType, newPoints: points },
      requestId,
    });

    return {
      id: data.id,
      activityType: data.activity_type,
      displayName: data.display_name,
      points: Number(data.points),
      description: data.description,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Idempotently awards contribution points to a member
   */
  async awardPoints(params: {
    userId: string;
    activityType: string;
    entityType: string;
    entityId: string;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ awarded: boolean; points: number; contributionId?: string }> {
    if (!supabaseAdmin) {
      return { awarded: false, points: 0 };
    }

    const key = params.idempotencyKey || `${params.userId}_${params.activityType}_${params.entityId}`;

    // 1. Look up rule points
    const { data: rule } = await supabaseAdmin
      .from('contribution_rules')
      .select('points')
      .eq('activity_type', params.activityType)
      .eq('is_active', true)
      .maybeSingle();

    const points = rule ? Number(rule.points) : 10;

    // 2. Insert into member_contributions with unique idempotency_key
    const { data, error } = await supabaseAdmin
      .from('member_contributions')
      .insert({
        user_id: params.userId,
        activity_type: params.activityType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        points,
        idempotency_key: key,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique violation: Points already awarded for this entity/activity
        logger.info(`Points already awarded for idempotency key ${key}`);
        return { awarded: false, points: 0 };
      }
      logger.error('Failed to award contribution points', { error: error.message });
      return { awarded: false, points: 0 };
    }

    return { awarded: true, points, contributionId: data.id };
  }

  /**
   * Retrieves overall leaderboard ranking
   */
  async getLeaderboard(limit = 50): Promise<LeaderboardMemberDto[]> {
    if (!supabaseAdmin) {
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('leaderboard_view')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(`Failed to fetch leaderboard: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return (data || []).map((row, index) => ({
      userId: row.user_id,
      fullName: row.full_name || 'Member',
      avatarUrl: row.avatar_url || undefined,
      department: row.department || undefined,
      role: row.role || 'member',
      totalPoints: Number(row.total_points) || 0,
      contributionCount: Number(row.contribution_count) || 0,
      lastActiveAt: row.last_active_at || undefined,
      rank: Number(row.rank) || index + 1,
    }));
  }

  /**
   * Retrieves specific member's rank and recent contribution history
   */
  async getMemberRankAndHistory(userId: string): Promise<{
    memberRank?: LeaderboardMemberDto;
    recentContributions: MemberContributionDto[];
  }> {
    if (!supabaseAdmin) {
      return { recentContributions: [] };
    }

    // 1. Get member's rank row
    const { data: memberRow } = await supabaseAdmin
      .from('leaderboard_view')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const memberRank: LeaderboardMemberDto | undefined = memberRow
      ? {
          userId: memberRow.user_id,
          fullName: memberRow.full_name || 'Member',
          avatarUrl: memberRow.avatar_url || undefined,
          department: memberRow.department || undefined,
          role: memberRow.role || 'member',
          totalPoints: Number(memberRow.total_points) || 0,
          contributionCount: Number(memberRow.contribution_count) || 0,
          lastActiveAt: memberRow.last_active_at || undefined,
          rank: Number(memberRow.rank) || 1,
        }
      : undefined;

    // 2. Get recent contributions
    const { data: contributions } = await supabaseAdmin
      .from('member_contributions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentContributions: MemberContributionDto[] = (contributions || []).map((c) => ({
      id: c.id,
      userId: c.user_id,
      activityType: c.activity_type,
      entityType: c.entity_type,
      entityId: c.entity_id,
      points: Number(c.points),
      idempotencyKey: c.idempotency_key,
      metadata: c.metadata || {},
      createdAt: c.created_at,
    }));

    return {
      memberRank,
      recentContributions,
    };
  }

  /**
   * Admin: Correct contribution points with mandatory audit log
   */
  async adminCorrectContribution(params: {
    targetUserId: string;
    points: number;
    reason: string;
    actorId: string;
    requestId?: string;
  }): Promise<{ success: boolean; points: number }> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    if (!params.reason || params.reason.trim().length < 5) {
      throw new AppError('Administrative points adjustment requires a valid justification reason', 400, 'BAD_REQUEST');
    }

    const idempotencyKey = `admin_correction_${Date.now()}_${params.targetUserId}`;

    const { data, error } = await supabaseAdmin
      .from('member_contributions')
      .insert({
        user_id: params.targetUserId,
        activity_type: 'community_contribution',
        entity_type: 'ADMIN_CORRECTION',
        entity_id: params.actorId,
        points: params.points,
        idempotency_key: idempotencyKey,
        metadata: { reason: params.reason, correctedBy: params.actorId },
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to apply contribution adjustment: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId: params.actorId,
      action: 'LEADERBOARD_POINTS_CORRECTED',
      entityType: 'MEMBER_CONTRIBUTION',
      entityId: data.id,
      metadata: { targetUserId: params.targetUserId, points: params.points, reason: params.reason },
      requestId: params.requestId,
    });

    return { success: true, points: params.points };
  }
}

export const leaderboardService = new LeaderboardService();
