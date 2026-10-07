import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { localMemoryApplications } from '../src/modules/applications/applications.service';
import { localMemoryProfiles } from '../src/modules/profile/profile.controller';
import { membershipService } from '../src/modules/membership/membership.service';
import { auditService } from '../src/modules/admin/audit.service';

describe('AI CLUB Milestone 5: Membership Activation & Member Experience Tests', () => {
  const adminToken = 'Bearer admin-test-token';
  const studentToken = 'Bearer student-user-token';
  const memberToken = 'Bearer member-test-token';

  const approvedAppId = 'app-m5-approved-01';
  const reviewAppId = 'app-m5-under-review-02';
  const draftAppId = 'app-m5-draft-03';

  const studentUserId = 'user-a-id';
  const memberUserId = 'member-user-id';

  beforeEach(() => {
    // Reset service fallback states
    membershipService.resetLocalState();

    // Populate test profiles
    localMemoryProfiles.set(studentUserId, {
      id: studentUserId,
      email: 'usera@aiclub.internal',
      full_name: 'Ananya Sharma',
      role: 'applicant',
      department: 'Computer Science',
      year: 3,
      register_number: '2024CS0101',
      skills: ['Python', 'PyTorch'],
      interests: ['Computer Vision'],
    });

    localMemoryProfiles.set(memberUserId, {
      id: memberUserId,
      email: 'member@aiclub.internal',
      full_name: 'Sri Nikesh K',
      role: 'member',
      department: 'Artificial Intelligence & Data Science',
      year: 3,
      register_number: '2023AIDS0001',
      skills: ['Deep Learning', 'LLMs'],
      interests: ['Autonomous Agents'],
    });

    // Populate test applications
    localMemoryApplications.set(approvedAppId, {
      id: approvedAppId,
      userId: studentUserId,
      applicationNumber: 'AIC-2026-000088',
      status: 'approved',
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'admin-user-id',
      adminNotes: 'Accepted for intake',
      assessmentScore: 23,
      assessmentPercentage: 92,
      assessmentPassed: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    localMemoryApplications.set(reviewAppId, {
      id: reviewAppId,
      userId: 'user-review-id',
      applicationNumber: 'AIC-2026-000089',
      status: 'under_review',
      submittedAt: new Date().toISOString(),
      assessmentScore: 18,
      assessmentPercentage: 72,
      assessmentPassed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    localMemoryApplications.set(draftAppId, {
      id: draftAppId,
      userId: 'user-draft-id',
      applicationNumber: 'AIC-2026-000090',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  describe('1. Access Control & Authorization', () => {
    it('Rejects unauthenticated request to /api/v1/membership/me with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/membership/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Rejects student attempting to call admin activation endpoint with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/v1/admin/memberships/activate')
        .set('Authorization', studentToken)
        .send({ applicationId: approvedAppId });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Returns 404 MEMBERSHIP_NOT_FOUND when non-member student requests /api/v1/membership/me', async () => {
      const res = await request(app)
        .get('/api/v1/membership/me')
        .set('Authorization', studentToken);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MEMBERSHIP_NOT_FOUND');
    });
  });

  describe('2. Membership Activation Workflow (Admin Triggered)', () => {
    it('Admin successfully activates an APPROVED application -> 201 Created with valid member number', async () => {
      const res = await request(app)
        .post('/api/v1/admin/memberships/activate')
        .set('Authorization', adminToken)
        .send({
          applicationId: approvedAppId,
          notes: 'Welcome to AI CLUB cohort 2026',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.membership).toBeDefined();

      const { membership } = res.body.data;
      expect(membership.applicationId).toBe(approvedAppId);
      expect(membership.userId).toBe(studentUserId);
      expect(membership.status).toBe('active');
      expect(membership.memberNumber).toMatch(/^AIC-\d{4}-\d{4}$/);
      expect(membership.joinedAt).toBeDefined();
      expect(membership.activatedAt).toBeDefined();

      // Verify audit log entry was created
      const logs = await auditService.getLogsForEntity(membership.id);
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].action).toBe('MEMBERSHIP_ACTIVATED');
      expect(logs[0].entityType).toBe('MEMBERSHIP');

      // Verify user profile role was upgraded to member
      const profile = localMemoryProfiles.get(studentUserId);
      expect(profile?.role).toBe('member');
    });

    it('Rejects activation request with missing applicationId with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/memberships/activate')
        .set('Authorization', adminToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('APPLICATION_ID_REQUIRED');
    });

    it('Rejects activation for an application with status UNDER_REVIEW with 409 APPLICATION_NOT_APPROVED', async () => {
      const res = await request(app)
        .post('/api/v1/admin/memberships/activate')
        .set('Authorization', adminToken)
        .send({ applicationId: reviewAppId });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('APPLICATION_NOT_APPROVED');
    });

    it('Rejects activation for an application with status DRAFT with 409 APPLICATION_NOT_APPROVED', async () => {
      const res = await request(app)
        .post('/api/v1/admin/memberships/activate')
        .set('Authorization', adminToken)
        .send({ applicationId: draftAppId });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('APPLICATION_NOT_APPROVED');
    });
  });

  describe('3. Duplicate & Concurrent Activation Protection', () => {
    it('Prevents duplicate activation on an already activated user with 409 MEMBERSHIP_ALREADY_ACTIVE', async () => {
      // First activation
      const firstRes = await request(app)
        .post('/api/v1/admin/memberships/activate')
        .set('Authorization', adminToken)
        .send({ applicationId: approvedAppId });

      expect(firstRes.status).toBe(201);
      const firstMemberNumber = firstRes.body.data.membership.memberNumber;

      // Second activation attempt
      const secondRes = await request(app)
        .post('/api/v1/admin/memberships/activate')
        .set('Authorization', adminToken)
        .send({ applicationId: approvedAppId });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.success).toBe(false);
      expect(secondRes.body.error.code).toBe('MEMBERSHIP_ALREADY_ACTIVE');
    });

    it('Concurrent activation requests result in exactly ONE active membership', async () => {
      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/v1/admin/memberships/activate')
          .set('Authorization', adminToken)
          .send({ applicationId: approvedAppId }),
        request(app)
          .post('/api/v1/admin/memberships/activate')
          .set('Authorization', adminToken)
          .send({ applicationId: approvedAppId }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]);
    });
  });

  describe('4. Member Experience Endpoints (Authoritative User Isolation)', () => {
    beforeEach(async () => {
      // Activate member
      await membershipService.activateMembership(approvedAppId, 'admin-user-id');
    });

    it('GET /api/v1/membership/me returns the active membership record', async () => {
      const res = await request(app)
        .get('/api/v1/membership/me')
        .set('Authorization', studentToken); // studentUser is user-a-id, which now has an active membership!

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(studentUserId);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.memberNumber).toMatch(/^AIC-\d{4}-\d{4}$/);
    });

    it('GET /api/v1/membership/me/dashboard returns full aggregated member dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/membership/me/dashboard')
        .set('Authorization', studentToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(data.profile).toBeDefined();
      expect(data.profile.fullName).toBe('Ananya Sharma');
      expect(data.membership).toBeDefined();
      expect(data.membership.status).toBe('active');
      expect(data.membership.memberNumber).toMatch(/^AIC-\d{4}-\d{4}$/);
      expect(data.application).toBeDefined();
      expect(data.application.status).toBe('approved');
      expect(data.assessment).toBeDefined();
      expect(data.assessment.score).toBe(23);
      expect(data.assessment.passed).toBe(true);
    });

    it('GET /api/v1/membership/me/application returns linked application summary', async () => {
      const res = await request(app)
        .get('/api/v1/membership/me/application')
        .set('Authorization', studentToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.applicationNumber).toBe('AIC-2026-000088');
      expect(res.body.data.status).toBe('approved');
    });

    it('GET /api/v1/membership/me/assessment returns final assessment scorecard', async () => {
      const res = await request(app)
        .get('/api/v1/membership/me/assessment')
        .set('Authorization', studentToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(23);
      expect(res.body.data.percentage).toBe(92);
      expect(res.body.data.passed).toBe(true);
    });
  });

  describe('5. Admin Members Listing', () => {
    beforeEach(async () => {
      await membershipService.activateMembership(approvedAppId, 'admin-user-id');
    });

    it('GET /api/v1/admin/members lists active members for administrators', async () => {
      const res = await request(app)
        .get('/api/v1/admin/members')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].memberNumber).toMatch(/^AIC-\d{4}-\d{4}$/);
    });

    it('GET /api/v1/admin/members rejects non-admin with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/members')
        .set('Authorization', studentToken);

      expect(res.status).toBe(403);
    });
  });
});
