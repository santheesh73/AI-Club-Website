import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z
    .string()
    .min(3, 'Course title must be at least 3 characters')
    .max(255, 'Course title cannot exceed 255 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  shortDescription: z
    .string()
    .min(5, 'Short description must be at least 5 characters')
    .max(350, 'Short description cannot exceed 350 characters'),
  description: z
    .string()
    .min(10, 'Full description must be at least 10 characters'),
  thumbnailUrl: z.string().url('Must be a valid URL').nullable().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedDuration: z
    .number()
    .int('Estimated duration must be an integer')
    .positive('Estimated duration must be greater than zero'),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const updateCourseSchema = z.object({
  title: z
    .string()
    .min(3, 'Course title must be at least 3 characters')
    .max(255, 'Course title cannot exceed 255 characters')
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  shortDescription: z
    .string()
    .min(5, 'Short description must be at least 5 characters')
    .max(350, 'Short description cannot exceed 350 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Full description must be at least 10 characters')
    .optional(),
  thumbnailUrl: z.string().url('Must be a valid URL').nullable().optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedDuration: z
    .number()
    .int('Estimated duration must be an integer')
    .positive('Estimated duration must be greater than zero')
    .optional(),
});

export const createModuleSchema = z.object({
  title: z
    .string()
    .min(2, 'Module title must be at least 2 characters')
    .max(255, 'Module title cannot exceed 255 characters'),
  description: z.string().nullable().optional(),
  position: z.number().int().positive().optional(),
});

export const updateModuleSchema = z.object({
  title: z
    .string()
    .min(2, 'Module title must be at least 2 characters')
    .max(255, 'Module title cannot exceed 255 characters')
    .optional(),
  description: z.string().nullable().optional(),
  position: z.number().int().positive().optional(),
});

export const reorderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, 'Item ID is required'),
        position: z.number().int().positive('Position must be a positive integer'),
      })
    )
    .min(1, 'At least one item must be provided for reordering'),
});

export const createLessonSchema = z.object({
  title: z
    .string()
    .min(2, 'Lesson title must be at least 2 characters')
    .max(255, 'Lesson title cannot exceed 255 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lesson slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().nullable().optional(),
  content: z.string().default(''),
  contentType: z.enum(['text', 'video', 'document', 'external_resource']).optional(),
  videoUrl: z.string().url('Must be a valid URL').nullable().optional(),
  duration: z.number().int().positive('Duration must be positive').optional(),
  position: z.number().int().positive('Position must be positive').optional(),
  isPreview: z.boolean().optional(),
});

export const updateLessonSchema = z.object({
  title: z
    .string()
    .min(2, 'Lesson title must be at least 2 characters')
    .max(255, 'Lesson title cannot exceed 255 characters')
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lesson slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().nullable().optional(),
  content: z.string().optional(),
  contentType: z.enum(['text', 'video', 'document', 'external_resource']).optional(),
  videoUrl: z.string().url('Must be a valid URL').nullable().optional(),
  duration: z.number().int().positive('Duration must be positive').optional(),
  position: z.number().int().positive('Position must be positive').optional(),
  isPreview: z.boolean().optional(),
});

export const courseQuerySchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['created_at', 'title', 'estimated_duration']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
