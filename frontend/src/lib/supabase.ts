import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * AI CLUB - Public Supabase Client Abstraction
 * 
 * Uses only browser-safe public anon keys.
 * Authoritative security is enforced by PostgreSQL Row-Level Security (RLS) policies.
 */

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    // Provide a mocked or warning stub in local development if environment variables are not yet populated
    console.warn(
      '[AI CLUB] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured. Supabase client initialized in fallback mode.'
    );
  }

  supabaseInstance = createClient(
    env.supabaseUrl || 'https://placeholder-project.supabase.co',
    env.supabaseAnonKey || 'placeholder-anon-key',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  return supabaseInstance;
}

export const supabase = getSupabaseClient();
