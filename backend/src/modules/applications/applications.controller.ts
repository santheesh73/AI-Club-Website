import { Request, Response, NextFunction } from 'express';
import { sendSuccess, AppError } from '../../utils/response';
import { applicationsService } from './applications.service';

export async function createApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const application = await applicationsService.createApplication(user.id);
    return sendSuccess(res, application, 201, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getMyApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const application = await applicationsService.getApplicationByUserId(user.id);
    if (!application) {
      return next(new AppError('No application found for this account', 404, 'APPLICATION_NOT_FOUND'));
    }

    return sendSuccess(res, application, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getMyApplicationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const application = await applicationsService.getApplicationByUserId(user.id);
    if (!application) {
      return sendSuccess(
        res,
        {
          hasApplication: false,
          application: null,
          profileComplete: true,
          missingFields: [],
          canStartAssessment: false,
          assessmentStatus: 'not_started',
          status: 'NOT_STARTED',
        },
        200,
        { requestId: req.requestId }
      );
    }

    const canStartAssessment =
      application.status === 'test_required' ||
      application.status === 'test_in_progress' ||
      application.status === 'draft';

    const assessmentStatus =
      application.status === 'test_completed' || application.status === 'under_review'
        ? 'completed'
        : application.status === 'test_in_progress'
        ? 'in_progress'
        : 'not_started';

    return sendSuccess(
      res,
      {
        hasApplication: true,
        application,
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        profileComplete: true,
        missingFields: [],
        canStartAssessment,
        assessmentStatus,
        assessmentScore: application.assessmentScore,
        assessmentPercentage: application.assessmentPercentage,
        assessmentPassed: application.assessmentPassed,
        submittedAt: application.submittedAt,
      },
      200,
      { requestId: req.requestId }
    );
  } catch (err) {
    next(err);
  }
}
