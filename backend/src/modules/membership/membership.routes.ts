import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { membershipController } from './membership.controller';
import { sendSuccess } from '../../utils/response';

/**
 * AI CLUB - Module: membership
 * Milestone 5: Membership Activation & Member Experience
 */
const router = Router();

router.get('/info', (_req, res) => {
  sendSuccess(res, {
    module: 'membership',
    status: 'operational',
    milestone: 'Milestone 5 Membership Activation & Member Experience',
  });
});

// Member Protected Endpoints
router.get('/me', authenticate, (req, res, next) =>
  membershipController.getMyMembership(req, res, next)
);

router.get('/me/dashboard', authenticate, (req, res, next) =>
  membershipController.getMyDashboard(req, res, next)
);

router.get('/me/application', authenticate, (req, res, next) =>
  membershipController.getMyApplication(req, res, next)
);

router.get('/me/assessment', authenticate, (req, res, next) =>
  membershipController.getMyAssessment(req, res, next)
);

router.get('/me/flashcards', authenticate, (req, res, next) =>
  membershipController.getMyFlashcards(req, res, next)
);

export const membershipRoutes = router;
