import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { eventsService } from '../src/modules/events/events.service';
import { auditService } from '../src/modules/admin/audit.service';

describe('AI CLUB Milestone 6: Events & Activities Platform Tests', () => {
  beforeEach(() => {
    eventsService.resetLocalState();
    auditService.resetLocalState();
  });

  const now = new Date();
  const validStartAt = new Date(now.getTime() + 10 * 86400000).toISOString(); // +10 days
  const validEndAt = new Date(now.getTime() + 12 * 86400000).toISOString(); // +12 days
  const validOpenAt = new Date(now.getTime() - 2 * 86400000).toISOString(); // -2 days
  const validCloseAt = new Date(now.getTime() + 9 * 86400000).toISOString(); // +9 days

  const baseEventPayload = {
    title: 'AI Robotics Workshop 2026',
    shortDescription: 'Hands-on autonomous control systems and reinforcement learning.',
    description: 'A deep-dive workshop exploring physical simulation environments, policy gradients, and micro-controller integration.',
    category: 'workshop',
    eventMode: 'physical',
    location: 'Robotics Lab 3',
    startAt: validStartAt,
    endAt: validEndAt,
    registrationOpenAt: validOpenAt,
    registrationCloseAt: validCloseAt,
    capacity: 50,
    eligibility: 'members_only',
    speaker: 'Dr. Elena Rostova',
    organizer: 'AI Club Robotics Guild',
    tags: ['Robotics', 'RL', 'PyTorch'],
  };

  describe('1. Admin Authorization & Security Guardrails', () => {
    it('rejects unauthenticated request to admin events with 401 UNAUTHORIZED', async () => {
      const res = await request(app).post('/api/v1/admin/events').send(baseEventPayload);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-admin member attempting to create event with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer member-test-token')
        .send(baseEventPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects applicant attempting to access member events with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/member/events')
        .set('Authorization', 'Bearer applicant-test-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Event Creation & Time Logic Validation', () => {
    it('creates a draft event with an authoritative unique slug', async () => {
      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe(baseEventPayload.title);
      expect(res.body.data.slug).toBe('ai-robotics-workshop-2026');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.capacity).toBe(50);
    });

    it('validates that endAt must be strictly after startAt', async () => {
      const invalidPayload = {
        ...baseEventPayload,
        startAt: validEndAt,
        endAt: validStartAt, // end earlier than start!
      };

      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('validates that registrationCloseAt must be on or before startAt', async () => {
      const invalidPayload = {
        ...baseEventPayload,
        registrationCloseAt: new Date(now.getTime() + 11 * 86400000).toISOString(), // close is AFTER start (+11 vs +10 days)
      };

      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Event Lifecycle & State Machine Transitions', () => {
    it('transitions DRAFT -> PUBLISHED and sets publishedAt', async () => {
      // Create draft
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      const eventId = createRes.body.data.id;

      // Publish
      const pubRes = await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('published');
      expect(pubRes.body.data.publishedAt).toBeDefined();

      // Attempting to publish again fails with 409
      const rePubRes = await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      expect(rePubRes.status).toBe(409);
      expect(rePubRes.body.error.code).toBe('INVALID_EVENT_STATE');
    });

    it('transitions PUBLISHED -> CANCELLED with mandatory cancellation reason', async () => {
      // Create and publish
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      const eventId = createRes.body.data.id;
      await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      // Cancel without reason fails
      const noReasonRes = await request(app)
        .post(`/api/v1/admin/events/${eventId}/cancel`)
        .set('Authorization', 'Bearer admin-test-token')
        .send({ cancellationReason: '  ' });

      expect(noReasonRes.status).toBe(400);

      // Cancel with reason succeeds
      const cancelRes = await request(app)
        .post(`/api/v1/admin/events/${eventId}/cancel`)
        .set('Authorization', 'Bearer admin-test-token')
        .send({ cancellationReason: 'Speaker emergency. Event rescheduled for next month.' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('cancelled');
      expect(cancelRes.body.data.cancellationReason).toBe(
        'Speaker emergency. Event rescheduled for next month.'
      );
      expect(cancelRes.body.data.cancelledAt).toBeDefined();
    });

    it('blocks invalid transitions such as DRAFT -> CANCELLED', async () => {
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      const eventId = createRes.body.data.id;

      const cancelRes = await request(app)
        .post(`/api/v1/admin/events/${eventId}/cancel`)
        .set('Authorization', 'Bearer admin-test-token')
        .send({ cancellationReason: 'Cancelled draft' });

      expect(cancelRes.status).toBe(409);
      expect(cancelRes.body.error.code).toBe('INVALID_EVENT_STATE');
    });
  });

  describe('4. Member Event Discovery & Detail Visibility', () => {
    it('member cannot view DRAFT events, but can view PUBLISHED events', async () => {
      // Create draft
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      const slug = createRes.body.data.slug;

      // Draft lookup by member returns 404
      const draftLookup = await request(app)
        .get(`/api/v1/member/events/${slug}`)
        .set('Authorization', 'Bearer member-test-token');

      expect(draftLookup.status).toBe(404);

      // Publish event
      await request(app)
        .post(`/api/v1/admin/events/${createRes.body.data.id}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      // Published lookup succeeds
      const pubLookup = await request(app)
        .get(`/api/v1/member/events/${slug}`)
        .set('Authorization', 'Bearer member-test-token');

      expect(pubLookup.status).toBe(200);
      expect(pubLookup.body.data.title).toBe(baseEventPayload.title);
      expect(pubLookup.body.data.isRegistered).toBe(false);
      expect(pubLookup.body.data.availableSeats).toBe(50);
    });

    it('lists published events with category filtering and search query', async () => {
      // Create and publish workshop
      const res1 = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);
      await request(app)
        .post(`/api/v1/admin/events/${res1.body.data.id}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      // Create and publish hackathon
      const res2 = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send({
          ...baseEventPayload,
          title: 'Autonomous Hackathon 2026',
          category: 'hackathon',
        });
      await request(app)
        .post(`/api/v1/admin/events/${res2.body.data.id}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      // Filter by category=hackathon
      const filteredRes = await request(app)
        .get('/api/v1/member/events?category=hackathon')
        .set('Authorization', 'Bearer member-test-token');

      expect(filteredRes.status).toBe(200);
      expect(filteredRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(filteredRes.body.data[0].category).toBe('hackathon');

      // Search by keyword
      const searchRes = await request(app)
        .get('/api/v1/member/events?search=Robotics')
        .set('Authorization', 'Bearer member-test-token');

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.length).toBe(1);
      expect(searchRes.body.data[0].title).toContain('Robotics');
    });
  });

  describe('5. Member Registration, Duplicate Protection & Capacity Limits', () => {
    it('allows active member to register and updates available seats', async () => {
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      const eventId = createRes.body.data.id;
      const slug = createRes.body.data.slug;

      await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      // Register
      const regRes = await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer member-test-token');

      expect(regRes.status).toBe(201);
      expect(regRes.body.data.status).toBe('registered');
      expect(regRes.body.data.eventId).toBe(eventId);

      // Verify event detail reflects registered status
      const detailRes = await request(app)
        .get(`/api/v1/member/events/${slug}`)
        .set('Authorization', 'Bearer member-test-token');

      expect(detailRes.body.data.isRegistered).toBe(true);
      expect(detailRes.body.data.registeredCount).toBe(1);
      expect(detailRes.body.data.availableSeats).toBe(49);
    });

    it('prevents duplicate registration for the same active member (409 ALREADY_REGISTERED)', async () => {
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      const eventId = createRes.body.data.id;
      await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      // First registration succeeds
      await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer member-test-token');

      // Second registration fails
      const dupRes = await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer member-test-token');

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('ALREADY_REGISTERED');
    });

    it('enforces capacity limits and rejects registration with 409 EVENT_FULL when capacity reached', async () => {
      // Event with capacity = 1
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send({
          ...baseEventPayload,
          capacity: 1,
        });

      const eventId = createRes.body.data.id;
      await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      // User A (member-user-id) registers: 1/1 seats
      const regARes = await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer member-test-token');
      expect(regARes.status).toBe(201);

      // User B (admin-user-id or another active user) attempts to register: 409 EVENT_FULL
      const regBRes = await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer admin-test-token');

      expect(regBRes.status).toBe(409);
      expect(regBRes.body.error.code).toBe('EVENT_FULL');
    });

    it('rejects registration when registration window is closed', async () => {
      // Registration closed in the past
      const pastCloseAt = new Date(now.getTime() - 1 * 86400000).toISOString(); // -1 day
      const pastOpenAt = new Date(now.getTime() - 5 * 86400000).toISOString(); // -5 days

      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send({
          ...baseEventPayload,
          registrationOpenAt: pastOpenAt,
          registrationCloseAt: pastCloseAt,
        });

      const eventId = createRes.body.data.id;
      await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      const regRes = await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer member-test-token');

      expect(regRes.status).toBe(400);
      expect(regRes.body.error.code).toBe('REGISTRATION_CLOSED');
    });
  });

  describe('6. Registration Cancellation & Re-Registration Cycle', () => {
    it('allows member to cancel registration and subsequently re-register while window is open', async () => {
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      const eventId = createRes.body.data.id;
      await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      // 1. Register
      await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer member-test-token');

      // 2. Cancel
      const cancelRes = await request(app)
        .delete(`/api/v1/member/events/${eventId}/registration`)
        .set('Authorization', 'Bearer member-test-token');

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('cancelled');

      // 3. Re-register succeeds
      const reRegRes = await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer member-test-token');

      expect(reRegRes.status).toBe(201);
      expect(reRegRes.body.data.status).toBe('registered');
    });

    it('lists registered events under /api/v1/member/events/registered', async () => {
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      const eventId = createRes.body.data.id;
      await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer member-test-token');

      const registeredListRes = await request(app)
        .get('/api/v1/member/events/registered')
        .set('Authorization', 'Bearer member-test-token');

      expect(registeredListRes.status).toBe(200);
      expect(registeredListRes.body.data.upcoming.length).toBe(1);
      expect(registeredListRes.body.data.upcoming[0].id).toBe(eventId);
    });
  });

  describe('7. Admin Attendees & Registrations Roster', () => {
    it('admin can list attendee roster for an event', async () => {
      const createRes = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', 'Bearer admin-test-token')
        .send(baseEventPayload);

      const eventId = createRes.body.data.id;
      await request(app)
        .post(`/api/v1/admin/events/${eventId}/publish`)
        .set('Authorization', 'Bearer admin-test-token');

      await request(app)
        .post(`/api/v1/member/events/${eventId}/register`)
        .set('Authorization', 'Bearer member-test-token');

      const rosterRes = await request(app)
        .get(`/api/v1/admin/events/${eventId}/registrations`)
        .set('Authorization', 'Bearer admin-test-token');

      expect(rosterRes.status).toBe(200);
      expect(rosterRes.body.data.length).toBe(1);
      expect(rosterRes.body.data[0].status).toBe('registered');
    });
  });
});
