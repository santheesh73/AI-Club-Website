import { Router } from 'express';
import { projectIdeasController } from './projectIdeas.controller';
import { authenticate, requireRole } from '../../middleware/auth';

// Member routes: Read published ideas
export const memberProjectIdeasRoutes = Router();
memberProjectIdeasRoutes.use(authenticate);
memberProjectIdeasRoutes.use(requireRole(['member', 'admin']));

memberProjectIdeasRoutes.get('/', (req, res, next) =>
  projectIdeasController.getIdeas(req, res, next)
);

// Admin routes: Full management
export const adminProjectIdeasRoutes = Router();
adminProjectIdeasRoutes.use(authenticate);
adminProjectIdeasRoutes.use(requireRole(['admin']));

adminProjectIdeasRoutes.get('/', (req, res, next) =>
  projectIdeasController.getAdminIdeas(req, res, next)
);
adminProjectIdeasRoutes.post('/', (req, res, next) =>
  projectIdeasController.createIdea(req, res, next)
);
adminProjectIdeasRoutes.put('/:id', (req, res, next) =>
  projectIdeasController.updateIdea(req, res, next)
);
adminProjectIdeasRoutes.delete('/:id', (req, res, next) =>
  projectIdeasController.archiveIdea(req, res, next)
);
