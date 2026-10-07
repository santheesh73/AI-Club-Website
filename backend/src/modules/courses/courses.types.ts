/**
 * AI CLUB - Milestone 7: Courses & Learning Management Platform Types
 */

export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonContentType = 'text' | 'video' | 'document' | 'external_resource';
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';

export interface CourseCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRecord {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string | null;
  categoryId: string;
  difficulty: CourseDifficulty;
  estimatedDuration: number; // in minutes
  status: CourseStatus;
  createdBy?: string | null;
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleRecord {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLessonRecord {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  description?: string | null;
  content: string;
  contentType: LessonContentType;
  videoUrl?: string | null;
  duration: number; // in minutes
  position: number;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollmentRecord {
  id: string;
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgressRecord {
  id: string;
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string | null;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DTOs & VIEW MODELS
// ============================================================================

export interface CourseCardDto {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl?: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  difficulty: CourseDifficulty;
  estimatedDuration: number;
  status: CourseStatus;
  totalModules: number;
  totalLessons: number;
  isEnrolled: boolean;
  enrollmentStatus?: EnrollmentStatus | null;
  progressPercentage?: number | null;
}

export interface LessonSummaryDto {
  id: string;
  title: string;
  slug: string;
  duration: number;
  position: number;
  isPreview: boolean;
  isCompleted?: boolean;
}

export interface ModuleSyllabusDto {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  lessons: LessonSummaryDto[];
}

export interface CourseDetailDto {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  difficulty: CourseDifficulty;
  estimatedDuration: number;
  status: CourseStatus;
  publishedAt?: string | null;
  totalModules: number;
  totalLessons: number;
  modules: ModuleSyllabusDto[];
  isEnrolled: boolean;
  enrollmentId?: string | null;
  enrollmentStatus?: EnrollmentStatus | null;
  progressPercentage?: number | null;
  completedLessonsCount?: number | null;
  resumeLessonSlug?: string | null;
}

export interface LessonDetailDto {
  id: string;
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  title: string;
  slug: string;
  description?: string | null;
  content: string; // Protected: only delivered if enrolled or isPreview
  contentType: LessonContentType;
  videoUrl?: string | null;
  duration: number;
  position: number;
  isPreview: boolean;
  isCompleted: boolean;
  previousLesson?: {
    slug: string;
    title: string;
  } | null;
  nextLesson?: {
    slug: string;
    title: string;
  } | null;
}

export interface CourseProgressDto {
  enrollmentId: string;
  courseId: string;
  status: EnrollmentStatus;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lastAccessedAt: string;
  completedAt?: string | null;
  resumeLesson?: {
    slug: string;
    title: string;
  } | null;
}

export interface AdminCourseSummaryDto extends CourseRecord {
  categoryName: string;
  totalModules: number;
  totalLessons: number;
  enrolledLearnersCount: number;
  completedLearnersCount: number;
}

export interface AdminLearnerEnrollmentDto {
  enrollmentId: string;
  userId: string;
  fullName: string;
  email: string;
  memberNumber: string;
  department?: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string | null;
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lastActivityAt: string;
}

export interface LearningDashboardStatsDto {
  enrolledCount: number;
  inProgressCount: number;
  completedCount: number;
  totalLessonsCompleted: number;
  recentEnrollments: CourseCardDto[];
  continueLearning?: {
    courseTitle: string;
    courseSlug: string;
    lessonTitle: string;
    lessonSlug: string;
    progressPercentage: number;
  } | null;
}

// Request DTOs
export interface CreateCourseDto {
  title: string;
  slug?: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string | null;
  categoryId: string;
  difficulty: CourseDifficulty;
  estimatedDuration: number;
  status?: CourseStatus;
}

export interface UpdateCourseDto {
  title?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string | null;
  categoryId?: string;
  difficulty?: CourseDifficulty;
  estimatedDuration?: number;
}

export interface CreateModuleDto {
  title: string;
  description?: string | null;
  position?: number;
}

export interface UpdateModuleDto {
  title?: string;
  description?: string | null;
  position?: number;
}

export interface ReorderItemDto {
  id: string;
  position: number;
}

export interface CreateLessonDto {
  title: string;
  slug?: string;
  description?: string | null;
  content: string;
  contentType?: LessonContentType;
  videoUrl?: string | null;
  duration?: number;
  position?: number;
  isPreview?: boolean;
}

export interface UpdateLessonDto {
  title?: string;
  slug?: string;
  description?: string | null;
  content?: string;
  contentType?: LessonContentType;
  videoUrl?: string | null;
  duration?: number;
  position?: number;
  isPreview?: boolean;
}

export interface CourseQueryDto {
  category?: string;
  difficulty?: CourseDifficulty;
  status?: CourseStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'title' | 'estimated_duration';
  sortOrder?: 'asc' | 'desc';
}
