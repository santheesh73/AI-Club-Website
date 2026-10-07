/**
 * AI CLUB - Milestone 8: Achievements Types & View Models
 */

export type AchievementStatus = 'published' | 'hidden' | 'archived';

export interface AchievementCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementRecord {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  issuer: string;
  issuedAt: string;
  credentialUrl?: string | null;
  credentialId?: string | null;
  status: AchievementStatus;
  hiddenAt?: string | null;
  hiddenReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementDto {
  id: string;
  title: string;
  description: string;
  issuer: string;
  issuedAt: string;
  credentialUrl?: string | null;
  credentialId?: string | null;
  status: AchievementStatus;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    fullName: string;
    email: string;
    memberNumber?: string | null;
  };
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAchievementInput {
  categoryId: string;
  title: string;
  description: string;
  issuer: string;
  issuedAt: string;
  credentialUrl?: string | null;
  credentialId?: string | null;
}

export interface UpdateAchievementInput {
  categoryId?: string;
  title?: string;
  description?: string;
  issuer?: string;
  issuedAt?: string;
  credentialUrl?: string | null;
  credentialId?: string | null;
  status?: AchievementStatus;
}
