import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Authoritative Server-Side Supabase Client
 * 
 * Configured with SUPABASE_SERVICE_ROLE_KEY for privileged operations
 * (user verification, admin operations, transactional consistency).
 * NEVER expose this service or its keys to client applications.
 */

let clientInstance: SupabaseClient | null = null;

if (
  env.SUPABASE_URL &&
  env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.VITEST &&
  process.env.NODE_ENV !== 'test'
) {
  try {
    clientInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    logger.info('Authoritative Supabase client successfully initialized.');
  } catch (error) {
    logger.error('Failed to initialize Supabase server client', { error });
  }
} else {
  logger.warn(
    'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Backend starting in local standalone mode.'
  );
}

export const supabaseAdmin = clientInstance;
