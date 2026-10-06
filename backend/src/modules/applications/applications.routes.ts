import { Router } from 'express';
import { sendSuccess } from '../../utils/response';

/**
 * AI CLUB - Module: applications
 * Architectural foundation established for Milestone 1.
 * Business endpoints will be attached during respective milestones.
 */
const router = Router();

router.get('/info', (_req, res) => {
  sendSuccess(res, {
    module: 'applications',
    status: 'initialized',
    milestone: 'Milestone 1 Architecture'
  });
});

export const applicationsRoutes = router;
