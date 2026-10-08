import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearEventReturn, eventAuthUrl, readRememberedEventReturn, rememberEventReturn, resolveEventReturn, validateEventReturn, validatePortalReturn } from '@/features/auth/authReturn';

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe('Authentication return destinations', () => {
  it.each(['https://evil.example', '//evil.example', '/events/foo/../../admin', '/events/%2fadmin', '/events/foo?next=https://evil.example', '/events/foo#hash', '/admin', '/events', '/events/../admin', '/events/foo\\bar'])('rejects unsafe or unrelated event return %s', (path) => {
    expect(validateEventReturn(path)).toBeNull();
    rememberEventReturn(path);
    expect(readRememberedEventReturn()).toBeNull();
  });

  it('keeps a single event destination through auth links, storage and email verification', () => {
    const path = '/events/practical-ai-workshop';
    rememberEventReturn(path);
    expect(eventAuthUrl('register', path)).toBe('/register?returnTo=%2Fevents%2Fpractical-ai-workshop');
    expect(resolveEventReturn('')).toBe(path);
    expect(resolveEventReturn('?returnTo=%2Fevents%2Fpublic-event')).toBe('/events/public-event');
    expect(resolveEventReturn('', { from: { pathname: path } })).toBe(path);
    clearEventReturn();
    expect(resolveEventReturn('')).toBeNull();
  });

  it('expires stale event intent and does not let an invalid explicit return fall back to it', () => {
    vi.spyOn(Date, 'now').mockReturnValue(100000000);
    rememberEventReturn('/events/public-event');
    expect(resolveEventReturn('?returnTo=%2F%2Fevil.example')).toBeNull();
    vi.spyOn(Date, 'now').mockReturnValue(100000000 + 24 * 60 * 60 * 1000 + 1);
    expect(readRememberedEventReturn()).toBeNull();
  });

  it('retains only known internal protected portal paths', () => {
    rememberEventReturn('/events/public-event');
    expect(resolveEventReturn('', { from: { pathname: '/member/events/public-event' } })).toBeNull();
    expect(resolveEventReturn('', undefined, false)).toBeNull();
    expect(validatePortalReturn({ from: { pathname: '/member/events/public-event' } })).toBe('/member/events/public-event');
    expect(validatePortalReturn({ from: { pathname: '//evil.example/member' } })).toBeNull();
    expect(validatePortalReturn({ from: { pathname: '/member/../../admin' } })).toBeNull();
    expect(validatePortalReturn({ from: { pathname: '/member/%2fadmin' } })).toBeNull();
  });
});
