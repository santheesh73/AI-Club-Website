import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;

  // Custom AppError
  if (err instanceof AppError) {
    logger.warn(`Application Error: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      requestId,
      details: err.details,
    });
    return sendError(res, err.statusCode, err.code, err.message, err.details, requestId);
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn('Request Validation Error', { requestId, errors: formatted });
    return sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', formatted, requestId);
  }

  // Generic Uncaught Server Error
  const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error('Unhandled Server Error', {
    requestId,
    error: errorMessage,
    stack: env.NODE_ENV === 'production' ? undefined : stack,
  });

  const responseMessage =
    env.NODE_ENV === 'production' ? 'Internal server error' : errorMessage;

  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    responseMessage,
    env.NODE_ENV === 'production' ? undefined : { stack },
    requestId
  );
}
