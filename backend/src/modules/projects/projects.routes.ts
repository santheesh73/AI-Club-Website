import { Router } from 'express';
import { authenticate, requireRole, optionalAuthenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { projectsController } from './projects.controller';
import {
  createProjectSchema,
  updateProjectSchema,
  addContributorSchema,
  addLinkSchema,
  addMediaSchema,
  projectQuerySchema,
  createReportSchema,
  adminHideProjectSchema,
  adminFeatureProjectSchema,
  adminResolveReportSchema,
} from './projects.validators';

// ============================================================================
// PUBLIC & DISCOVERY PROJECTS ROUTER (/api/v1/projects)
// ============================================================================
const router = Router();

// Taxonomy metadata
router.get('/categories', (req, res, next) => projectsController.getCategories(req, res, next));
router.get('/technologies', (req, res, next) => projectsController.getTechnologies(req, res, next));

// Public showcase / discovery catalog
router.get(
  '/',
  optionalAuthenticate,
  validate({ query: projectQuerySchema }),
  (req, res, next) => projectsController.getProjects(req, res, next)
);

// Member project list if accessed directly on /projects/member
router.get(
  '/member',
  authenticate,
  requireRole(['member', 'admin']),
  (req, res, next) => projectsController.getMemberProjects(req, res, next)
);

// Report project or achievement
router.post(
  '/report',
  authenticate,
  validate({ body: createReportSchema }),
  (req, res, next) => projectsController.createReport(req, res, next)
);

// Project detail inspection by slug (explicit route)
router.get(
  '/detail/:slug',
  optionalAuthenticate,
  (req, res, next) => projectsController.getProjectDetail(req, res, next)
);

// Project detail inspection by slug (parameterized route - placed last to avoid route collisions)
router.get(
  '/:slug',
  optionalAuthenticate,
  (req, res, next) => projectsController.getProjectDetail(req, res, next)
);

export const projectsRoutes = router;

// ============================================================================
// MEMBER PROJECTS ROUTER (/api/v1/member/projects)
// ============================================================================
const memberRouter = Router();

memberRouter.use(authenticate);
memberRouter.use(requireRole(['member', 'admin']));

memberRouter.get('/', (req, res, next) => projectsController.getMemberProjects(req, res, next));

memberRouter.post(
  '/',
  validate({ body: createProjectSchema }),
  (req, res, next) => projectsController.createProject(req, res, next)
);

memberRouter.patch(
  '/:id',
  validate({ body: updateProjectSchema }),
  (req, res, next) => projectsController.updateProject(req, res, next)
);

memberRouter.post(
  '/:id/publish',
  (req, res, next) => projectsController.publishProject(req, res, next)
);

memberRouter.post(
  '/:id/archive',
  (req, res, next) => projectsController.archiveProject(req, res, next)
);

memberRouter.delete(
  '/:id',
  (req, res, next) => projectsController.deleteProject(req, res, next)
);

// Contributors
memberRouter.post(
  '/:id/contributors',
  validate({ body: addContributorSchema }),
  (req, res, next) => projectsController.addContributor(req, res, next)
);

memberRouter.delete(
  '/:id/contributors/:userId',
  (req, res, next) => projectsController.removeContributor(req, res, next)
);

// Links
memberRouter.post(
  '/:id/links',
  validate({ body: addLinkSchema }),
  (req, res, next) => projectsController.addLink(req, res, next)
);

memberRouter.delete(
  '/:id/links/:linkId',
  (req, res, next) => projectsController.deleteLink(req, res, next)
);

// Media
memberRouter.post(
  '/:id/media',
  validate({ body: addMediaSchema }),
  (req, res, next) => projectsController.addMedia(req, res, next)
);

memberRouter.delete(
  '/:id/media/:mediaId',
  (req, res, next) => projectsController.deleteMedia(req, res, next)
);

export const memberProjectsRoutes = memberRouter;

// ============================================================================
// ADMIN PROJECTS & COMMUNITY ROUTER (/api/v1/admin/projects or /admin/community)
// ============================================================================
const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole(['admin']));

adminRouter.get(
  '/',
  validate({ query: projectQuerySchema }),
  (req, res, next) => projectsController.getAdminProjects(req, res, next)
);

adminRouter.post(
  '/:id/hide',
  validate({ body: adminHideProjectSchema }),
  (req, res, next) => projectsController.hideProject(req, res, next)
);

adminRouter.post(
  '/:id/restore',
  (req, res, next) => projectsController.restoreProject(req, res, next)
);

adminRouter.post(
  '/:id/feature',
  validate({ body: adminFeatureProjectSchema }),
  (req, res, next) => projectsController.featureProject(req, res, next)
);

adminRouter.delete(
  '/:id/feature',
  (req, res, next) => projectsController.unfeatureProject(req, res, next)
);

adminRouter.get(
  '/reports',
  (req, res, next) => projectsController.getAdminReports(req, res, next)
);

adminRouter.post(
  '/reports/:id/resolve',
  validate({ body: adminResolveReportSchema }),
  (req, res, next) => projectsController.resolveReport(req, res, next)
);

export const adminProjectsRoutes = adminRouter;
