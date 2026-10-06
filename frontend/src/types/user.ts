/**
 * Core User & Role Types
 */

export type UserRole = 'public' | 'applicant' | 'member' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  user: UserProfile;
}
