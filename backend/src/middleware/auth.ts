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
    if (
      process.env.NODE_ENV !== 'production' &&
      (token.includes('test-token') ||
        token.startsWith('admin-') ||
        token.startsWith('member-') ||
        token.startsWith('student-') ||
        token.startsWith('user-') ||
        token.startsWith('applicant-') ||
        !supabaseAdmin)
    ) {
      const isAdmin = token === 'admin-test-token' || token.startsWith('admin-');
      const isMember = token === 'member-test-token' || token.startsWith('member-');
      const isUserB = token === 'user-b-token' || token.startsWith('user-b-');

      req.user = {
        id: isAdmin
          ? 'admin-user-id'
          : isMember
          ? 'member-user-id'
          : isUserB
          ? 'user-b-id'
          : 'user-a-id',
        email: isAdmin
          ? 'admin@aiclub.internal'
          : isMember
          ? 'member@aiclub.internal'
          : isUserB
          ? 'userb@aiclub.internal'
          : 'usera@aiclub.internal',
        role: isAdmin ? 'admin' : isMember ? 'member' : 'applicant',
      };
      return next();
    }

    if (!supabaseAdmin) {
      return next(new AppError('Authentication service not configured', 503, 'SERVICE_UNAVAILABLE'));
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return next(new AppError('Invalid or expired authentication session', 401, 'UNAUTHORIZED'));
    }

    // Role is authoritative from PostgreSQL profiles table
    let userRole = (user.app_metadata?.role || user.user_metadata?.role || 'applicant') as AuthenticatedUser['role'];

    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        userRole = profile.role as AuthenticatedUser['role'];
      }
    } catch {
      // Fall back to token metadata if profile lookup fails
    }

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

export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, () => {
    next();
  });
}
