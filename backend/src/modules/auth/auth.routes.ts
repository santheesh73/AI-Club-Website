import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, AppError } from '../../utils/response';
import { supabaseAdmin } from '../../services/supabase';
import { logger } from '../../utils/logger';
import { localMemoryApplications } from '../applications/applications.service';

/**
 * AI CLUB - Module: auth
 * Secure backend authentication and applicant onboarding
 */
const router = Router();

router.get('/info', (_req, res) => {
  sendSuccess(res, {
    module: 'auth',
    status: 'operational',
    version: '1.0.0',
  });
});

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address.').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  fullName: z.string().min(2, 'Full name is required.').trim(),
  department: z.string().optional(),
  registerNumber: z.string().optional(),
  year: z.number().int().min(1).max(5).optional(),
  section: z.string().optional(),
  role: z.string().optional(),
});

/**
 * Public User Registration Endpoint
 * Creates authenticated Supabase identity with email confirmed, eliminating
 * public email sending quotas and ensuring reliable registration.
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid registration details.';
      return next(new AppError(firstError, 400, 'VALIDATION_ERROR', parsed.error.errors));
    }

    const { email, password, fullName, department, registerNumber, year, section, role } = parsed.data;

    // Hard security check: client must never be able to request a non-applicant role
    if (role && role !== 'applicant') {
      return next(new AppError('You cannot choose your role during registration.', 400, 'VALIDATION_ERROR'));
    }

    if (supabaseAdmin) {
      // Check existing profiles
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return next(
          new AppError('An account with this email already exists. Please sign in instead.', 400, 'USER_EXISTS')
        );
      }

      // Create user with pre-confirmed email via Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'applicant',
        },
        app_metadata: {
          role: 'applicant',
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          return next(
            new AppError('An account with this email already exists. Please sign in instead.', 400, 'USER_EXISTS')
          );
        }
        logger.error('Failed to create user in Supabase Auth:', { error: authError.message });
        return next(new AppError(authError.message, 400, 'REGISTRATION_FAILED'));
      }

      const userId = authData.user.id;

      // Upsert student profile
      await supabaseAdmin.from('profiles').upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          role: 'applicant',
          department: department || null,
          register_number: registerNumber || null,
          year: year || null,
          section: section || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      // Auto-create application record so applicant can directly enter assessment
      try {
        await supabaseAdmin.from('applications').upsert(
          {
            user_id: userId,
            status: 'test_required',
          },
          { onConflict: 'user_id' }
        );
      } catch (appErr) {
        logger.warn('Failed to auto-create application record during signup:', { error: appErr });
      }

      return sendSuccess(
        res,
        {
          userId,
          email,
          role: 'applicant',
          message: 'Account registered successfully.',
        },
        201,
        { requestId: req.requestId }
      );
    } else {
      // Local dev standby mode
      const devId = `dev-${Date.now()}`;
      localMemoryApplications.set(devId, {
        id: `app-${devId}`,
        userId: devId,
        applicationNumber: `AIC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        status: 'test_required',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return sendSuccess(
        res,
        {
          userId: devId,
          email,
          role: 'applicant',
          message: 'Account registered successfully in local standby mode.',
        },
        201,
        { requestId: req.requestId }
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed.';
    next(new AppError(msg, 500, 'INTERNAL_SERVER_ERROR'));
  }
});

export const authRoutes = router;
