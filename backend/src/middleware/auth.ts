import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response';
import { supabaseAdmin } from '../services/supabase';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'applicant' | 'member' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token missing or invalid', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!supabaseAdmin) {
      // In local development/testing without live Supabase cloud connection
      if (process.env.NODE_ENV !== 'production') {
        const isAdmin = token === 'admin-test-token';
        const isUserB = token === 'user-b-token';

        req.user = {
          id: isAdmin ? 'admin-user-id' : isUserB ? 'user-b-id' : 'user-a-id',
          email: isAdmin
            ? 'admin@aiclub.internal'
            : isUserB
            ? 'userb@aiclub.internal'
            : 'usera@aiclub.internal',
          role: isAdmin ? 'admin' : 'applicant',
        };
        return next();
      }
      return next(new AppError('Authentication service not configured', 503, 'SERVICE_UNAVAILABLE'));
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return next(new AppError('Invalid or expired authentication session', 401, 'UNAUTHORIZED'));
    }

    // Role is authoritative from user metadata or database profile
    const userRole = (user.app_metadata?.role || user.user_metadata?.role || 'applicant') as AuthenticatedUser['role'];

    req.user = {
      id: user.id,
      email: user.email || '',
      role: userRole,
    };

    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication verification failed';
    next(new AppError(message, 401, 'UNAUTHORIZED'));
  }
}

export function requireRole(allowedRoles: Array<'applicant' | 'member' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'Forbidden: You do not possess the required authorization role to access this resource',
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
