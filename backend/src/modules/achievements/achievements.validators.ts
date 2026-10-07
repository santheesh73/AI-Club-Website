import { z } from 'zod';

export const createAchievementSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  title: z
    .string()
    .trim()
    .min(3, 'Achievement title must be at least 3 characters')
    .max(255, 'Achievement title cannot exceed 255 characters'),
  description: z
    .string()
    .trim()
    .min(5, 'Achievement description must be at least 5 characters')
    .max(2000, 'Achievement description cannot exceed 2000 characters'),
  issuer: z
    .string()
    .trim()
    .min(2, 'Issuing organization must be at least 2 characters')
    .max(255, 'Issuer cannot exceed 255 characters'),
  issuedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Issued date must be in YYYY-MM-DD format'),
  credentialUrl: z
    .string()
    .url('Must be a valid URL')
    .regex(/^https?:\/\//i, 'URL must begin with http:// or https://')
    .nullable()
    .optional(),
  credentialId: z.string().trim().max(255).nullable().optional(),
});

export const updateAchievementSchema = z.object({
  categoryId: z.string().min(1, 'Category is required').optional(),
  title: z
    .string()
    .trim()
    .min(3, 'Achievement title must be at least 3 characters')
    .max(255, 'Achievement title cannot exceed 255 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .min(5, 'Achievement description must be at least 5 characters')
    .max(2000, 'Achievement description cannot exceed 2000 characters')
    .optional(),
  issuer: z
    .string()
    .trim()
    .min(2, 'Issuing organization must be at least 2 characters')
    .max(255, 'Issuer cannot exceed 255 characters')
    .optional(),
  issuedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Issued date must be in YYYY-MM-DD format')
    .optional(),
  credentialUrl: z
    .string()
    .url('Must be a valid URL')
    .regex(/^https?:\/\//i, 'URL must begin with http:// or https://')
    .nullable()
    .optional(),
  credentialId: z.string().trim().max(255).nullable().optional(),
  status: z.enum(['published', 'archived']).optional(),
});

export const adminHideAchievementSchema = z.object({
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters'),
});
