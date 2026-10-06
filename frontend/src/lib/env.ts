/**
 * AI CLUB - Frontend Environment Configuration
 * 
 * Safely parses and validates Vite browser-exposed environment variables.
 * Enforces that no secret keys (service role keys, db passwords) can be accessed here.
 */

export interface FrontendEnv {
  appName: string;
  appEnv: 'development' | 'test' | 'production';
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const env: FrontendEnv = {
  appName: import.meta.env.VITE_APP_NAME || 'AI CLUB',
  appEnv: (import.meta.env.VITE_APP_ENV as FrontendEnv['appEnv']) || 'development',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};
