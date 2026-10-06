import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateProfileSchema } from '../../validators/profile.validator';
import { getProfile, updateProfile } from './profile.controller';
import { sendSuccess } from '../../utils/response';

/**
 * AI CLUB - Profile Module Routes (Milestone 2)
 * All profile operations are strictly scoped to the authenticated session identity.
 */
const router = Router();

// Module information
router.get('/info', (_req, res) => {
  sendSuccess(res, {
    module: 'profile',
    status: 'operational',
    milestone: 'Milestone 2 Identity & Profiles',
  });
});

// GET /api/v1/profile - Get currently authenticated user's profile
router.get('/', authenticate, getProfile);

// PATCH /api/v1/profile - Update currently authenticated user's profile
router.patch('/', authenticate, validate(updateProfileSchema), updateProfile);

export const profileRoutes = router;
