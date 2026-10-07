/**
 * AI CLUB - Milestone 8: Projects & Community Showcase Platform Types
 */

export type ProjectStatus = 'draft' | 'published' | 'archived' | 'hidden';
export type ProjectVisibility = 'public' | 'members_only';
export type ProjectLinkType = 'github' | 'demo' | 'docs' | 'paper' | 'dataset' | 'video' | 'other';
export type ProjectMediaType = 'image' | 'video' | 'document';
export type ReportTargetType = 'project' | 'achievement';
export type ReportReason = 'inappropriate' | 'spam' | 'copyright' | 'misleading' | 'abuse' | 'other';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface ProjectCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TechnologyRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  createdAt: string;
}

export interface ProjectRecord {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  coverImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  hiddenAt?: string | null;
  hiddenReason?: string | null;
}

export interface ProjectContributorRecord {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: string;
}

export interface ProjectLinkRecord {
  id: string;
  projectId: string;
  label: string;
  url: string;
  linkType: ProjectLinkType;
  position: number;
  createdAt: string;
}

export interface ProjectMediaRecord {
  id: string;
  projectId: string;
  mediaUrl: string;
  mediaType: ProjectMediaType;
  altText?: string | null;
  position: number;
  createdAt: string;
}

export interface FeaturedProjectRecord {
  id: string;
  projectId: string;
  position: number;
  featuredFrom: string;
  featuredUntil?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DTOs & VIEW MODELS
// ============================================================================

export interface ContributorDto {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  department?: string | null;
  memberNumber?: string | null;
}

export interface ProjectCardDto {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  coverImageUrl?: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  technologies: {
    id: string;
    name: string;
    slug: string;
  }[];
  owner: {
    id: string;
    fullName: string;
    email: string;
    memberNumber?: string | null;
  };
  status: ProjectStatus;
  visibility: ProjectVisibility;
  isFeatured: boolean;
  contributorCount: number;
  publishedAt?: string | null;
  updatedAt: string;
}

export interface ProjectDetailDto extends ProjectCardDto {
  description: string;
  contributors: ContributorDto[];
  links: ProjectLinkRecord[];
  media: ProjectMediaRecord[];
  isOwner: boolean;
  canEdit: boolean;
  canReport: boolean;
}

export interface AdminProjectSummaryDto extends ProjectCardDto {
  reportsCount: number;
  hiddenAt?: string | null;
  hiddenReason?: string | null;
  ownerEmail: string;
}

export interface AdminReportDto extends ReportRecord {
  reporterName: string;
  reporterEmail: string;
  targetTitle: string;
  targetSlug?: string;
  targetStatus?: string;
}

// ============================================================================
// REQUEST INPUT DTOs
// ============================================================================

export interface CreateProjectInput {
  title: string;
  slug?: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  visibility?: ProjectVisibility;
  coverImageUrl?: string | null;
  technologyIds?: string[];
  links?: {
    label: string;
    url: string;
    linkType: ProjectLinkType;
  }[];
  media?: {
    mediaUrl: string;
    mediaType?: ProjectMediaType;
    altText?: string | null;
  }[];
}

export interface UpdateProjectInput {
  title?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  visibility?: ProjectVisibility;
  coverImageUrl?: string | null;
  technologyIds?: string[];
}

export interface AddContributorInput {
  userId: string;
  role?: string;
}

export interface AddLinkInput {
  label: string;
  url: string;
  linkType?: ProjectLinkType;
  position?: number;
}

export interface AddMediaInput {
  mediaUrl: string;
  mediaType?: ProjectMediaType;
  altText?: string | null;
  position?: number;
}

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
}

export interface ProjectQueryInput {
  category?: string;
  technology?: string;
  search?: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  sortBy?: 'newest' | 'updated' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
