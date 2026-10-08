import { validateSafeCourseUrl } from './ssrfGuard';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../utils/response';

export interface FetchCoursePageOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  maxRedirects?: number;
  userAgent?: string;
  checkDns?: boolean;
}

export interface FetchCoursePageResult {
  html: string;
  finalUrl: string;
  statusCode: number;
  contentType: string;
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB limit
const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (AI Club Bot/1.0)';

/**
 * Fetches course HTML content with strict SSRF defense, size bounds, and redirect validation.
 */
export async function fetchCoursePage(
  initialUrl: string,
  options: FetchCoursePageOptions = {}
): Promise<FetchCoursePageResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const checkDns = options.checkDns ?? true;

  let currentUrl = initialUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    // 1. SSRF and Domain verification before each hop
    const check = await validateSafeCourseUrl(currentUrl, { checkDns });
    if (!check.isValid) {
      logger.warn(`[SafeFetcher] Blocked URL fetch: ${check.error}`, { url: currentUrl });
      throw new AppError(check.error || 'Invalid or forbidden course URL.', 400, 'SSRF_BLOCKED');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        redirect: 'manual', // Manual handling to audit EVERY hop!
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Handle Redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          throw new AppError('Too many redirects while attempting to fetch course page.', 422, 'REDIRECT_LIMIT_EXCEEDED');
        }

        const locationHeader = response.headers.get('location');
        if (!locationHeader) {
          throw new AppError('Redirect response missing Location header.', 422, 'INVALID_REDIRECT');
        }

        // Resolve absolute redirect URL
        const nextUrl = new URL(locationHeader, currentUrl).toString();
        currentUrl = nextUrl;
        continue; // Next loop iteration with new target
      }

      if (!response.ok) {
        logger.warn(`[SafeFetcher] Non-OK status ${response.status} for ${currentUrl}`);
        throw new AppError(
          'Unable to access this course page.',
          422,
          'PAGE_FETCH_FAILED'
        );
      }

      // Check Content-Type
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isHtml =
        contentType.includes('text/html') ||
        contentType.includes('application/xhtml+xml') ||
        contentType.includes('text/plain');

      if (!isHtml) {
        throw new AppError(
          'Target URL did not return an HTML web page.',
          415,
          'UNSUPPORTED_MEDIA_TYPE'
        );
      }

      // Check Content-Length if present
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const len = parseInt(contentLengthHeader, 10);
        if (!isNaN(len) && len > maxSizeBytes) {
          throw new AppError(
            'Course page exceeds maximum allowable download size.',
            413,
            'PAYLOAD_TOO_LARGE'
          );
        }
      }

      // Read response body safely with size ceiling
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > maxSizeBytes) {
        throw new AppError(
          'Course page response body exceeded maximum allowable size.',
          413,
          'PAYLOAD_TOO_LARGE'
        );
      }

      const decoder = new TextDecoder('utf-8');
      const html = decoder.decode(arrayBuffer);

      return {
        html,
        finalUrl: currentUrl,
        statusCode: response.status,
        contentType,
      };
    } catch (err: unknown) {
      clearTimeout(timer);

      if (err instanceof AppError) {
        throw err;
      }

      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort') || msg.includes('timeout')) {
        logger.warn(`[SafeFetcher] Request timed out for ${currentUrl}`);
        throw new AppError('Request timed out while accessing the course page.', 504, 'FETCH_TIMEOUT');
      }

      logger.warn(`[SafeFetcher] Failed to fetch ${currentUrl}: ${msg}`);
      throw new AppError('Unable to access this course page.', 422, 'PAGE_FETCH_FAILED');
    }
  }

  throw new AppError('Unable to access this course page.', 422, 'PAGE_FETCH_FAILED');
}
