export type MembershipStatus =
  | 'active'
  | 'alumni'
  | 'suspended'
  | 'pending'
  | 'expired'
  | 'revoked';

export interface MembershipRecord {
  id: string;
  userId: string;
  applicationId: string;
  memberNumber: string;
  status: MembershipStatus;
  joinedAt: string;
  activatedAt: string;
  activatedBy: string | null;
  suspendedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivateMembershipDto {
  applicationId: string;
  notes?: string;
}

import type { FlashcardDto } from '../dashboard/flashcard.types';

export interface MemberDashboardData {
  profile: {
    id: string;
    fullName: string;
    email: string;
    registerNumber?: string;
    department?: string;
    year?: number;
    section?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
    skills: string[];
    interests: string[];
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    createdAt: string;
  };
  membership: {
    id: string;
    memberNumber: string;
    status: MembershipStatus;
    joinedAt: string;
    activatedAt: string;
  };
  application: {
    id: string;
    applicationNumber: string;
    status: string;
    academicYear: number;
    submittedAt: string | null;
    reviewedAt: string | null;
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
    submittedAt: string | null;
  } | null;
  flashcards?: FlashcardDto[];
}

export interface MemberListItemDto {
  id: string;
  userId: string;
  memberNumber: string;
  status: MembershipStatus;
  joinedAt: string;
  student: {
    fullName: string;
    email: string;
    department?: string;
    registerNumber?: string;
  };
  applicationNumber: string;
}
