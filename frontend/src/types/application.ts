/**
 * AI CLUB - Application Types (Milestone 3)
 */

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'waitlisted';

export interface Application {
  id: string;
  userId: string;
  applicationNumber: string;
  status: ApplicationStatus;
  academicYear: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  assessmentScore: number | null;
  assessmentPassed: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStatusResponse {
  hasApplication: boolean;
  application: Application | null;
  profileComplete: boolean;
  missingFields: string[];
  canStartAssessment: boolean;
  assessmentStatus: 'not_started' | 'in_progress' | 'completed' | 'expired';
}
