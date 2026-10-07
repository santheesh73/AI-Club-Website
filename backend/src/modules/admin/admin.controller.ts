import { Request, Response, NextFunction } from 'express';
import { sendSuccess, AppError } from '../../utils/response';
import { adminService } from './admin.service';

export class AdminController {
  /**
   * GET /api/v1/admin/dashboard/summary
   */
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await adminService.getDashboardSummary();
      sendSuccess(res, summary, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/applications
   */
  async getApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        status,
        department,
        search,
        sortBy,
        order,
        page,
        pageSize,
      } = req.query;

      // Validate sortBy against strict allowlist
      const allowedSortFields = ['submitted_at', 'assessment_score', 'student_name', 'application_number'];
      const validatedSortBy =
        typeof sortBy === 'string' && allowedSortFields.includes(sortBy)
          ? (sortBy as 'submitted_at' | 'assessment_score' | 'student_name' | 'application_number')
          : 'submitted_at';

      const validatedOrder = order === 'asc' ? 'asc' : 'desc';

      const result = await adminService.getApplications({
        status: typeof status === 'string' ? status : undefined,
        department: typeof department === 'string' ? department : undefined,
        search: typeof search === 'string' ? search : undefined,
        sortBy: validatedSortBy,
        order: validatedOrder,
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 20,
      });

      sendSuccess(res, result.items, 200, {
        page: result.pagination.page,
        limit: result.pagination.pageSize,
        total: result.pagination.total,
        requestId: req.requestId,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/applications/:id
   */
  async getApplicationDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new AppError('Application ID is required', 400, 'BAD_REQUEST'));
      }

      const detail = await adminService.getApplicationDetail(id);
      sendSuccess(res, detail, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/applications/:id/approve
   */
  async approveApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const reviewerNotes = typeof req.body?.reviewerNotes === 'string' ? req.body.reviewerNotes : undefined;

      const updated = await adminService.approveApplication(
        id,
        adminUser.id,
        reviewerNotes,
        req.requestId
      );

      sendSuccess(res, updated, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/applications/:id/waitlist
   */
  async waitlistApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const reviewerNotes = typeof req.body?.reviewerNotes === 'string' ? req.body.reviewerNotes : undefined;

      const updated = await adminService.waitlistApplication(
        id,
        adminUser.id,
        reviewerNotes,
        req.requestId
      );

      sendSuccess(res, updated, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/applications/:id/reject
   */
  async rejectApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }

      const reason = req.body?.reason;
      if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
        return next(
          new AppError(
            'Rejection reason is required and must be at least 3 characters.',
            400,
            'REJECTION_REASON_REQUIRED'
          )
        );
      }

      const updated = await adminService.rejectApplication(
        id,
        adminUser.id,
        reason.trim(),
        req.requestId
      );

      sendSuccess(res, updated, 200, { requestId: req.requestId });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
