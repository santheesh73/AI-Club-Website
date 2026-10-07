/**
 * AI CLUB - Admin Control Center & Application Review Types (Milestone 4)
 */

export interface AdminApplicationItem {
  id: string;
  userId: string;
  applicationNumber: string;
  studentName: string;
  department: string;
  year: number;
  registerNumber?: string;
  assessmentScore: number | null;
  assessmentPercentage: number | null;
  assessmentPassed: boolean | null;
  status: string;
  submittedAt: string | null;
  createdAt: string;
}

export interface AdminApplicationQuery {
  status?: string;
  department?: string;
  search?: string;
  sortBy?: 'submitted_at' | 'assessment_score' | 'student_name' | 'application_number';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface AdminApplicationDetail {
  application: {
    id: string;
    userId: string;
    applicationNumber: string;
    status: string;
    academicYear: number;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
    reviewerNotes: string | null;
    rejectionReason: string | null;
    assessmentScore: number | null;
    assessmentPercentage: number | null;
    assessmentPassed: boolean | null;
    createdAt: string;
    updatedAt: string;
  };
  student: {
    id: string;
    fullName: string;
    email: string;
    registerNumber?: string;
    department?: string;
    year?: number;
    section?: string;
    phone?: string;
    skills: string[];
    interests: string[];
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  assessment: {
    id?: string;
    score: number | null;
    percentage: number | null;
    passed: boolean | null;
    totalQuestions: number;
    correctCount?: number;
    wrongCount?: number;
    unansweredCount?: number;
    durationSeconds?: number;
    startedAt?: string;
    submittedAt?: string | null;
    status?: string;
  } | null;
  auditLogs: {
    id: string;
    action: string;
    actorId: string;
    createdAt: string;
    metadata: Record<string, unknown>;
  }[];
}

export interface AdminDashboardSummary {
  totalApplications: number;
  pendingReview: number;
  testsCompleted: number;
  approved: number;
  waitlisted: number;
  rejected: number;
  averageScore: number;
  passRate: number;
  recentApplications: AdminApplicationItem[];
}
