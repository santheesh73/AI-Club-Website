import { Request, Response, NextFunction } from 'express';
import { sendSuccess, AppError } from '../../utils/response';
import { supabaseAdmin } from '../../services/supabase';
import type { UpdateProfileInput } from '../../validators/profile.validator';

// In-memory store for local testing/standalone mode when Supabase is not attached
export const localMemoryProfiles: Map<string, Record<string, unknown>> = new Map();

function formatProfileResponse(row: Record<string, unknown>) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || '',
    role: row.role || 'applicant',
    registerNumber: row.register_number || null,
    department: row.department || null,
    year: row.year || null,
    section: row.section || null,
    phone: row.phone || null,
    avatarUrl: row.avatar_url || null,
    bio: row.bio || null,
    skills: row.skills || [],
    interests: row.interests || [],
    githubUrl: row.github_url || null,
    linkedinUrl: row.linkedin_url || null,
    portfolioUrl: row.portfolio_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/v1/profile
 * Retrieves the profile of the currently authenticated user.
 * Identity is derived strictly from the verified session, not from parameters.
 */
export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!supabaseAdmin) {
      // Local development or test fallback
      let existing = localMemoryProfiles.get(user.id);
      if (!existing) {
        existing = {
          id: user.id,
          email: user.email,
          full_name: 'Test Student',
          role: user.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localMemoryProfiles.set(user.id, existing);
      }
      return sendSuccess(res, formatProfileResponse(existing), 200, {
        requestId: req.requestId,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return next(new AppError(error.message, 500, 'DATABASE_ERROR'));
    }

    if (!data) {
      // Lazy auto-provision if missing
      const defaultProfile = {
        id: user.id,
        email: user.email,
        full_name: '',
        role: user.role,
      };
      const { data: created, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (createError) {
        return next(new AppError('Failed to initialize user profile', 500, 'DATABASE_ERROR'));
      }

      return sendSuccess(res, formatProfileResponse(created), 200, {
        requestId: req.requestId,
      });
    }

    return sendSuccess(res, formatProfileResponse(data), 200, {
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/profile
 * Updates the profile of the currently authenticated user.
 * Users can only modify their own profile.
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const updates = req.body as UpdateProfileInput;

    // Map camelCase to snake_case for DB
    const dbPayload: Record<string, unknown> = {};
    if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
    if (updates.registerNumber !== undefined) dbPayload.register_number = updates.registerNumber;
    if (updates.department !== undefined) dbPayload.department = updates.department;
    if (updates.year !== undefined) dbPayload.year = updates.year;
    if (updates.section !== undefined) dbPayload.section = updates.section;
    if (updates.phone !== undefined) dbPayload.phone = updates.phone;
    if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl;
    if (updates.bio !== undefined) dbPayload.bio = updates.bio;
    if (updates.skills !== undefined) dbPayload.skills = updates.skills;
    if (updates.interests !== undefined) dbPayload.interests = updates.interests;
    if (updates.githubUrl !== undefined) dbPayload.github_url = updates.githubUrl;
    if (updates.linkedinUrl !== undefined) dbPayload.linkedin_url = updates.linkedinUrl;
    if (updates.portfolioUrl !== undefined) dbPayload.portfolio_url = updates.portfolioUrl;

    if (!supabaseAdmin) {
      // Local memory fallback
      const existing = localMemoryProfiles.get(user.id) || {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: new Date().toISOString(),
      };
      const updated = {
        ...existing,
        ...dbPayload,
        updated_at: new Date().toISOString(),
      };
      localMemoryProfiles.set(user.id, updated);
      return sendSuccess(res, formatProfileResponse(updated), 200, {
        requestId: req.requestId,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(dbPayload)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return next(new AppError(error.message, 500, 'DATABASE_ERROR'));
    }

    return sendSuccess(res, formatProfileResponse(data), 200, {
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}
