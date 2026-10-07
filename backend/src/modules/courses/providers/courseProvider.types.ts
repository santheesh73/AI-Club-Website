/**
 * AI CLUB - External Course Recommendation Engine
 * Provider Types and Controlled Enums
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

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';

export interface ExternalCourseEntity {
  id: string;
  title: string;
  provider: string;
  providerKey: CourseProviderKey;
  description: string;
  category: string;
  skills: string[];
  difficulty: CourseDifficulty;
  officialUrl: string;
  imageUrl?: string;
  duration?: string;
  language?: string;
  priceType?: 'free' | 'paid' | 'freemium' | 'subscription';
  rating?: number;
  isActive: boolean;
  status: 'draft' | 'published' | 'archived';
  lastVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateCourseItem {
  id: string;
  title: string;
  provider: string;
  category: string;
  difficulty: CourseDifficulty;
  skills: string[];
  description: string;
  rating?: number;
}

export interface MemberLearningContext {
  skills: string[];
  interests: string[];
  completedCourses: string[];
  currentLearning: string[];
  projectTopics: string[];
  department?: string;
}

export interface RawAIRecommendation {
  course_id: string;
  reason: string;
  match_score: number;
  skill_gap?: string;
}

export interface CourseRecommendationResult {
  course: ExternalCourseEntity;
  relevanceScore: number;
  matchScore?: number;
  matchReasons: string[];
  explanation: string;
  reason?: string;
  skillGap?: string;
  isAiRanked: boolean;
  generatedAt: string;
}
