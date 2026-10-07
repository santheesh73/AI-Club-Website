import { URL } from 'url';
import { CourseProviderKey } from './courseProvider.types';

/**
 * AI CLUB - Provider Official Domain Allowlist
 * Strict security barrier: Prevents arbitrary redirects or phishing links.
 */
export const PROVIDER_DOMAIN_ALLOWLIST: Record<CourseProviderKey, string[]> = {
  COURSERA: ['coursera.org', 'www.coursera.org'],
  FREECODECAMP: ['freecodecamp.org', 'www.freecodecamp.org'],
  UDEMY: ['udemy.com', 'www.udemy.com'],
  UNSTOP: ['unstop.com', 'www.unstop.com'],
  EDX: ['edx.org', 'www.edx.org'],
  KAGGLE: ['kaggle.com', 'www.kaggle.com'],
  GOOGLE: ['grow.google', 'cloud.google.com', 'developers.google.com'],
  MICROSOFT: ['learn.microsoft.com'],
  AWS: ['skillbuilder.aws', 'aws.amazon.com'],
  NVIDIA: ['nvidia.com', 'www.nvidia.com', 'learn.nvidia.com'],
  STANFORD: ['online.stanford.edu'],
  MIT: ['ocw.mit.edu'],
  OTHER: [], // Requires explicit approved domain registration
};

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
  detectedProvider?: CourseProviderKey;
}

/**
 * Map provider string (case-insensitive, fuzzy or enum) to controlled CourseProviderKey
 */
export function normalizeProviderKey(providerStr: string): CourseProviderKey {
  const clean = providerStr.toUpperCase().trim();
  if (clean.includes('COURSERA')) return 'COURSERA';
  if (clean.includes('FREECODECAMP')) return 'FREECODECAMP';
  if (clean.includes('UDEMY')) return 'UDEMY';
  if (clean.includes('UNSTOP')) return 'UNSTOP';
  if (clean.includes('EDX')) return 'EDX';
  if (clean.includes('KAGGLE')) return 'KAGGLE';
  if (clean.includes('GOOGLE')) return 'GOOGLE';
  if (clean.includes('MICROSOFT')) return 'MICROSOFT';
  if (clean.includes('AWS')) return 'AWS';
  if (clean.includes('NVIDIA')) return 'NVIDIA';
  if (clean.includes('STANFORD')) return 'STANFORD';
  if (clean.includes('MIT')) return 'MIT';
  return 'OTHER';
}

/**
 * Normalize and strip tracking parameters from official course URLs
 */
export function normalizeCourseUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    // Strip common marketing and analytics tracking parameters
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'fbclid', 'gclid'];
    for (const p of paramsToRemove) {
      parsed.searchParams.delete(p);
    }
    // Remove trailing slash from pathname if present (except root)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Validates that an official course URL:
 * 1. Has valid URL syntax
 * 2. Uses HTTPS
 * 3. Matches the designated provider's authorized domain allowlist
 */
export function validateOfficialCourseUrl(
  urlStr: string,
  expectedProvider: string | CourseProviderKey
): UrlValidationResult {
  if (!urlStr || typeof urlStr !== 'string') {
    return { isValid: false, error: 'Course official URL is required.' };
  }

  const trimmed = urlStr.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Invalid URL format.' };
  }

  // 1. HTTPS requirement
  if (parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only secure HTTPS course URLs are permitted.' };
  }

  // 2. Resolve expected provider key
  const providerKey = typeof expectedProvider === 'string'
    ? normalizeProviderKey(expectedProvider)
    : expectedProvider;

  const allowedDomains = PROVIDER_DOMAIN_ALLOWLIST[providerKey] || [];
  const hostname = parsed.hostname.toLowerCase();

  // 3. Domain validation
  if (allowedDomains.length > 0) {
    const matchesDomain = allowedDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    if (!matchesDomain) {
      return {
        isValid: false,
        error: `URL domain "${hostname}" does not belong to authorized domains for provider "${providerKey}" (${allowedDomains.join(', ')}).`,
      };
    }
  } else if (providerKey === 'OTHER') {
    // For 'OTHER', domain must be a valid reputable domain (disallow localhost or private IPs)
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    ) {
      return { isValid: false, error: 'Internal or local network URLs are strictly forbidden.' };
    }
  }

  return {
    isValid: true,
    normalizedUrl: normalizeCourseUrl(trimmed),
    detectedProvider: providerKey,
  };
}
