import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/response';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window bucket store
const ipStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to prevent memory leaks
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      if (now > record.resetTime) {
        ipStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();
}

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipInTest?: boolean;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs || env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000;
  const max = options.max || env.RATE_LIMIT_MAX_REQUESTS || 100;
  const message =
    options.message || 'Too many requests from this IP address. Please try again later.';
  const skipInTest = options.skipInTest !== false;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip in test environment unless explicitly instructed
    if (
      skipInTest &&
      (Boolean(process.env.VITEST) || process.env.NODE_ENV === 'test' || env.NODE_ENV === 'test')
    ) {
      return next();
    }

    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : (req.user?.id || req.ip || req.socket.remoteAddress || 'anonymous');

    const now = Date.now();
    let record = ipStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Set standard rate limit headers
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return next(
        new AppError(
          message,
          429,
          'TOO_MANY_REQUESTS',
          { retryAfterSeconds: resetSeconds }
        )
      );
    }

    next();
  };
}

// Reset rate limits helper (useful in tests)
export function resetRateLimits(): void {
  ipStore.clear();
}

// Specialized Rate Limiters
export const apiRateLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.RATE_LIMIT_MAX_REQUESTS || 100,
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
});

export const assessmentRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Assessment submission rate limit exceeded. Please wait a moment.',
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'AI intelligence request limit exceeded. Advisory insights are cached for 1 hour.',
});

export const reportRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Report submission limit reached. Please wait before submitting additional reports.',
});
