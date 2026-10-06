/**
 * Core User & Role Types (Milestone 2)
 */

export type UserRole = 'public' | 'applicant' | 'member' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
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
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  user: UserProfile;
}
