import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { auditService } from '../admin/audit.service';
import {
  MembershipRecord,
  MemberDashboardData,
  MemberListItemDto,
} from './membership.types';
import { localMemoryApplications } from '../applications/applications.service';
import { localMemoryAttempts } from '../assessment/assessment.service';
import { localMemoryProfiles } from '../profile/profile.controller';

// In-memory store for fallback / local testing mode
const localMemberships = new Map<string, MembershipRecord>();
let localMemberCounter = 1;

export class MembershipService {
  /**
   * Reset local fallback state (useful for test isolates)
   */
  public resetLocalState(): void {
    localMemberships.clear();
    localMemberCounter = 1;
  }

  /**
   * Helper to format an official member number
   */
  private generateLocalMemberNumber(): string {
    const year = new Date().getFullYear();
    const formatted = `AIC-${year}-${String(localMemberCounter).padStart(4, '0')}`;
    localMemberCounter += 1;
    return formatted;
  }

  /**
   * Atomically activate an approved candidate's membership
   */
  async activateMembership(
    applicationId: string,
    actorId: string,
    notes?: string,
    requestId?: string
  ): Promise<MembershipRecord> {
    if (!applicationId) {
      throw new AppError('Application ID is required for activation', 400, 'APPLICATION_ID_REQUIRED');
    }

    let applicationRow: {
      id: string;
      userId: string;
      status: string;
      applicationNumber: string;
    } | null = null;

    // 1. Fetch application details
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('applications')
          .select('id, user_id, status, application_number')
          .eq('id', applicationId)
          .single();

        if (error || !data) {
          throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
        }

        applicationRow = {
          id: data.id,
          userId: data.user_id,
          status: data.status,
          applicationNumber: data.application_number,
        };
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError('Database error during application lookup', 500, 'DATABASE_ERROR');
      }
    } else {
      // Fallback in-memory search
      const app = localMemoryApplications.get(applicationId);
      if (!app) {
        throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
      }
      applicationRow = {
        id: app.id,
        userId: app.userId,
        status: app.status,
        applicationNumber: app.applicationNumber,
      };
    }

    // 2. Strict State Rule: Application must be APPROVED
    if (applicationRow.status !== 'approved') {
      throw new AppError(
        `Cannot activate membership: Application must be approved first. Current status is '${applicationRow.status}'.`,
        409,
        'APPLICATION_NOT_APPROVED'
      );
    }

    // 3. Duplicate Protection: Check if an active membership already exists
    if (supabaseAdmin) {
      const { data: existingActive } = await supabaseAdmin
        .from('memberships')
        .select('id, member_number, status')
        .eq('user_id', applicationRow.userId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingActive) {
        throw new AppError(
          `Membership is already active for this applicant (Member #: ${existingActive.member_number}).`,
          409,
          'MEMBERSHIP_ALREADY_ACTIVE'
        );
      }
    } else {
      for (const m of localMemberships.values()) {
        if (m.userId === applicationRow.userId && m.status === 'active') {
          throw new AppError(
            `Membership is already active for this applicant (Member #: ${m.memberNumber}).`,
            409,
            'MEMBERSHIP_ALREADY_ACTIVE'
          );
        }
      }
    }

    const timestamp = new Date().toISOString();

    // 4. Create Membership Record
    if (supabaseAdmin) {
      try {
        // Generate member number via DB function
        const { data: numData } = await supabaseAdmin.rpc('generate_member_number');
        const memberNumber = numData || `AIC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('memberships')
          .insert({
            user_id: applicationRow.userId,
            application_id: applicationRow.id,
            member_number: memberNumber,
            status: 'active',
            joined_at: timestamp,
            activated_at: timestamp,
            activated_by: actorId,
            metadata: notes ? { notes } : {},
          })
          .select()
          .single();

        if (insertError || !inserted) {
          // If unique constraint violation occurs concurrently
          if (insertError?.code === '23505') {
            throw new AppError('Membership is already active for this applicant.', 409, 'MEMBERSHIP_ALREADY_ACTIVE');
          }
          throw new AppError(`Membership creation failed: ${insertError?.message}`, 500, 'MEMBERSHIP_CREATION_FAILED');
        }

        // Update profile role to member
        await supabaseAdmin
          .from('profiles')
          .update({ role: 'member' })
          .eq('id', applicationRow.userId);

        const record: MembershipRecord = {
          id: inserted.id,
          userId: inserted.user_id,
          applicationId: inserted.application_id,
          memberNumber: inserted.member_number,
          status: inserted.status,
          joinedAt: inserted.joined_at,
          activatedAt: inserted.activated_at,
          activatedBy: inserted.activated_by,
          suspendedAt: inserted.suspended_at,
          revokedAt: inserted.revoked_at,
          expiresAt: inserted.expires_at,
          metadata: inserted.metadata || {},
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        };

        // 5. Append-only Audit Log
        await auditService.createLog({
          actorId,
          action: 'MEMBERSHIP_ACTIVATED',
          entityType: 'MEMBERSHIP',
          entityId: record.id,
          metadata: {
            applicationId: applicationRow.id,
            memberNumber: record.memberNumber,
            userId: record.userId,
            membershipStatus: record.status,
            previousApplicationStatus: 'approved',
            notes: notes || null,
          },
          requestId,
        });

        logger.info(`Membership successfully activated for user ${record.userId} with number ${record.memberNumber}`);
        return record;
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        const msg = err instanceof Error ? err.message : 'Activation error';
        throw new AppError(msg, 500, 'ACTIVATION_TRANSACTION_FAILED');
      }
    }

    // In-memory fallback
    const memberNumber = this.generateLocalMemberNumber();
    const newRecord: MembershipRecord = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: applicationRow.userId,
      applicationId: applicationRow.id,
      memberNumber,
      status: 'active',
      joinedAt: timestamp,
      activatedAt: timestamp,
      activatedBy: actorId,
      suspendedAt: null,
      revokedAt: null,
      expiresAt: null,
      metadata: notes ? { notes } : {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    localMemberships.set(newRecord.id, newRecord);

    // Update profile role in fallback
    const profile = localMemoryProfiles.get(applicationRow.userId);
    if (profile) {
      profile.role = 'member';
      localMemoryProfiles.set(applicationRow.userId, profile);
    }

    // Append-only Audit Log
    await auditService.createLog({
      actorId,
      action: 'MEMBERSHIP_ACTIVATED',
      entityType: 'MEMBERSHIP',
      entityId: newRecord.id,
      metadata: {
        applicationId: applicationRow.id,
        memberNumber: newRecord.memberNumber,
        userId: newRecord.userId,
        membershipStatus: newRecord.status,
        previousApplicationStatus: 'approved',
        notes: notes || null,
      },
      requestId,
    });

    return newRecord;
  }

  /**
   * Get active membership for a user
   */
  async getMembershipByUserId(userId: string): Promise<MembershipRecord | null> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('memberships')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (error || !data) return null;

        return {
          id: data.id,
          userId: data.user_id,
          applicationId: data.application_id,
          memberNumber: data.member_number,
          status: data.status,
          joinedAt: data.joined_at,
          activatedAt: data.activated_at,
          activatedBy: data.activated_by,
          suspendedAt: data.suspended_at,
          revokedAt: data.revoked_at,
          expiresAt: data.expires_at,
          metadata: data.metadata || {},
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      } catch {
        return null;
      }
    }

    for (const m of localMemberships.values()) {
      if (m.userId === userId && m.status === 'active') {
        return m;
      }
    }

    return null;
  }

  /**
   * Get comprehensive Member Dashboard data payload
   */
  async getMemberDashboard(userId: string): Promise<MemberDashboardData> {
    const membership = await this.getMembershipByUserId(userId);
    if (!membership) {
      throw new AppError('Active membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
    }

    let profileData: MemberDashboardData['profile'];
    let applicationData: MemberDashboardData['application'];
    let assessmentData: MemberDashboardData['assessment'] = null;

    if (supabaseAdmin) {
      // 1. Fetch Profile
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!prof) {
        throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      profileData = {
        id: prof.id,
        fullName: prof.full_name || '',
        email: prof.email,
        registerNumber: prof.register_number || undefined,
        department: prof.department || undefined,
        year: prof.year ? Number(prof.year) : undefined,
        section: prof.section || undefined,
        phone: prof.phone || undefined,
        avatarUrl: prof.avatar_url || undefined,
        bio: prof.bio || undefined,
        skills: Array.isArray(prof.skills) ? prof.skills : [],
        interests: Array.isArray(prof.interests) ? prof.interests : [],
        githubUrl: prof.github_url || prof.github_username || undefined,
        linkedinUrl: prof.linkedin_url || undefined,
        portfolioUrl: prof.portfolio_url || undefined,
        createdAt: prof.created_at,
      };

      // 2. Fetch Application
      const { data: app } = await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('id', membership.applicationId)
        .single();

      if (!app) {
        throw new AppError('Linked application not found', 404, 'APPLICATION_NOT_FOUND');
      }

      applicationData = {
        id: app.id,
        applicationNumber: app.application_number,
        status: app.status,
        academicYear: app.academic_year || 2026,
        submittedAt: app.submitted_at,
        reviewedAt: app.reviewed_at,
      };

      // 3. Fetch Assessment
      const { data: att } = await supabaseAdmin
        .from('assessment_attempts')
        .select('*')
        .eq('application_id', app.id)
        .maybeSingle();

      if (att) {
        assessmentData = {
          id: att.id,
          score: att.score ?? app.assessment_score ?? null,
          percentage: att.percentage ?? app.assessment_percentage ?? null,
          passed: att.passed ?? app.assessment_passed ?? null,
          totalQuestions: att.total_questions || 25,
          correctCount: att.correct_count ?? undefined,
          wrongCount: att.wrong_count ?? undefined,
          unansweredCount: att.unanswered_count ?? undefined,
          durationSeconds: att.duration_seconds ?? 1800,
          submittedAt: att.submitted_at,
        };
      } else if (app.assessment_score !== null && app.assessment_score !== undefined) {
        assessmentData = {
          score: app.assessment_score,
          percentage: app.assessment_percentage ?? null,
          passed: app.assessment_passed ?? null,
          totalQuestions: 25,
          submittedAt: app.submitted_at,
        };
      }
    } else {
      // In-memory fallback
      const prof = localMemoryProfiles.get(userId) || {
        id: userId,
        full_name: 'Sri Nikesh K',
        email: 'member@aiclub.internal',
        department: 'Artificial Intelligence & Data Science',
        year: 3,
        register_number: '2023AIDS0001',
        skills: ['PyTorch', 'Transformers'],
        interests: ['Reinforcement Learning'],
        created_at: new Date().toISOString(),
      };

      profileData = {
        id: String(prof.id || userId),
        fullName: String(prof.full_name || ''),
        email: String(prof.email || ''),
        registerNumber: prof.register_number ? String(prof.register_number) : undefined,
        department: prof.department ? String(prof.department) : undefined,
        year: prof.year ? Number(prof.year) : undefined,
        skills: Array.isArray(prof.skills) ? prof.skills : [],
        interests: Array.isArray(prof.interests) ? prof.interests : [],
        createdAt: String(prof.created_at || new Date().toISOString()),
      };

      const app = localMemoryApplications.get(membership.applicationId) || {
        id: membership.applicationId,
        applicationNumber: 'AIC-2026-000005',
        status: 'approved',
        academicYear: 2026,
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        assessmentScore: 23,
        assessmentPercentage: 92,
        assessmentPassed: true,
      };

      const appAny = app as any;
      applicationData = {
        id: app.id,
        applicationNumber: app.applicationNumber,
        status: app.status,
        academicYear: typeof appAny.academicYear === 'number' ? appAny.academicYear : 2026,
        submittedAt: app.submittedAt ?? null,
        reviewedAt: app.reviewedAt ?? null,
      };

      const att = localMemoryAttempts.get(membership.applicationId);
      if (att) {
        assessmentData = {
          id: att.id,
          score: att.score ?? null,
          percentage: att.percentage ?? null,
          passed: att.passed ?? null,
          totalQuestions: 25,
          correctCount: att.correctCount,
          wrongCount: att.wrongCount,
          unansweredCount: att.unansweredCount,
          durationSeconds: att.durationSeconds,
          submittedAt: att.submittedAt ?? null,
        };
      } else {
        assessmentData = {
          score: app.assessmentScore ?? 23,
          percentage: app.assessmentPercentage ?? 92,
          passed: app.assessmentPassed ?? true,
          totalQuestions: 25,
          correctCount: 23,
          wrongCount: 2,
          unansweredCount: 0,
          durationSeconds: 1450,
          submittedAt: app.submittedAt ?? null,
        };
      }
    }

    return {
      profile: profileData,
      membership: {
        id: membership.id,
        memberNumber: membership.memberNumber,
        status: membership.status,
        joinedAt: membership.joinedAt,
        activatedAt: membership.activatedAt,
      },
      application: applicationData,
      assessment: assessmentData,
    };
  }

  /**
   * Admin list of all members with search and pagination
   */
  async getAllMembers(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<{ items: MemberListItemDto[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 10));

    if (supabaseAdmin) {
      let query = supabaseAdmin
        .from('memberships')
        .select(`
          id, user_id, member_number, status, joined_at, application_id,
          profiles:user_id(full_name, email, department, register_number),
          applications:application_id(application_number)
        `, { count: 'exact' });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const offset = (page - 1) * pageSize;
      const { data, count, error } = await query
        .order('joined_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw new AppError(`Failed to fetch members: ${error.message}`, 500, 'QUERY_ERROR');
      }

      const items: MemberListItemDto[] = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        memberNumber: row.member_number,
        status: row.status,
        joinedAt: row.joined_at,
        student: {
          fullName: row.profiles?.full_name || 'Member Student',
          email: row.profiles?.email || '',
          department: row.profiles?.department,
          registerNumber: row.profiles?.register_number,
        },
        applicationNumber: row.applications?.application_number || 'N/A',
      }));

      return {
        items,
        total: count || items.length,
        page,
        pageSize,
      };
    }

    // In-memory fallback
    const items: MemberListItemDto[] = Array.from(localMemberships.values()).map((m) => ({
      id: m.id,
      userId: m.userId,
      memberNumber: m.memberNumber,
      status: m.status,
      joinedAt: m.joinedAt,
      student: {
        fullName: 'Active Member',
        email: 'member@aiclub.internal',
        department: 'Artificial Intelligence & Data Science',
        registerNumber: '2023AIDS0001',
      },
      applicationNumber: 'AIC-2026-000005',
    }));

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize,
    };
  }
}

export const membershipService = new MembershipService();
