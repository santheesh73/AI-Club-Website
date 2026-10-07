import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { aiIntelligenceController } from './ai.controller';

const router = Router();

// Administrative AI Intelligence routes
router.use(authenticate);
router.use(requireRole(['admin']));

router.get('/', (req, res, next) =>
  aiIntelligenceController.getInsights(req, res, next)
);

router.get('/insights', (req, res, next) =>
  aiIntelligenceController.getInsights(req, res, next)
);

router.post('/generate', (req, res, next) =>
  aiIntelligenceController.generateInsight(req, res, next)
);

router.post('/refresh', (req, res, next) =>
  aiIntelligenceController.generateInsight(req, res, next)
);

export const aiRoutes = router;
export const adminIntelligenceRoutes = router;
