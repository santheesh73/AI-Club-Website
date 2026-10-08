import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { env } from '../src/config/env';
import { app } from '../src/server';
import {
  flashcardService,
  localMemoryFlashcardStore,
} from '../src/modules/dashboard/flashcard.service';
import { localMemoryProfiles } from '../src/modules/profile/profile.controller';
import { membershipService } from '../src/modules/membership/membership.service';
import { localMemoryApplications } from '../src/modules/applications/applications.service';

describe('AI CLUB Flashcard / Spotlight System Tests (FLASH-001 to FLASH-017)', () => {
  const memberUserId = 'member-user-id';
  const applicantUserId = 'user-a-id';
  const memberToken = 'Bearer member-flash-token';
  const applicantToken = 'Bearer applicant-flash-token';
  const appId = 'app-flash-01';

  beforeEach(async () => {
    // Reset service state
    membershipService.resetLocalState();
    flashcardService.resetLocalStore();
    flashcardService.setMockMode(true);

    // Setup active member profile
    localMemoryProfiles.set(memberUserId, {
      id: memberUserId,
      email: 'nikesh@aiclub.internal',
      full_name: 'Nikesh AI',
      role: 'member',
      department: 'AI & DS',
      skills: ['deep learning', 'transformers', 'rag'],
    });

    // Setup applicant profile (not active member)
    localMemoryProfiles.set(applicantUserId, {
      id: applicantUserId,
      email: 'applicant@aiclub.internal',
      full_name: 'Applicant User',
      role: 'applicant',
      department: 'CS',
      skills: ['c++'],
    });

    // Setup application & activate membership for memberUserId
    localMemoryApplications.set(appId, {
      id: appId,
      userId: memberUserId,
      applicationNumber: 'AIC-2026-FLASH1',
      status: 'approved',
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
    });

    await membershipService.activateMembership(appId, 'admin-id');
  });

  afterEach(() => {
    flashcardService.resetLocalStore();
    flashcardService.setMockMode(false);
  });

  // ============================================================================
  // CONTENT ELIGIBILITY TESTS (FLASH-001 to FLASH-010)
  // ============================================================================

  it('FLASH-001: Only published announcements are included', async () => {
    localMemoryFlashcardStore.announcements = [
      {
        id: 'ann-pub-1',
        title: 'Published Hackathon Update',
        content: 'Registrations are open now.',
        status: 'published',
        published_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards.some((c) => c.sourceId === 'ann-pub-1')).toBe(true);
    const card = cards.find((c) => c.sourceId === 'ann-pub-1')!;
    expect(card.title).toBe('Published Hackathon Update');
    expect(card.sourceType).toBe('ANNOUNCEMENT');
  });

  it('FLASH-002: Draft announcements are excluded', async () => {
    localMemoryFlashcardStore.announcements = [
      {
        id: 'ann-draft-1',
        title: 'Draft Announcement',
        content: 'Not ready for public view.',
        status: 'draft',
      },
      {
        id: 'ann-pub-2',
        title: 'Published Valid Announcement',
        content: 'Visible to members.',
        status: 'published',
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards.some((c) => c.sourceId === 'ann-draft-1')).toBe(false);
    expect(cards.some((c) => c.sourceId === 'ann-pub-2')).toBe(true);
  });

  it('FLASH-003: Expired announcements are excluded', async () => {
    localMemoryFlashcardStore.announcements = [
      {
        id: 'ann-exp-1',
        title: 'Past Expired Announcement',
        status: 'published',
        expires_at: new Date(Date.now() - 3600000).toISOString(), // expired 1h ago
      },
      {
        id: 'ann-valid-1',
        title: 'Active Announcement with Future Expiry',
        status: 'published',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // expires in 24h
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards.some((c) => c.sourceId === 'ann-exp-1')).toBe(false);
    expect(cards.some((c) => c.sourceId === 'ann-valid-1')).toBe(true);
  });

  it('FLASH-004: Published upcoming event is included', async () => {
    localMemoryFlashcardStore.events = [
      {
        id: 'evt-upcoming-1',
        title: 'Transformer Architecture Masterclass',
        description: 'Hands-on session with BERT and GPT models.',
        status: 'published',
        start_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        end_at: new Date(Date.now() + 86400000 * 3).toISOString(),
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards.some((c) => c.sourceId === 'evt-upcoming-1')).toBe(true);
    const card = cards.find((c) => c.sourceId === 'evt-upcoming-1')!;
    expect(card.sourceType).toBe('EVENT');
    expect(card.actionLabel).toBe('View Event');
  });

  it('FLASH-005: Completed event is excluded', async () => {
    localMemoryFlashcardStore.events = [
      {
        id: 'evt-completed-1',
        title: 'Previous Hackathon 2025',
        status: 'completed',
        end_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards.some((c) => c.sourceId === 'evt-completed-1')).toBe(false);
  });

  it('FLASH-006: Cancelled event is excluded', async () => {
    localMemoryFlashcardStore.events = [
      {
        id: 'evt-cancelled-1',
        title: 'Cancelled Workshop',
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 86400000).toISOString(),
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards.some((c) => c.sourceId === 'evt-cancelled-1')).toBe(false);
  });

  it('FLASH-007: Published achievement is included and personalized', async () => {
    localMemoryFlashcardStore.achievements = [
      {
        id: 'ach-1',
        user_id: memberUserId,
        title: 'Pioneer Innovator Badge',
        description: 'Completed 5 AI workshops.',
        status: 'published',
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    const card = cards.find((c) => c.sourceId === 'ach-1');
    expect(card).toBeDefined();
    expect(card?.sourceType).toBe('ACHIEVEMENT');
    expect(card?.badgeText).toBe('YOUR ACHIEVEMENT');
    expect(card?.title).toContain('Congratulations');
  });

  it('FLASH-008: Published project idea is included', async () => {
    localMemoryFlashcardStore.projectIdeas = [
      {
        id: 'idea-1',
        title: 'RAG Campus Knowledge Base',
        description: 'Build an internal assistant for students.',
        status: 'published',
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    const card = cards.find((c) => c.sourceId === 'idea-1');
    expect(card).toBeDefined();
    expect(card?.sourceType).toBe('PROJECT_IDEA');
    expect(card?.actionLabel).toBe('Explore Idea');
  });

  it('FLASH-009: Draft project idea is excluded', async () => {
    localMemoryFlashcardStore.projectIdeas = [
      {
        id: 'idea-draft-1',
        title: 'Unfinished Project Concept',
        status: 'draft',
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards.some((c) => c.sourceId === 'idea-draft-1')).toBe(false);
  });

  it('FLASH-010: Hidden/Admin-only content is excluded', async () => {
    localMemoryFlashcardStore.announcements = [
      {
        id: 'ann-admin-1',
        title: 'Executive Admin Deliberation',
        status: 'published',
        audience: 'admin_only',
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards.some((c) => c.sourceId === 'ann-admin-1')).toBe(false);
  });

  // ============================================================================
  // NORMALIZATION & ORDERING TESTS (FLASH-011 to FLASH-012)
  // ============================================================================

  it('FLASH-011: Duplicate source content is removed', async () => {
    localMemoryFlashcardStore.announcements = [
      {
        id: 'ann-dup-1',
        title: 'Duplicate Notice',
        status: 'published',
      },
      {
        id: 'ann-dup-1', // identical sourceId & sourceType
        title: 'Duplicate Notice Re-entered',
        status: 'published',
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    const matching = cards.filter((c) => c.sourceId === 'ann-dup-1');
    expect(matching.length).toBe(1);
  });

  it('FLASH-012: Priority ordering works deterministically', async () => {
    localMemoryFlashcardStore.announcements = [
      {
        id: 'ann-low',
        title: 'Low Priority Announcement',
        status: 'published',
        flashcard_priority: 20,
      },
      {
        id: 'ann-high',
        title: 'High Priority Alert',
        status: 'published',
        flashcard_priority: 95,
      },
    ];

    localMemoryFlashcardStore.events = [
      {
        id: 'evt-mid',
        title: 'Medium Priority Event',
        status: 'published',
        flashcard_priority: 60,
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards[0].sourceId).toBe('ann-high');
    expect(cards[1].sourceId).toBe('evt-mid');
    expect(cards[2].sourceId).toBe('ann-low');
  });

  // ============================================================================
  // SECURITY & RBAC TESTS (FLASH-013 to FLASH-016)
  // ============================================================================

  it('FLASH-013: Member authorization is enforced (401 for unauthenticated)', async () => {
    const res = await request(app).get('/api/v1/membership/me/flashcards');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('FLASH-014: Applicant without active membership cannot access member flashcards (404/403)', async () => {
    const res = await request(app)
      .get('/api/v1/membership/me/flashcards')
      .set('Authorization', applicantToken);

    // Applicant does not have an active membership record
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it.each(['suspended', 'revoked'] as const)('FLASH-015: %s member cannot access dashboard or flashcards', async (status) => {
    // Suspend member
    const activeRec = await membershipService.getMembershipByUserId(memberUserId);
    expect(activeRec).toBeDefined();
    await membershipService.updateMembershipStatus(activeRec!.id, status, 'Admin lifecycle test');

    const res = await request(app)
      .get('/api/v1/membership/me/flashcards')
      .set('Authorization', memberToken);

    expect([403, 404]).toContain(res.status);
    expect(await membershipService.getMembershipByUserId(memberUserId)).toBeNull();
    const dashboard = await request(app).get('/api/v1/membership/me/dashboard').set('Authorization', memberToken);
    expect([403, 404]).toContain(dashboard.status);
  });

  it('production does not synthesize an active demo membership', async () => {
    const previous = env.NODE_ENV;
    env.NODE_ENV = 'production';
    try {
      expect(await membershipService.getMembershipByUserId(memberUserId)).toBeNull();
      expect(await membershipService.getMembershipByUserId('demo-member-001')).toBeNull();
      await expect(membershipService.getMemberDashboard('demo-member-001')).rejects.toMatchObject({ code: 'MEMBERSHIP_NOT_FOUND' });
    } finally { env.NODE_ENV = previous; }
  });

  it('FLASH-016: Dashboard API does not expose unnecessary database fields', async () => {
    localMemoryFlashcardStore.announcements = [
      {
        id: 'ann-leak-test',
        title: 'Public Bulletin',
        content: 'Check out the new schedule.',
        status: 'published',
        internal_admin_secret_field: 'DO_NOT_EXPOSE',
        db_raw_audit_token: 'SECRET_DB_TOKEN',
      },
    ];

    const cards = await flashcardService.getMemberFlashcards(memberUserId);
    expect(cards.length).toBeGreaterThanOrEqual(1);
    const card = cards[0];

    // Normalized contract properties only
    expect(card).toHaveProperty('id');
    expect(card).toHaveProperty('sourceType');
    expect(card).toHaveProperty('sourceId');
    expect(card).toHaveProperty('title');
    expect(card).toHaveProperty('description');
    expect(card).toHaveProperty('priority');
    expect(card).toHaveProperty('badgeText');
    expect(card).toHaveProperty('publishedAt');

    // Forbidden leak properties
    expect((card as any).internal_admin_secret_field).toBeUndefined();
    expect((card as any).db_raw_audit_token).toBeUndefined();
  });

  // ============================================================================
  // ERROR ISOLATION TEST (FLASH-017)
  // ============================================================================

  it('FLASH-017: Aggregation gracefully handles partial source failure', async () => {
    // Populate both announcements and events
    localMemoryFlashcardStore.announcements = [
      {
        id: 'ann-fail-test',
        title: 'Announcement that might fail',
        status: 'published',
      },
    ];

    localMemoryFlashcardStore.events = [
      {
        id: 'evt-survives',
        title: 'Event that must still succeed',
        status: 'published',
        end_at: new Date(Date.now() + 86400000).toISOString(),
      },
    ];

    // Simulate failure in announcements query
    flashcardService.setFailSource('announcements');

    // Query should not throw or crash!
    const cards = await flashcardService.getMemberFlashcards(memberUserId);

    expect(Array.isArray(cards)).toBe(true);
    // Announcements failed, but event must still be returned!
    expect(cards.some((c) => c.sourceId === 'evt-survives')).toBe(true);
  });
});
