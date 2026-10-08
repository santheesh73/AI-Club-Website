/**
 * AI CLUB - External Course Recommendation Engine
 * Frontend Types
 */

export type CourseProviderKey =
  | 'COURSERA'
  | 'FREECODECAMP'
  | 'UDEMY'
  | 'UNSTOP'
  | 'EDX'
  | 'KAGGLE'
  | 'GOOGLE'
  | 'MICROSOFT'
  | 'AWS'
  | 'NVIDIA'
  | 'STANFORD'
  | 'MIT'
  | 'OTHER';

export interface CourseProviderDefinition {
  key: CourseProviderKey;
  displayName: string;
  allowedDomains: string[];
  websiteUrl: string;
  badgeColor?: string;
  supportsIngestion?: boolean;
}

export type CourseCategory =
  | 'AI'
  | 'MACHINE_LEARNING'
  | 'DEEP_LEARNING'
  | 'GENERATIVE_AI'
  | 'PYTHON'
  | 'DATA_SCIENCE'
  | 'WEB_DEVELOPMENT'
  | 'FULL_STACK'
  | 'CLOUD'
  | 'CYBERSECURITY'
  | 'DEVOPS'
  | 'DATABASES'
  | 'SOFTWARE_ENGINEERING'
  | 'DATA_ANALYTICS'
  | 'PROGRAMMING'
  | 'OTHER';

export type ExternalCourseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';

export interface ExternalCourseDto {
  id: string;
  title: string;
  provider: string;
  providerKey: CourseProviderKey;
  description: string;
  category: string;
  skills: string[];
  difficulty: ExternalCourseDifficulty;
  officialUrl: string;
  imageUrl?: string;
  duration?: string;
  language?: string;
  priceType?: 'free' | 'paid' | 'freemium' | 'subscription';
  rating?: number;
  isActive: boolean;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  extractionMetadata?: Record<string, unknown>;
  lastVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberLearningSignals {
  skills: string[];
  interests: string[];
  completedCourses: string[];
  currentLearning: string[];
  projectTopics: string[];
  department?: string;
}

export interface CourseRecommendationDto {
  course: ExternalCourseDto;
  reason: string;
  matchScore: number;
  skillGap?: string;
}

export interface RecommendationsResponseDto {
  recommendations: CourseRecommendationDto[];
  cached: boolean;
  expiresAt: string | null;
  rateLimitRemaining: number;
  signals: MemberLearningSignals;
}

export interface ExternalCoursesListResponseDto {
  courses: ExternalCourseDto[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface CreateExternalCourseDto {
  title: string;
  provider: string;
  officialUrl: string;
  description: string;
  category: CourseCategory;
  skills: string[];
  difficulty: ExternalCourseDifficulty;
  imageUrl?: string;
  duration?: string;
  language?: string;
  priceType?: 'free' | 'paid' | 'freemium' | 'subscription';
  rating?: number;
  status?: 'draft' | 'published' | 'archived';
  extractionMetadata?: Record<string, unknown>;
}

export interface UpdateExternalCourseDto extends Partial<CreateExternalCourseDto> {
  isActive?: boolean;
}

export interface AdminExternalCourseStatsDto {
  total: number;
  published: number;
  archived: number;
  byProvider: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface ExtractedCourseMetadataDto {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  category: CourseCategory | null;
  difficulty: ExternalCourseDifficulty | null;
  skills: string[];
  duration?: string | null;
  priceType?: 'free' | 'paid' | 'freemium' | 'subscription' | null;
  rating?: number | null;
  externalCourseId?: string | null;
}

export interface ExtractedCoursePreviewDto {
  success: boolean;
  sourceUrl: string;
  canonicalUrl: string;
  provider: CourseProviderKey;
  providerDisplayName: string;
  metadata: ExtractedCourseMetadataDto;
  extraction: {
    titleSource: string;
    descriptionSource: string;
    imageSource: string;
    categorySource?: string;
    difficultySource?: string;
    skillsSource?: string;
    providerSource: string;
  };
  isDuplicate: boolean;
  existingCourse?: {
    id: string;
    title: string;
    provider: string;
    status: string;
    officialUrl: string;
  } | null;
}
