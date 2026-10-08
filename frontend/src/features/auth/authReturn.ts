const EVENT_RETURN_KEY = 'ai_club_event_return';
const INTENT_LIFETIME_MS = 24 * 60 * 60 * 1000;

/** Only a single event's internal discovery URL can carry an RSVP intent. */
export function validateEventReturn(value: unknown): string | null {
  return typeof value === 'string' && /^\/events\/[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value)
    ? value
    : null;
}

export function rememberEventReturn(value: unknown): void {
  const path = validateEventReturn(value);
  if (!path) return;
  try {
    localStorage.setItem(EVENT_RETURN_KEY, JSON.stringify({ path, savedAt: Date.now() }));
  } catch { /* The returnTo URL still works when storage is unavailable. */ }
}

export function readRememberedEventReturn(): string | null {
  try {
    const raw = localStorage.getItem(EVENT_RETURN_KEY);
    if (!raw) return null;
    const intent: unknown = JSON.parse(raw);
    if (!intent || typeof intent !== 'object') return null;
    const { path, savedAt } = intent as Record<string, unknown>;
    if (typeof savedAt !== 'number' || savedAt > Date.now() || Date.now() - savedAt > INTENT_LIFETIME_MS) return null;
    return validateEventReturn(path);
  } catch {
    return null;
  }
}

export function resolveEventReturn(search: string, state?: unknown, useRemembered = true): string | null {
  const query = new URLSearchParams(search);
  if (query.has('returnTo')) return validateEventReturn(query.get('returnTo'));
  if (state && typeof state === 'object') {
    const from = (state as { from?: { pathname?: unknown } }).from?.pathname;
    const eventPath = validateEventReturn(from);
    if (eventPath) return eventPath;
    if (from !== undefined) return null;
  }
  return useRemembered ? readRememberedEventReturn() : null;
}

export function clearEventReturn(): void {
  try { localStorage.removeItem(EVENT_RETURN_KEY); } catch { /* Storage may be disabled. */ }
}

export function eventAuthUrl(page: 'login' | 'register', value: unknown): string {
  const path = validateEventReturn(value);
  return path ? `/${page}?returnTo=${encodeURIComponent(path)}` : `/${page}`;
}

/** Retain protected portal returns without accepting external or encoded paths. */
export function validatePortalReturn(state: unknown): string | null {
  if (!state || typeof state !== 'object') return null;
  const path = (state as { from?: { pathname?: unknown } }).from?.pathname;
  return typeof path === 'string' && /^\/(?:member|applicant|admin)(?:\/[a-z0-9-]+)*\/?$/i.test(path) ? path : null;
}
