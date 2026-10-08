import { Request, Response, NextFunction } from 'express';
import { membershipService } from './membership.service';
import { flashcardService } from '../dashboard/flashcard.service';
import { sendSuccess, AppError } from '../../utils/response';

export class MembershipController {
  /**
   * Admin-triggered membership activation for an approved application
   * POST /api/v1/admin/memberships/activate
   */
  async activateMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { applicationId, notes } = req.body;

      if (!applicationId || typeof applicationId !== 'string') {
        throw new AppError('Valid applicationId is required', 400, 'APPLICATION_ID_REQUIRED');
      }

      const actorId = req.user?.id || 'admin-system';
      const requestId = (req as any).requestId;

      const membership = await membershipService.activateMembership(
        applicationId.trim(),
        actorId,
        typeof notes === 'string' ? notes.trim() : undefined,
        requestId
      );

      sendSuccess(
        res,
        {
          membership,
          message: `Membership successfully activated. Member Number: ${membership.memberNumber}`,
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active membership for the authenticated user
   * GET /api/v1/membership/me
   */
  async getMyMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const membership = await membershipService.getMembershipByUserId(userId);

      if (!membership) {
        throw new AppError(
          'No active membership found for your account. Please check your application status.',
          404,
          'MEMBERSHIP_NOT_FOUND'
        );
      }

      sendSuccess(res, membership);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get full member dashboard data
   * GET /api/v1/membership/me/dashboard
   */
  async getMyDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dashboard = await membershipService.getMemberDashboard(userId);
      sendSuccess(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get member's own linked application
   * GET /api/v1/membership/me/application
   */
  async getMyApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dashboard = await membershipService.getMemberDashboard(userId);
      sendSuccess(res, dashboard.application);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get member's own assessment results
   * GET /api/v1/membership/me/assessment
   */
  async getMyAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dashboard = await membershipService.getMemberDashboard(userId);

      if (!dashboard.assessment) {
        throw new AppError('Assessment record not found', 404, 'ASSESSMENT_NOT_FOUND');
      }

      sendSuccess(res, dashboard.assessment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get member dashboard spotlight flashcards
   * GET /api/v1/membership/me/flashcards
   */
  async getMyFlashcards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const membership = await membershipService.getMembershipByUserId(userId);
      if (!membership || membership.status !== 'active') {
        throw new AppError(
          'Active membership required to access member flashcards.',
          403,
          'ACTIVE_MEMBERSHIP_REQUIRED'
        );
      }

      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const flashcards = await flashcardService.getMemberFlashcards(userId, limit);
      sendSuccess(res, { flashcards });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: List members with pagination and filters
   * GET /api/v1/admin/members
   */
  async getMembersList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize), 10) : 10;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;

      const result = await membershipService.getAllMembers({
        page,
        pageSize,
        search,
        status,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const membershipController = new MembershipController();
