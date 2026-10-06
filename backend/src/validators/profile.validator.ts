import { z } from 'zod';

/**
 * AI CLUB - Profile Validation Schemas (Milestone 2)
 * 
 * Enforces strict typing and domain rules.
 * Disallows client manipulation of id, email, role, or timestamps.
 */

const phoneRegex = /^[0-9+\- ()]{7,20}$/;

export const updateProfileSchema = {
  body: z
    .object({
      fullName: z
        .string()
        .min(1, 'Full name cannot be empty')
        .max(100, 'Full name cannot exceed 100 characters')
        .trim()
        .optional(),
      registerNumber: z
        .string()
        .max(50, 'Register number cannot exceed 50 characters')
        .trim()
        .optional(),
      department: z
        .string()
        .max(100, 'Department cannot exceed 100 characters')
        .trim()
        .optional(),
      year: z
        .number()
        .int('Year must be an integer')
        .min(1, 'Year must be between 1 and 5')
        .max(5, 'Year must be between 1 and 5')
        .optional(),
      section: z
        .string()
        .max(10, 'Section cannot exceed 10 characters')
        .trim()
        .optional(),
      phone: z
        .string()
        .regex(phoneRegex, 'Invalid phone number format')
        .trim()
        .optional(),
      avatarUrl: z
        .string()
        .url('Avatar must be a valid URL')
        .max(500)
        .optional(),
      bio: z
        .string()
        .max(1000, 'Bio cannot exceed 1000 characters')
        .trim()
        .optional(),
      skills: z
        .array(z.string().max(50).trim())
        .max(50, 'Cannot exceed 50 skills')
        .optional(),
      interests: z
        .array(z.string().max(50).trim())
        .max(50, 'Cannot exceed 50 interests')
        .optional(),
      githubUrl: z
        .string()
        .url('GitHub link must be a valid URL')
        .max(300)
        .optional(),
      linkedinUrl: z
        .string()
        .url('LinkedIn link must be a valid URL')
        .max(300)
        .optional(),
      portfolioUrl: z
        .string()
        .url('Portfolio link must be a valid URL')
        .max(300)
        .optional(),
    })
    .strict('Unexpected fields. You cannot modify protected fields like role or id.'),
};

export type UpdateProfileInput = z.infer<typeof updateProfileSchema.body>;
