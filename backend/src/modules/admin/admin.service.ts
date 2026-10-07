import { AppError } from '../../utils/response';
import { supabaseAdmin } from '../../services/supabase';
import { localMemoryApplications, ApplicationRecord } from '../applications/applications.service';
import { localMemoryAttempts } from '../assessment/assessment.service';
import { localMemoryProfiles } from '../profile/profile.controller';
import { auditService } from './audit.service';
import type {
  AdminApplicationItemDto,
  AdminApplicationQueryDto,
  AdminApplicationListResultDto,
  AdminApplicationDetailDto,
  AdminDashboardSummaryDto,
} from './admin.types';

export class AdminService {
  /**
   * Get high-level application statistics and summary for admin dashboard
   */
  async getDashboardSummary(): Promise<AdminDashboardSummaryDto> {
    if (supabaseAdmin) {
      try {
        const { data: apps, error } = await supabaseAdmin
          .from('applications')
          .select('*, profiles:user_id(full_name, department, year, register_number)')
          .order('created_at', { ascending: false });

        if (!error && apps) {
          const totalApplications = apps.length;
          const pendingReview = apps.filter((a) => a.status === 'under_review').length;
          const testsCompleted = apps.filter(
            (a) => a.assessment_score !== null || ['test_completed', 'under_review', 'approved', 'waitlisted', 'rejected'].includes(a.status)
          ).length;
          const approved = apps.filter((a) => a.status === 'approved').length;
          const waitlisted = apps.filter((a) => a.status === 'waitlisted').length;
          const rejected = apps.filter((a) => a.status === 'rejected').length;

          const scoredApps = apps.filter((a) => a.assessment_score !== null && a.assessment_score !== undefined);
          const totalScore = scoredApps.reduce((sum, a) => sum + Number(a.assessment_score || 0), 0);
          const averageScore = scoredApps.length > 0 ? Math.round((totalScore / scoredApps.length) * 10) / 10 : 0;

          const passedApps = scoredApps.filter((a) => a.assessment_passed === true).length;
          const passRate = scoredApps.length > 0 ? Math.round((passedApps / scoredApps.length) * 100) : 0;

          const recentApplications: AdminApplicationItemDto[] = apps.slice(0, 5).map((a) => {
            const profile = (a.profiles as Record<string, unknown>) || {};
            return {
              id: a.id,
              userId: a.user_id,
              applicationNumber: a.application_number,
              studentName: String(profile.full_name || 'Applicant'),
              department: String(profile.department || 'N/A'),
              year: Number(profile.year || 1),
              registerNumber: profile.register_number ? String(profile.register_number) : undefined,
              assessmentScore: a.assessment_score !== null ? Number(a.assessment_score) : null,
              assessmentPercentage: a.assessment_percentage !== null ? Number(a.assessment_percentage) : null,
              assessmentPassed: a.assessment_passed,
              status: a.status,
              submittedAt: a.submitted_at,
              createdAt: a.created_at,
            };
          });

          return {
            totalApplications,
            pendingReview,
            testsCompleted,
            approved,
            waitlisted,
            rejected,
            averageScore,
            passRate,
            recentApplications,
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    // Fallback in-memory aggregation
    const allApps = Array.from(localMemoryApplications.values());
    const totalApplications = allApps.length;
    const pendingReview = allApps.filter((a) => a.status === 'under_review').length;
    const testsCompleted = allApps.filter(
      (a) => a.assessmentScore !== null || ['test_completed', 'under_review', 'approved', 'waitlisted', 'rejected'].includes(a.status)
    ).length;
    const approved = allApps.filter((a) => a.status === 'approved').length;
    const waitlisted = allApps.filter((a) => a.status === 'waitlisted').length;
    const rejected = allApps.filter((a) => a.status === 'rejected').length;

    const scoredApps = allApps.filter((a) => a.assessmentScore !== null && a.assessmentScore !== undefined);
    const totalScore = scoredApps.reduce((sum, a) => sum + (a.assessmentScore || 0), 0);
    const averageScore = scoredApps.length > 0 ? Math.round((totalScore / scoredApps.length) * 10) / 10 : 0;

    const passedApps = scoredApps.filter((a) => a.assessmentPassed === true).length;
    const passRate = scoredApps.length > 0 ? Math.round((passedApps / scoredApps.length) * 100) : 0;

    const recentApplications: AdminApplicationItemDto[] = allApps
      .slice(-5)
      .reverse()
      .map((a) => {
        const prof = localMemoryProfiles.get(a.userId) || {};
        return {
          id: a.id,
          userId: a.userId,
          applicationNumber: a.applicationNumber,
          studentName: String(prof.full_name || 'Applicant'),
          department: String(prof.department || 'Computer Science'),
          year: Number(prof.year || 3),
          registerNumber: prof.register_number ? String(prof.register_number) : undefined,
          assessmentScore: a.assessmentScore ?? null,
          assessmentPercentage: a.assessmentPercentage ?? null,
          assessmentPassed: a.assessmentPassed ?? null,
          status: a.status,
          submittedAt: a.submittedAt || null,
          createdAt: a.createdAt,
        };
      });

    return {
      totalApplications,
      pendingReview,
      testsCompleted,
      approved,
      waitlisted,
      rejected,
      averageScore,
      passRate,
      recentApplications,
    };
  }

  /**
   * Query applications with server-side filters, search, sorting, and pagination
   */
  async getApplications(query: AdminApplicationQueryDto): Promise<AdminApplicationListResultDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const statusFilter = query.status && query.status !== 'all' ? query.status.toLowerCase() : undefined;
    const departmentFilter = query.department && query.department !== 'all' ? query.department : undefined;
    const searchTerm = query.search?.trim().toLowerCase();
    const sortBy = query.sortBy || 'submitted_at';
    const order = query.order === 'asc' ? 'asc' : 'desc';

    if (supabaseAdmin) {
      try {
        let baseQuery = supabaseAdmin
          .from('applications')
          .select('*, profiles!inner(full_name, department, year, register_number)', { count: 'exact' });

        if (statusFilter) {
          baseQuery = baseQuery.eq('status', statusFilter);
        }

        if (departmentFilter) {
          baseQuery = baseQuery.eq('profiles.department', departmentFilter);
        }

        if (searchTerm) {
          baseQuery = baseQuery.or(
            `application_number.ilike.%${searchTerm}%,profiles.full_name.ilike.%${searchTerm}%,profiles.register_number.ilike.%${searchTerm}%,profiles.department.ilike.%${searchTerm}%`
          );
        }

        // Sorting
        const ascending = order === 'asc';
        if (sortBy === 'assessment_score') {
          baseQuery = baseQuery.order('assessment_score', { ascending, nullsFirst: false });
        } else if (sortBy === 'application_number') {
          baseQuery = baseQuery.order('application_number', { ascending });
        } else {
          baseQuery = baseQuery.order('submitted_at', { ascending, nullsFirst: false });
        }

        // Range
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, count, error } = await baseQuery.range(from, to);

        if (!error && data) {
          const total = count || data.length;
          const totalPages = Math.ceil(total / pageSize) || 1;

          const items: AdminApplicationItemDto[] = data.map((row) => {
            const profile = (row.profiles as Record<string, unknown>) || {};
            return {
              id: row.id,
              userId: row.user_id,
              applicationNumber: row.application_number,
              studentName: String(profile.full_name || 'Applicant'),
              department: String(profile.department || 'N/A'),
              year: Number(profile.year || 1),
              registerNumber: profile.register_number ? String(profile.register_number) : undefined,
              assessmentScore: row.assessment_score !== null ? Number(row.assessment_score) : null,
              assessmentPercentage: row.assessment_percentage !== null ? Number(row.assessment_percentage) : null,
              assessmentPassed: row.assessment_passed,
              status: row.status,
              submittedAt: row.submitted_at,
              createdAt: row.created_at,
            };
          });

          return {
            items,
            pagination: {
              page,
              pageSize,
              total,
              totalPages,
            },
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    // In-memory filter, search, sort, and pagination
    let items = Array.from(localMemoryApplications.values()).map((app) => {
      const prof = localMemoryProfiles.get(app.userId) || {};
      return {
        id: app.id,
        userId: app.userId,
        applicationNumber: app.applicationNumber,
        studentName: String(prof.full_name || 'Applicant'),
        department: String(prof.department || 'CSE'),
        year: Number(prof.year || 3),
        registerNumber: prof.register_number ? String(prof.register_number) : undefined,
        assessmentScore: app.assessmentScore ?? null,
        assessmentPercentage: app.assessmentPercentage ?? null,
        assessmentPassed: app.assessmentPassed ?? null,
        status: app.status,
        submittedAt: app.submittedAt || null,
        createdAt: app.createdAt,
      };
    });

    // Filter status
    if (statusFilter) {
      items = items.filter((item) => item.status.toLowerCase() === statusFilter);
    }

    // Filter department
    if (departmentFilter) {
      items = items.filter((item) => item.department.toLowerCase() === departmentFilter.toLowerCase());
    }

    // Search
    if (searchTerm) {
      items = items.filter((item) => {
        return (
          item.studentName.toLowerCase().includes(searchTerm) ||
          item.applicationNumber.toLowerCase().includes(searchTerm) ||
          (item.registerNumber && item.registerNumber.toLowerCase().includes(searchTerm)) ||
          item.department.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Sort
    items.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortBy === 'assessment_score') {
        valA = a.assessmentScore ?? -1;
        valB = b.assessmentScore ?? -1;
      } else if (sortBy === 'student_name') {
        valA = a.studentName;
        valB = b.studentName;
      } else if (sortBy === 'application_number') {
        valA = a.applicationNumber;
        valB = b.applicationNumber;
      } else {
        valA = a.submittedAt || a.createdAt;
        valB = b.submittedAt || b.createdAt;
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paginatedItems,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * Detailed applicant inspection
   */
  async getApplicationDetail(applicationId: string): Promise<AdminApplicationDetailDto> {
    let applicationRow: ApplicationRecord | null = null;
    let studentProfile: Record<string, unknown> | null = null;
    let attemptRow: Record<string, unknown> | null = null;

    if (supabaseAdmin) {
      try {
        const { data: app, error: appErr } = await supabaseAdmin
          .from('applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (!appErr && app) {
          applicationRow = {
            id: app.id,
            userId: app.user_id,
            applicationNumber: app.application_number,
            status: app.status,
            submittedAt: app.submitted_at,
            assessmentScore: app.assessment_score,
            assessmentPercentage: app.assessment_percentage,
            assessmentPassed: app.assessment_passed,
            reviewedAt: app.reviewed_at,
            reviewedBy: app.reviewed_by,
            adminNotes: app.admin_notes,
            rejectionReason: app.rejection_reason,
            createdAt: app.created_at,
            updatedAt: app.updated_at,
          };

          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', app.user_id)
            .single();

          if (prof) studentProfile = prof;

          const { data: att } = await supabaseAdmin
            .from('assessment_attempts')
            .select('*')
            .eq('application_id', applicationId)
            .single();

          if (att) attemptRow = att;
        }
      } catch {
        // Fall back
      }
    }

    if (!applicationRow) {
      applicationRow = localMemoryApplications.get(applicationId) || null;
      if (!applicationRow) {
        for (const app of localMemoryApplications.values()) {
          if (app.id === applicationId) {
            applicationRow = app;
            break;
          }
        }
      }

      if (applicationRow) {
        studentProfile = localMemoryProfiles.get(applicationRow.userId) || null;
        attemptRow = (localMemoryAttempts.get(applicationId) as unknown as Record<string, unknown>) || null;
      }
    }

    if (!applicationRow) {
      throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    const auditLogs = await auditService.getLogsForEntity(applicationId);

    return {
      application: {
        id: applicationRow.id,
        userId: applicationRow.userId,
        applicationNumber: applicationRow.applicationNumber,
        status: applicationRow.status,
        academicYear: new Date(applicationRow.createdAt).getFullYear(),
        submittedAt: applicationRow.submittedAt || null,
        reviewedAt: applicationRow.reviewedAt || null,
        reviewedBy: applicationRow.reviewedBy || null,
        reviewerNotes: applicationRow.adminNotes || null,
        rejectionReason: applicationRow.rejectionReason || null,
        assessmentScore: applicationRow.assessmentScore ?? null,
        assessmentPercentage: applicationRow.assessmentPercentage ?? null,
        assessmentPassed: applicationRow.assessmentPassed ?? null,
        createdAt: applicationRow.createdAt,
        updatedAt: applicationRow.updatedAt,
      },
      student: {
        id: applicationRow.userId,
        fullName: String(studentProfile?.full_name || 'Applicant Student'),
        email: String(studentProfile?.email || 'applicant@aiclub.internal'),
        registerNumber: studentProfile?.register_number ? String(studentProfile.register_number) : undefined,
        department: studentProfile?.department ? String(studentProfile.department) : undefined,
        year: studentProfile?.year ? Number(studentProfile.year) : undefined,
        section: studentProfile?.section ? String(studentProfile.section) : undefined,
        phone: studentProfile?.phone ? String(studentProfile.phone) : undefined,
        skills: Array.isArray(studentProfile?.skills) ? (studentProfile.skills as string[]) : [],
        interests: Array.isArray(studentProfile?.interests) ? (studentProfile.interests as string[]) : [],
        githubUrl: studentProfile?.github_url ? String(studentProfile.github_url) : undefined,
        linkedinUrl: studentProfile?.linkedin_url ? String(studentProfile.linkedin_url) : undefined,
        portfolioUrl: studentProfile?.portfolio_url ? String(studentProfile.portfolio_url) : undefined,
      },
      assessment: attemptRow
        ? {
            id: String(attemptRow.id || ''),
            score: typeof attemptRow.score === 'number' ? attemptRow.score : applicationRow.assessmentScore ?? null,
            percentage: typeof attemptRow.percentage === 'number' ? attemptRow.percentage : applicationRow.assessmentPercentage ?? null,
            passed: typeof attemptRow.passed === 'boolean' ? attemptRow.passed : applicationRow.assessmentPassed ?? null,
            totalQuestions: 25,
            correctCount: typeof attemptRow.correct_count === 'number' ? attemptRow.correct_count : typeof attemptRow.correctCount === 'number' ? attemptRow.correctCount : undefined,
            wrongCount: typeof attemptRow.wrong_count === 'number' ? attemptRow.wrong_count : typeof attemptRow.wrongCount === 'number' ? attemptRow.wrongCount : undefined,
            unansweredCount: typeof attemptRow.unanswered_count === 'number' ? attemptRow.unanswered_count : typeof attemptRow.unansweredCount === 'number' ? attemptRow.unansweredCount : undefined,
            durationSeconds: typeof attemptRow.duration_seconds === 'number' ? attemptRow.duration_seconds : typeof attemptRow.durationSeconds === 'number' ? attemptRow.durationSeconds : 1800,
            startedAt: attemptRow.started_at ? String(attemptRow.started_at) : (attemptRow.startedAt ? String(attemptRow.startedAt) : undefined),
            submittedAt: attemptRow.submitted_at ? String(attemptRow.submitted_at) : (attemptRow.submittedAt ? String(attemptRow.submittedAt) : null),
            status: String(attemptRow.status || 'SUBMITTED'),
          }
        : applicationRow.assessmentScore !== null
        ? {
            score: applicationRow.assessmentScore,
            percentage: applicationRow.assessmentPercentage,
            passed: applicationRow.assessmentPassed,
            totalQuestions: 25,
            correctCount: applicationRow.assessmentScore,
            wrongCount: 25 - (applicationRow.assessmentScore || 0),
            unansweredCount: 0,
            status: 'SUBMITTED',
          }
        : null,
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        actorId: log.actorId,
        createdAt: log.createdAt,
        metadata: log.metadata,
      })),
    };
  }

  /**
   * Approve an application (transitions UNDER_REVIEW -> APPROVED)
   */
  async approveApplication(
    applicationId: string,
    reviewerId: string,
    reviewerNotes?: string,
    requestId?: string
  ): Promise<ApplicationRecord> {
    const detail = await this.getApplicationDetail(applicationId);
    const currentStatus = detail.application.status;

    if (currentStatus === 'approved') {
      throw new AppError('Application has already been approved', 409, 'APPLICATION_ALREADY_REVIEWED');
    }

    if (currentStatus !== 'under_review' && currentStatus !== 'test_completed') {
      throw new AppError(
        `Cannot approve application with status '${currentStatus}'. Candidate must complete the assessment first.`,
        409,
        'INVALID_APPLICATION_STATE'
      );
    }

    const reviewedAt = new Date().toISOString();

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('applications')
        .update({
          status: 'approved',
          reviewed_at: reviewedAt,
          reviewed_by: reviewerId,
          admin_notes: reviewerNotes || null,
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new AppError(`Approval failed: ${error.message}`, 500, 'APPROVAL_FAILED');
      }

      await auditService.createLog({
        actorId: reviewerId,
        action: 'APPLICATION_APPROVED',
        entityId: applicationId,
        metadata: {
          previousStatus: currentStatus,
          newStatus: 'approved',
          reviewerNotes: reviewerNotes || null,
        },
        requestId,
      });

      return {
        id: data.id,
        userId: data.user_id,
        applicationNumber: data.application_number,
        status: data.status,
        submittedAt: data.submitted_at,
        assessmentScore: data.assessment_score,
        assessmentPercentage: data.assessment_percentage,
        assessmentPassed: data.assessment_passed,
        reviewedAt: data.reviewed_at,
        reviewedBy: data.reviewed_by,
        adminNotes: data.admin_notes,
        rejectionReason: data.rejection_reason,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // In-memory update
    const app = localMemoryApplications.get(applicationId);
    if (!app) {
      throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    app.status = 'approved';
    app.reviewedAt = reviewedAt;
    app.reviewedBy = reviewerId;
    app.adminNotes = reviewerNotes || null;
    app.updatedAt = reviewedAt;
    localMemoryApplications.set(applicationId, app);

    await auditService.createLog({
      actorId: reviewerId,
      action: 'APPLICATION_APPROVED',
      entityId: applicationId,
      metadata: {
        previousStatus: currentStatus,
        newStatus: 'approved',
        reviewerNotes: reviewerNotes || null,
      },
      requestId,
    });

    return app;
  }

  /**
   * Waitlist an application (transitions UNDER_REVIEW -> WAITLISTED)
   */
  async waitlistApplication(
    applicationId: string,
    reviewerId: string,
    reviewerNotes?: string,
    requestId?: string
  ): Promise<ApplicationRecord> {
    const detail = await this.getApplicationDetail(applicationId);
    const currentStatus = detail.application.status;

    if (currentStatus === 'waitlisted') {
      throw new AppError('Application has already been waitlisted', 409, 'APPLICATION_ALREADY_REVIEWED');
    }

    if (currentStatus !== 'under_review' && currentStatus !== 'test_completed') {
      throw new AppError(
        `Cannot waitlist application with status '${currentStatus}'. Candidate must complete the assessment first.`,
        409,
        'INVALID_APPLICATION_STATE'
      );
    }

    const reviewedAt = new Date().toISOString();

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('applications')
        .update({
          status: 'waitlisted',
          reviewed_at: reviewedAt,
          reviewed_by: reviewerId,
          admin_notes: reviewerNotes || null,
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new AppError(`Waitlist action failed: ${error.message}`, 500, 'WAITLIST_FAILED');
      }

      await auditService.createLog({
        actorId: reviewerId,
        action: 'APPLICATION_WAITLISTED',
        entityId: applicationId,
        metadata: {
          previousStatus: currentStatus,
          newStatus: 'waitlisted',
          reviewerNotes: reviewerNotes || null,
        },
        requestId,
      });

      return {
        id: data.id,
        userId: data.user_id,
        applicationNumber: data.application_number,
        status: data.status,
        submittedAt: data.submitted_at,
        assessmentScore: data.assessment_score,
        assessmentPercentage: data.assessment_percentage,
        assessmentPassed: data.assessment_passed,
        reviewedAt: data.reviewed_at,
        reviewedBy: data.reviewed_by,
        adminNotes: data.admin_notes,
        rejectionReason: data.rejection_reason,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // In-memory update
    const app = localMemoryApplications.get(applicationId);
    if (!app) {
      throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    app.status = 'waitlisted';
    app.reviewedAt = reviewedAt;
    app.reviewedBy = reviewerId;
    app.adminNotes = reviewerNotes || null;
    app.updatedAt = reviewedAt;
    localMemoryApplications.set(applicationId, app);

    await auditService.createLog({
      actorId: reviewerId,
      action: 'APPLICATION_WAITLISTED',
      entityId: applicationId,
      metadata: {
        previousStatus: currentStatus,
        newStatus: 'waitlisted',
        reviewerNotes: reviewerNotes || null,
      },
      requestId,
    });

    return app;
  }

  /**
   * Reject an application (transitions UNDER_REVIEW -> REJECTED)
   * A valid rejection reason is mandatory.
   */
  async rejectApplication(
    applicationId: string,
    reviewerId: string,
    rejectionReason: string,
    requestId?: string
  ): Promise<ApplicationRecord> {
    if (!rejectionReason || rejectionReason.trim().length < 3) {
      throw new AppError(
        'A meaningful rejection reason is required (at least 3 characters).',
        400,
        'REJECTION_REASON_REQUIRED'
      );
    }

    const detail = await this.getApplicationDetail(applicationId);
    const currentStatus = detail.application.status;

    if (currentStatus === 'rejected') {
      throw new AppError('Application has already been rejected', 409, 'APPLICATION_ALREADY_REVIEWED');
    }

    if (currentStatus !== 'under_review' && currentStatus !== 'test_completed') {
      throw new AppError(
        `Cannot reject application with status '${currentStatus}'. Candidate must be under review.`,
        409,
        'INVALID_APPLICATION_STATE'
      );
    }

    const reviewedAt = new Date().toISOString();

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('applications')
        .update({
          status: 'rejected',
          reviewed_at: reviewedAt,
          reviewed_by: reviewerId,
          rejection_reason: rejectionReason.trim(),
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new AppError(`Rejection action failed: ${error.message}`, 500, 'REJECTION_FAILED');
      }

      await auditService.createLog({
        actorId: reviewerId,
        action: 'APPLICATION_REJECTED',
        entityId: applicationId,
        metadata: {
          previousStatus: currentStatus,
          newStatus: 'rejected',
          reasonLength: rejectionReason.trim().length,
        },
        requestId,
      });

      return {
        id: data.id,
        userId: data.user_id,
        applicationNumber: data.application_number,
        status: data.status,
        submittedAt: data.submitted_at,
        assessmentScore: data.assessment_score,
        assessmentPercentage: data.assessment_percentage,
        assessmentPassed: data.assessment_passed,
        reviewedAt: data.reviewed_at,
        reviewedBy: data.reviewed_by,
        adminNotes: data.admin_notes,
        rejectionReason: data.rejection_reason,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // In-memory update
    const app = localMemoryApplications.get(applicationId);
    if (!app) {
      throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    app.status = 'rejected';
    app.reviewedAt = reviewedAt;
    app.reviewedBy = reviewerId;
    app.rejectionReason = rejectionReason.trim();
    app.updatedAt = reviewedAt;
    localMemoryApplications.set(applicationId, app);

    await auditService.createLog({
      actorId: reviewerId,
      action: 'APPLICATION_REJECTED',
      entityId: applicationId,
      metadata: {
        previousStatus: currentStatus,
        newStatus: 'rejected',
        reasonLength: rejectionReason.trim().length,
      },
      requestId,
    });

    return app;
  }
}

export const adminService = new AdminService();
