/**
 * AI CLUB - Centralized Authentication Error Sanitizer
 * 
 * Maps raw Supabase / network authentication errors into clear, friendly user-facing messages.
 * Prevents leaking technical internal traces to users.
 */

export function mapAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Email or password is incorrect.';
  }

  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  if (lower.includes('password should be at least') || lower.includes('weak password')) {
    return 'Password must be at least 6 characters long.';
  }

  if (lower.includes('token has expired') || lower.includes('otp expired') || lower.includes('recovery link')) {
    return 'The password recovery link has expired or has already been used. Please request a new one.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox.';
  }

  if (lower.includes('email rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'Email service limit reached. Please wait a few minutes before trying again.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }

  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Unable to reach the server. Please check your network connection and try again.';
  }

  return 'Authentication failed. Please verify your details and try again.';
}
