import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createApplication,
  getMyApplication,
  getMyApplicationStatus,
} from './applications.controller';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.get('/info', (_req, res) => {
  sendSuccess(res, {
    module: 'applications',
    status: 'operational',
    milestone: 'Milestone 3 Admissions & Assessment Engine',
  });
});

import { startAssessment } from '../assessment/assessment.controller';

// Authenticated application operations
router.post('/', authenticate, createApplication);
router.get('/me', authenticate, getMyApplication);
router.get('/me/status', authenticate, getMyApplicationStatus);
router.post('/:applicationId/assessment/start', authenticate, startAssessment);

export const applicationsRoutes = router;
