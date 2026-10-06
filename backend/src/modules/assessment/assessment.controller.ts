import { Request, Response, NextFunction } from 'express';
import { sendSuccess, AppError } from '../../utils/response';
import { assessmentService } from './assessment.service';

export async function startAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { applicationId } = req.params;
    if (!applicationId) {
      return next(new AppError('Application ID parameter required', 400, 'VALIDATION_ERROR'));
    }

    const data = await assessmentService.startAssessment(user.id, applicationId);
    return sendSuccess(res, data, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { attemptId } = req.params;
    const data = await assessmentService.getAttempt(user.id, attemptId);
    return sendSuccess(res, data, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function saveAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { attemptId, questionId } = req.params;
    const { selectedOption } = req.body;

    if (!selectedOption) {
      return next(new AppError('selectedOption is required', 400, 'VALIDATION_ERROR'));
    }

    const data = await assessmentService.saveAnswer(user.id, attemptId, questionId, selectedOption);
    return sendSuccess(res, data, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function submitAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { attemptId } = req.params;
    const result = await assessmentService.submitAssessment(user.id, attemptId);
    return sendSuccess(res, result, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}

export async function getResult(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { attemptId } = req.params;
    const result = await assessmentService.getResult(user.id, attemptId);
    return sendSuccess(res, result, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
}
