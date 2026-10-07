import { Request, Response, NextFunction } from 'express';
import { sendSuccess, AppError } from '../../utils/response';
import { projectsService } from './projects.service';

export class ProjectsController {
  // ============================================================================
  // TAXONOMY
  // ============================================================================

  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await projectsService.getCategories();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  async getTechnologies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const technologies = await projectsService.getTechnologies();
      sendSuccess(res, technologies);
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // DISCOVERY & SHOWCASE
  // ============================================================================

  async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await projectsService.getProjects(req.query as any, req.user);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getProjectDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectsService.getProjectBySlug(req.params.slug, req.user);
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // MEMBER PROJECT MANAGEMENT
  // ============================================================================

  async getMemberProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const projects = await projectsService.getMemberProjects(req.user.id);
      sendSuccess(res, projects);
    } catch (err) {
      next(err);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const project = await projectsService.createProject(req.user.id, req.body);
      sendSuccess(res, project, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const project = await projectsService.updateProject(
        req.params.id,
        req.user.id,
        req.body,
        req.user.role
      );
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  async publishProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const project = await projectsService.publishProject(
        req.params.id,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  async archiveProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const project = await projectsService.archiveProject(
        req.params.id,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      await projectsService.deleteProject(req.params.id, req.user.id, req.user.role);
      sendSuccess(res, { message: 'Project deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // CONTRIBUTORS
  // ============================================================================

  async addContributor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const project = await projectsService.addContributor(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, project, 201);
    } catch (err) {
      next(err);
    }
  }

  async removeContributor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const project = await projectsService.removeContributor(
        req.params.id,
        req.params.userId,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // LINKS & MEDIA
  // ============================================================================

  async addLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const link = await projectsService.addLink(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, link, 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      await projectsService.deleteLink(req.params.id, req.params.linkId, req.user.id, req.user.role);
      sendSuccess(res, { message: 'Link deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async addMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const media = await projectsService.addMedia(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, media, 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      await projectsService.deleteMedia(
        req.params.id,
        req.params.mediaId,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, { message: 'Media deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // REPORTING
  // ============================================================================

  async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const report = await projectsService.createReport(req.user.id, req.body);
      sendSuccess(res, report, 201);
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN MODERATION
  // ============================================================================

  async getAdminProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await projectsService.getAdminProjects(req.query as any);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async hideProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const project = await projectsService.hideProject(
        req.params.id,
        req.body.reason,
        req.user.id
      );
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  async restoreProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const project = await projectsService.restoreProject(req.params.id, req.user.id);
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  async featureProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const featured = await projectsService.featureProject(
        req.params.id,
        req.body.position,
        req.body.featuredUntil,
        req.user.id
      );
      sendSuccess(res, featured);
    } catch (err) {
      next(err);
    }
  }

  async unfeatureProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      await projectsService.unfeatureProject(req.params.id, req.user.id);
      sendSuccess(res, { message: 'Project unfeatured successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getAdminReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await projectsService.getAdminReports(req.query.status as string);
      sendSuccess(res, reports);
    } catch (err) {
      next(err);
    }
  }

  async resolveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      const report = await projectsService.resolveReport(
        req.params.id,
        req.body.status,
        req.body.adminNotes,
        req.user.id
      );
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  }
}

export const projectsController = new ProjectsController();
