import type { UserProfile } from '@/types/user';

/**
 * Returns the contextual home / dashboard navigation path based on user authentication and role:
 * - If unauthenticated / signed out -> Returns Landing Page ('/')
 * - If authenticated Admin -> Returns Admin Control Center ('/admin')
 * - If authenticated Member -> Returns Member Dashboard ('/member')
 * - If authenticated Applicant -> Returns Applicant Dashboard ('/applicant')
 */
export function getContextualHomePath(
  isAuthenticated: boolean,
  profile?: UserProfile | null,
  isAdmin?: boolean
): string {
  if (!isAuthenticated) return '/';
  if (isAdmin) return '/admin';
  if (profile?.role === 'member') return '/member';
  if (profile?.role === 'applicant' || profile?.role === 'admin') return '/applicant';
  return '/';
}
