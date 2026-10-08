import { URL } from 'url';
import dns from 'dns';
import { CourseProviderKey } from './courseProvider.types';
import { PROVIDER_DOMAIN_ALLOWLIST, normalizeCourseUrl } from './urlValidator';

/**
 * Checks if an IPv4 address string falls into private, loopback, link-local,
 * multicast, or reserved ranges.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed -> consider unsafe
  }

  const [a, b, c] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private: 172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 100.64.0.0/10 (Carrier-grade NAT: 100.64.0.0 – 100.127.255.255)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved) & 255.255.255.255 (Broadcast)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address string is private, loopback, link-local, or documentation.
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Loopback (::1) & Unspecified (::)
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:10.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    return isPrivateIPv4(v4Part);
  }

  // Unique local addresses (fc00::/7 -> fc00:: and fd00::)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-local addresses (fe80::/10)
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true;
  }

  // Multicast (ff00::/8)
  if (normalized.startsWith('ff')) return true;

  return false;
}

/**
 * Checks if an IP (v4 or v6) is private/loopback/internal
 */
export function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    return isPrivateIPv6(ip);
  }
  return isPrivateIPv4(ip);
}

/**
 * Detects if a host name string is a known internal/private/metadata host name
 */
export function isInternalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();

  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower === 'metadata.google.internal' ||
    lower === 'instance-data'
  ) {
    return true;
  }

  // Internal and local TLDs
  const forbiddenTlds = ['.local', '.internal', '.lan', '.home', '.corp', '.test', '.invalid', '.example'];
  if (forbiddenTlds.some((tld) => lower.endsWith(tld))) {
    return true;
  }

  // Check if hostname is directly an IP literal
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(lower)) {
    return isPrivateIPv4(lower);
  }

  return false;
}

export interface SafeUrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  canonicalUrl?: string;
  providerKey?: CourseProviderKey;
  providerDisplayName?: string;
  hostname?: string;
  error?: string;
}

/**
 * Resolves DNS for the given hostname and verifies that all resolved IP addresses are public.
 */
export async function verifyPublicDns(hostname: string): Promise<boolean> {
  // If hostname is directly an IP literal:
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return !isPrivateIPv4(hostname);
  }

  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return false;
    }
    // All resolved IPs must be public
    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a Course URL for:
 * 1. Valid syntax
 * 2. Protocol MUST BE https: (reject http, ftp, file, javascript, data)
 * 3. Hostname normalization
 * 4. Authorized provider domain matching
 * 5. Rejection of localhost, private IP literals, and metadata hosts
 * 6. Optional DNS verification for public IPs (SSRF protection)
 */
export async function validateSafeCourseUrl(
  rawUrl: string,
  options: { checkDns?: boolean } = { checkDns: true }
): Promise<SafeUrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'A course URL is required.' };
  }

  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Invalid course URL format.' };
  }

  // 1. Strict HTTPS protocol enforcement
  if (parsed.protocol !== 'https:') {
    return {
      isValid: false,
      error: `Insecure protocol "${parsed.protocol}" is not permitted. Only secure "https://" URLs are allowed.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // 2. Reject internal hostnames and private IP literals immediately
  if (isInternalHostname(hostname)) {
    return {
      isValid: false,
      error: 'Access to localhost, private networks, or metadata services is strictly forbidden (SSRF protection).',
    };
  }

  // 3. Match against approved provider domains
  let matchedProviderKey: CourseProviderKey | null = null;
  let matchedDisplayName = '';

  const providerEntries: [CourseProviderKey, string[], string][] = [
    ['COURSERA', PROVIDER_DOMAIN_ALLOWLIST.COURSERA, 'Coursera'],
    ['FREECODECAMP', PROVIDER_DOMAIN_ALLOWLIST.FREECODECAMP, 'freeCodeCamp'],
    ['UDEMY', PROVIDER_DOMAIN_ALLOWLIST.UDEMY, 'Udemy'],
    ['UNSTOP', PROVIDER_DOMAIN_ALLOWLIST.UNSTOP, 'Unstop'],
    ['EDX', PROVIDER_DOMAIN_ALLOWLIST.EDX, 'edX'],
    ['KAGGLE', PROVIDER_DOMAIN_ALLOWLIST.KAGGLE, 'Kaggle'],
    ['GOOGLE', PROVIDER_DOMAIN_ALLOWLIST.GOOGLE, 'Google Cloud / Skills'],
    ['MICROSOFT', PROVIDER_DOMAIN_ALLOWLIST.MICROSOFT, 'Microsoft Learn'],
    ['AWS', PROVIDER_DOMAIN_ALLOWLIST.AWS, 'AWS Skill Builder'],
    ['NVIDIA', PROVIDER_DOMAIN_ALLOWLIST.NVIDIA, 'NVIDIA Deep Learning Institute'],
    ['STANFORD', PROVIDER_DOMAIN_ALLOWLIST.STANFORD, 'Stanford Online'],
    ['MIT', PROVIDER_DOMAIN_ALLOWLIST.MIT, 'MIT OpenCourseWare'],
  ];

  for (const [key, domains, displayName] of providerEntries) {
    const isMatch = domains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    if (isMatch) {
      matchedProviderKey = key;
      matchedDisplayName = displayName;
      break;
    }
  }

  if (!matchedProviderKey) {
    const supportedList = ['Coursera (coursera.org)', 'freeCodeCamp (freecodecamp.org)', 'Udemy (udemy.com)', 'Unstop (unstop.com)'].join(', ');
    return {
      isValid: false,
      error: `Unsupported provider domain "${hostname}". Supported providers include: ${supportedList}.`,
    };
  }

  // 4. DNS-level SSRF verification (resolve hostname and verify public IP)
  if (options.checkDns) {
    const isPublic = await verifyPublicDns(hostname);
    if (!isPublic) {
      return {
        isValid: false,
        error: `Host "${hostname}" resolved to an internal, private, or unreachable IP address (SSRF blocked).`,
      };
    }
  }

  const canonicalUrl = normalizeCourseUrl(trimmed);

  return {
    isValid: true,
    normalizedUrl: trimmed,
    canonicalUrl,
    providerKey: matchedProviderKey,
    providerDisplayName: matchedDisplayName,
    hostname,
  };
}
