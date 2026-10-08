import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
const database = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock('../src/services/supabase', () => ({ supabaseAdmin: database }));
import { app } from '../src/server';
import { env } from '../src/config/env';
import { localMemoryApplications } from '../src/modules/applications/applications.service';
import { membershipService } from '../src/modules/membership/membership.service';
import { notificationsService } from '../src/modules/notifications/notifications.service';
import { eventsService, localMemoryEvents, localMemoryRegistrations } from '../src/modules/events/events.service';
import type { EventRecord } from '../src/modules/events/events.types';

const eventId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
function seed(overrides: Partial<EventRecord> = {}): EventRecord {
  const now = Date.now();
  const event: EventRecord = {
    id: eventId, title: 'Public workshop', slug: 'public-workshop', shortDescription: 'Learn by building',
    description: 'Practical AI workshop for account holders.', category: 'workshop', eventMode: 'online',
    isOnline: true, meetingUrl: 'https://private.example/meeting', startAt: new Date(now + 86400000).toISOString(),
    endAt: new Date(now + 90000000).toISOString(), registrationOpenAt: new Date(now - 86400000).toISOString(),
    registrationCloseAt: new Date(now + 80000000).toISOString(), capacity: 2, eligibility: 'public',
    status: 'published', tags: ['AI'], createdBy: 'private-admin', publishedAt: new Date(now).toISOString(),
    cancellationReason: 'internal reason', createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
    ...overrides,
  };
  localMemoryEvents.set(event.id, event);
  return event;
}
function chain(result: unknown) {
  const builder: any = { then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) };
  for (const method of ['select', 'eq', 'neq', 'in', 'order', 'limit', 'update', 'insert']) builder[method] = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(async () => result); builder.single = vi.fn(async () => result);
  return builder;
}
beforeEach(() => {
  env.NODE_ENV = 'test'; eventsService.resetLocalState(); membershipService.resetLocalState(); vi.clearAllMocks();
  database.from.mockImplementation(() => chain({ data: [], error: null }));
});
afterEach(() => { env.NODE_ENV = 'test'; vi.restoreAllMocks(); });

describe('Public event discovery and authenticated account RSVP', () => {
  it('lists only safe published previews and hides draft/private detail even by known slug', async () => {
    const visible = seed(); seed({ id: 'draft', slug: 'draft', status: 'draft' });
    seed({ id: 'private', slug: 'private', eligibility: 'admin_only' });
    seed({ id: 'member-preview', slug: 'member-preview', eligibility: 'members_only' });
    const result = await request(app).get('/api/v1/events');
    expect(result.status).toBe(200); expect(result.body.data).toHaveLength(2);
    const detail = await request(app).get(`/api/v1/events/${visible.slug}`);
    expect(detail.body.data.startAt).toBe(visible.startAt);
    for (const field of ['meetingUrl', 'createdBy', 'createdAt', 'updatedAt', 'cancellationReason', 'publishedAt', 'attendees', 'metadata']) {
      expect(detail.body.data).not.toHaveProperty(field);
      expect(result.body.data[0]).not.toHaveProperty(field);
    }
    expect((await request(app).get('/api/v1/events/draft')).status).toBe(404);
    expect((await request(app).get('/api/v1/events/private')).status).toBe(404);
  });
  it('allows applicants to register, read own status, cancel and re-register public events', async () => {
    const notification = vi.spyOn(notificationsService, 'createNotification');
    seed(); const path = `/api/v1/events/${eventId}`; const auth = 'Bearer applicant-test-token';
    expect((await request(app).post(`${path}/register`)).status).toBe(401);
    const registered = await request(app).post(`${path}/register`).set('Authorization', auth);
    expect(registered.status).toBe(201); expect(registered.body.data.userId).toBe('user-a-id');
    expect(notification).toHaveBeenCalledWith(expect.objectContaining({ actionUrl: '/events/public-workshop' }));
    const status = await request(app).get(`${path}/registration`).set('Authorization', auth);
    expect(status.body.data.isRegistered).toBe(true);
    expect(status.body.data.meetingUrl).toBe('https://private.example/meeting');
    expect((await request(app).post(`${path}/register`).set('Authorization', auth)).body.error.code).toBe('ALREADY_REGISTERED');
    const other = await request(app).get(`${path}/registration`).set('Authorization', 'Bearer user-b-token');
    expect(other.body.data).toEqual({ isRegistered: false, registration: null, meetingUrl: null });
    expect((await request(app).delete(`${path}/registration`).set('Authorization', 'Bearer user-b-token')).status).toBe(404);
    expect((await request(app).delete(`${path}/registration`).set('Authorization', auth)).body.data.status).toBe('cancelled');
    expect((await request(app).get(`${path}/registration`).set('Authorization', auth)).body.data.meetingUrl).toBeNull();
    expect((await request(app).post(`${path}/register`).set('Authorization', auth)).status).toBe(201);
  });
  it('requires active membership for members-only RSVP and preserves member/admin boundaries', async () => {
    seed({ eligibility: 'members_only' }); const path = `/api/v1/events/${eventId}/register`;
    expect((await request(app).post(path).set('Authorization', 'Bearer applicant-test-token')).body.error.code).toBe('MEMBERSHIP_REQUIRED');
    expect((await request(app).post(path).set('Authorization', 'Bearer member-test-token')).status).toBe(201);
    expect((await request(app).get('/api/v1/member/events').set('Authorization', 'Bearer applicant-test-token')).status).toBe(403);
    expect((await request(app).get(`/api/v1/admin/events/${eventId}/registrations`).set('Authorization', 'Bearer applicant-test-token')).status).toBe(403);
    seed({ eligibility: 'admin_only' });
    expect((await request(app).post(path).set('Authorization', 'Bearer applicant-test-token')).status).toBe(404);
    expect((await request(app).get('/api/v1/member/events/public-workshop').set('Authorization', 'Bearer member-test-token')).status).toBe(404);
    expect((await request(app).post(path).set('Authorization', 'Bearer admin-test-token')).status).toBe(201);
  });
  it.each(['suspended', 'revoked'] as const)('denies members-only RSVP for a %s member while public RSVP stays available', async (status) => {
    localMemoryApplications.set('membership-app', { id: 'membership-app', userId: 'member-user-id', status: 'approved', applicationNumber: 'APP-1' });
    const membership = await membershipService.activateMembership('membership-app', 'admin-user-id');
    await membershipService.updateMembershipStatus(membership.id, status);
    seed({ eligibility: 'members_only' });
    await expect(eventsService.registerForEvent(eventId, 'member-user-id', 'member')).rejects.toMatchObject({ code: 'MEMBERSHIP_REQUIRED' });
    seed({ eligibility: 'public' });
    await expect(eventsService.registerForEvent(eventId, 'member-user-id', 'member')).resolves.toMatchObject({ status: 'registered' });
  });
  it('serializes competing seat requests and concurrent duplicates in local mode', async () => {
    seed({ capacity: 1 });
    const results = await Promise.allSettled(Array.from({ length: 12 }, (_, index) => eventsService.registerForEvent(eventId, `applicant-${index}`, 'applicant')));
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await eventsService.getEventRegistrationCount(eventId)).toBe(1);
    eventsService.resetLocalState(); seed({ capacity: 5 });
    const duplicate = await Promise.allSettled([eventsService.registerForEvent(eventId, 'user-a-id', 'applicant'), eventsService.registerForEvent(eventId, 'user-a-id', 'applicant')]);
    expect(duplicate.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  });
  it.each([
    [{ status: 'cancelled' }, 'EVENT_CANCELLED'], [{ status: 'draft' }, 'EVENT_NOT_PUBLISHED'],
    [{ registrationCloseAt: new Date(Date.now() - 1000).toISOString() }, 'REGISTRATION_CLOSED'],
    [{ registrationOpenAt: new Date(Date.now() + 3600000).toISOString() }, 'REGISTRATION_NOT_OPEN'],
  ] as const)('enforces event state and registration window %s', async (override, code) => {
    seed(override); await expect(eventsService.registerForEvent(eventId, 'user-a-id', 'applicant')).rejects.toMatchObject({ code });
  });
});

describe('Configured database persistence fails closed', () => {
  it('returns an actual empty database catalogue rather than cached local events', async () => {
    seed(); env.NODE_ENV = 'production';
    expect(await eventsService.getPublicEvents({})).toEqual({ items: [], total: 0 });
  });
  it('preserves an atomic capacity rejection if another process takes the last seat', async () => {
    const event = seed({ capacity: 1 }); env.NODE_ENV = 'production';
    vi.spyOn(eventsService, 'getEventById').mockResolvedValueOnce(event);
    vi.spyOn(eventsService, 'getUserEventRegistration').mockResolvedValueOnce(null);
    vi.spyOn(eventsService, 'getEventRegistrationCount').mockResolvedValueOnce(0);
    database.rpc.mockResolvedValue({ data: null, error: { message: 'EVENT_FULL' } });
    await expect(eventsService.registerForEvent(eventId, userId, 'applicant')).rejects.toMatchObject({ code: 'EVENT_FULL', statusCode: 409 });
    expect(localMemoryRegistrations.size).toBe(0);
  });
  it('requires a real active membership instead of matching a user ID substring', async () => {
    const event = seed({ eligibility: 'members_only' }); env.NODE_ENV = 'production';
    vi.spyOn(eventsService, 'getEventById').mockResolvedValueOnce(event);
    database.from.mockReturnValue(chain({ data: null, error: null }));
    await expect(eventsService.registerForEvent(eventId, 'member-user-id', 'member')).rejects.toMatchObject({ code: 'MEMBERSHIP_REQUIRED' });
    expect(database.rpc).not.toHaveBeenCalled();
  });
  it('uses the atomic RPC and does not reserve a memory seat when persistence rejects', async () => {
    const event = seed(); env.NODE_ENV = 'production';
    vi.spyOn(eventsService, 'getEventById').mockResolvedValueOnce(event);
    vi.spyOn(eventsService, 'getUserEventRegistration').mockResolvedValueOnce(null);
    vi.spyOn(eventsService, 'getEventRegistrationCount').mockResolvedValueOnce(0);
    database.rpc.mockResolvedValue({ data: null, error: { message: 'database disconnected' } });
    await expect(eventsService.registerForEvent(eventId, userId, 'applicant')).rejects.toMatchObject({ code: 'EVENT_STORAGE_FAILED', statusCode: 503 });
    expect(database.rpc).toHaveBeenCalledWith('register_event_atomic', { p_event_id: eventId, p_user_id: userId });
    expect(localMemoryRegistrations.size).toBe(0);
    vi.restoreAllMocks();
  });
  it('does not cancel in memory when database cancellation fails', async () => {
    const event = seed(); env.NODE_ENV = 'production';
    const registration = { id: 'registration', eventId, userId, status: 'registered' as const, registeredAt: event.createdAt, createdAt: event.createdAt, updatedAt: event.createdAt };
    localMemoryRegistrations.set(registration.id, registration);
    vi.spyOn(eventsService, 'getEventById').mockResolvedValueOnce(event);
    vi.spyOn(eventsService, 'getUserEventRegistration').mockResolvedValueOnce(registration);
    database.rpc.mockRejectedValue(new Error('offline'));
    await expect(eventsService.cancelRegistration(eventId, userId)).rejects.toMatchObject({ code: 'EVENT_STORAGE_FAILED' });
    expect(localMemoryRegistrations.get(registration.id)?.status).toBe('registered');
    vi.restoreAllMocks();
  });
  it('does not use a stale cached event when a configured database read fails', async () => {
    seed(); env.NODE_ENV = 'production'; database.from.mockReturnValue(chain({ data: null, error: { message: 'offline' } }));
    await expect(eventsService.getPublicEventBySlug('public-workshop')).rejects.toMatchObject({ code: 'EVENT_STORAGE_FAILED' });
    await expect(eventsService.getPublicEvents({})).rejects.toMatchObject({ code: 'EVENT_STORAGE_FAILED' });
  });
});
