import { AppError } from '../../utils/response';
import { supabaseAdmin } from '../../services/supabase';

export interface ApplicationRecord {
  id: string;
  userId: string;
  applicationNumber: string;
  status:
    | 'draft'
    | 'test_required'
    | 'test_in_progress'
    | 'test_completed'
    | 'under_review'
    | 'approved'
    | 'waitlisted'
    | 'rejected'
    | 'withdrawn';
  submittedAt?: string | null;
  assessmentScore?: number | null;
  assessmentPercentage?: number | null;
  assessmentPassed?: boolean | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for local testing/standalone mode
export const localMemoryApplications: Map<string, ApplicationRecord> = new Map();
let localAppSeq = 1000;

function formatApplicationResponse(row: Record<string, unknown>): ApplicationRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    applicationNumber: String(row.application_number),
    status: (row.status as ApplicationRecord['status']) || 'test_required',
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    assessmentScore: typeof row.assessment_score === 'number' ? row.assessment_score : null,
    assessmentPercentage: typeof row.assessment_percentage === 'number' ? row.assessment_percentage : null,
    assessmentPassed: typeof row.assessment_passed === 'boolean' ? row.assessment_passed : null,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    adminNotes: row.admin_notes ? String(row.admin_notes) : null,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export class ApplicationsService {
  /**
   * Verifies required student profile fields before permitting application creation
   */
  public async verifyProfileCompletion(_userId: string): Promise<void> {
    // Applicants are not required to fill out extended profile fields to apply or take the assessment.
    // Extended profile details are populated after selection as a club member.
    return;
  }

  /**
   * Creates a new club application for the authenticated user
   */
  public async createApplication(userId: string): Promise<ApplicationRecord> {
    // 1. Verify profile completion
    await this.verifyProfileCompletion(userId);

    // 2. Check for active application
    const existing = await this.getApplicationByUserId(userId);
    if (existing) {
      if (existing.status !== 'withdrawn') {
        throw new AppError(
          'An active application already exists for your account.',
          409,
          'APPLICATION_ALREADY_EXISTS',
          { applicationId: existing.id, applicationNumber: existing.applicationNumber }
        );
      }
    }

    // 3. Create application
    if (!supabaseAdmin || !isUuid(userId)) {
      localAppSeq++;
      const year = new Date().getFullYear();
      const appNum = `AIC-${year}-${String(localAppSeq).padStart(6, '0')}`;
      const newApp: ApplicationRecord = {
        id: `app-${userId}`,
        userId,
        applicationNumber: appNum,
        status: 'test_required',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localMemoryApplications.set(userId, newApp);
      return newApp;
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: userId,
        status: 'test_required',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(
          'An active application already exists for this account.',
          409,
          'APPLICATION_ALREADY_EXISTS'
        );
      }
      throw new AppError(error.message, 500, 'DATABASE_ERROR');
    }

    return formatApplicationResponse(data);
  }

  /**
   * Retrieves the current user's application
   */
  public async getApplicationByUserId(userId: string): Promise<ApplicationRecord | null> {
    if (!supabaseAdmin || !isUuid(userId)) {
      return localMemoryApplications.get(userId) || null;
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError(error.message, 500, 'DATABASE_ERROR');
    }

    return data ? formatApplicationResponse(data) : null;
  }
}

export const applicationsService = new ApplicationsService();
