import { Router } from 'express';
import { leaderboardController } from './leaderboard.controller';
import { authenticate, requireRole } from '../../middleware/auth';

// Member routes
export const memberLeaderboardRoutes = Router();
memberLeaderboardRoutes.use(authenticate);
memberLeaderboardRoutes.use(requireRole(['member', 'admin']));

memberLeaderboardRoutes.get('/', (req, res, next) =>
  leaderboardController.getLeaderboard(req, res, next)
);
memberLeaderboardRoutes.get('/me', (req, res, next) =>
  leaderboardController.getMyRank(req, res, next)
);

// Admin routes
export const adminLeaderboardRoutes = Router();
adminLeaderboardRoutes.use(authenticate);
adminLeaderboardRoutes.use(requireRole(['admin']));

adminLeaderboardRoutes.get('/rankings', (req, res, next) =>
  leaderboardController.getLeaderboard(req, res, next)
);
adminLeaderboardRoutes.get('/rules', (req, res, next) =>
  leaderboardController.getRules(req, res, next)
);
adminLeaderboardRoutes.put('/rules/:activityType', (req, res, next) =>
  leaderboardController.updateRule(req, res, next)
);
adminLeaderboardRoutes.post('/correct', (req, res, next) =>
  leaderboardController.correctPoints(req, res, next)
);
