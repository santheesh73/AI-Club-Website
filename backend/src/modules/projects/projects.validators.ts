import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Project title must be at least 3 characters')
    .max(255, 'Project title cannot exceed 255 characters'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  shortDescription: z
    .string()
    .trim()
    .min(10, 'Short description must be at least 10 characters')
    .max(500, 'Short description cannot exceed 500 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Full project description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  visibility: z.enum(['public', 'members_only']).optional().default('public'),
  coverImageUrl: z.string().url('Must be a valid URL').nullable().optional(),
  technologyIds: z.array(z.string()).optional(),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Link label is required').max(100),
        url: z
          .string()
          .url('Must be a valid URL')
          .regex(/^https?:\/\//i, 'URL must begin with http:// or https://'),
        linkType: z.enum(['github', 'demo', 'docs', 'paper', 'dataset', 'video', 'other']).default('other'),
      })
    )
    .optional(),
  media: z
    .array(
      z.object({
        mediaUrl: z.string().url('Must be a valid URL'),
        mediaType: z.enum(['image', 'video', 'document']).optional().default('image'),
        altText: z.string().trim().max(255).nullable().optional(),
      })
    )
    .optional(),
});

export const updateProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Project title must be at least 3 characters')
    .max(255, 'Project title cannot exceed 255 characters')
    .optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  shortDescription: z
    .string()
    .trim()
    .min(10, 'Short description must be at least 10 characters')
    .max(500, 'Short description cannot exceed 500 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Full project description must be at least 10 characters')
    .optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  visibility: z.enum(['public', 'members_only']).optional(),
  coverImageUrl: z.string().url('Must be a valid URL').nullable().optional(),
  technologyIds: z.array(z.string()).optional(),
});

export const addContributorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.string().trim().min(2, 'Role must be at least 2 characters').max(100).optional().default('Contributor'),
});

export const addLinkSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(100),
  url: z
    .string()
    .url('Must be a valid URL')
    .regex(/^https?:\/\//i, 'URL must begin with http:// or https://'),
  linkType: z.enum(['github', 'demo', 'docs', 'paper', 'dataset', 'video', 'other']).optional().default('other'),
  position: z.number().int().min(0).optional(),
});

export const addMediaSchema = z.object({
  mediaUrl: z.string().url('Must be a valid URL'),
  mediaType: z.enum(['image', 'video', 'document']).optional().default('image'),
  altText: z.string().trim().max(255).nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export const projectQuerySchema = z.object({
  category: z.string().optional(),
  technology: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived', 'hidden']).optional(),
  visibility: z.enum(['public', 'members_only']).optional(),
  sortBy: z.enum(['newest', 'updated', 'title']).optional().default('newest'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(12),
});

export const createReportSchema = z.object({
  targetType: z.enum(['project', 'achievement']),
  targetId: z.string().min(1, 'Target ID is required'),
  reason: z.enum(['inappropriate', 'spam', 'copyright', 'misleading', 'abuse', 'other']),
  description: z
    .string()
    .trim()
    .min(5, 'Report description must be at least 5 characters')
    .max(2000, 'Report description cannot exceed 2000 characters'),
});

export const adminHideProjectSchema = z.object({
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters'),
});

export const adminFeatureProjectSchema = z.object({
  position: z.number().int().min(1).optional().default(1),
  featuredUntil: z.string().datetime().nullable().optional(),
});

export const adminResolveReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  adminNotes: z.string().trim().max(2000).optional(),
});
