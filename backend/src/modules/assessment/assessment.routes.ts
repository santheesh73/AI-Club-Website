import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  startAssessment,
  getAttempt,
  saveAnswer,
  submitAssessment,
  getResult,
} from './assessment.controller';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.get('/info', (_req, res) => {
  sendSuccess(res, {
    module: 'assessment',
    status: 'operational',
    milestone: 'Milestone 3: 25-MCQ Assessment Engine',
  });
});

// Start new assessment or resume ongoing attempt for an application
router.post('/applications/:applicationId/start', authenticate, startAssessment);

// Fetch attempt details (questions in persistent order + saved answers + remaining time)
router.get('/attempts/:attemptId', authenticate, getAttempt);

// Autosave individual question response
router.put('/attempts/:attemptId/answers/:questionId', authenticate, saveAnswer);
router.patch('/attempts/:attemptId/answers/:questionId', authenticate, saveAnswer);

// Finalize and submit assessment
router.post('/attempts/:attemptId/submit', authenticate, submitAssessment);

// Get completed assessment result
router.get('/attempts/:attemptId/result', authenticate, getResult);

export const assessmentRoutes = router;
