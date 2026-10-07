import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { localMemoryApplications } from '../src/modules/applications/applications.service';
import { localMemoryProfiles } from '../src/modules/profile/profile.controller';
import { auditService } from '../src/modules/admin/audit.service';

describe('AI CLUB Milestone 4: Admin Control Center & Decision Engine Tests', () => {
  const adminToken = 'Bearer admin-test-token';
  const studentToken = 'Bearer student-user-token';
  const testAppId = 'app-m4-review-01';
  const testUserId = 'student-user-01';

  beforeEach(() => {
    // Populate isolated test profile and application
    localMemoryProfiles.set(testUserId, {
      id: testUserId,
      email: 'student1@aiclub.internal',
      full_name: 'Devika Krishnan',
      role: 'applicant',
      department: 'CSE',
      year: 3,
      register_number: '2024CSE089',
      skills: ['PyTorch', 'Computer Vision'],
      interests: ['Autonomous Systems'],
    });

    localMemoryApplications.set(testAppId, {
      id: testAppId,
      userId: testUserId,
      applicationNumber: 'AIC-2026-000089',
      status: 'under_review',
      submittedAt: new Date().toISOString(),
      assessmentScore: 21,
      assessmentPercentage: 84,
      assessmentPassed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  describe('1. Admin Authorization & Access Control (Security Model)', () => {
    it('Rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Rejects normal student token with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications')
        .set('Authorization', studentToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Rejects student attempting to approve an application with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/applications/${testAppId}/approve`)
        .set('Authorization', studentToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Rejects student attempting to reject an application with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/applications/${testAppId}/reject`)
        .set('Authorization', studentToken)
        .send({ reason: 'Malicious attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Allows verified admin token access to admin routes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalApplications).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Dashboard Summary & Metrics API', () => {
    it('GET /api/v1/admin/dashboard/summary returns real metrics and aggregations', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(typeof data.totalApplications).toBe('number');
      expect(typeof data.pendingReview).toBe('number');
      expect(typeof data.approved).toBe('number');
      expect(typeof data.averageScore).toBe('number');
      expect(Array.isArray(data.recentApplications)).toBe(true);
    });
  });

  describe('3. Application Querying (Search, Filter, Sort, Pagination)', () => {
    it('GET /api/v1/admin/applications returns paginated list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications?page=1&pageSize=10')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
    });

    it('Filters applications by status', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications?status=under_review')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.status).toBe('under_review');
      }
    });

    it('Searches applications by student name or application number', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications?search=Devika')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].studentName).toBe('Devika Krishnan');
    });

    it('Sorts applications by assessment_score in descending order', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications?sortBy=assessment_score&order=desc')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Applicant Dossier Inspection', () => {
    it('GET /api/v1/admin/applications/:id returns student profile and assessment data', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/applications/${testAppId}`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.application.id).toBe(testAppId);
      expect(data.application.applicationNumber).toBe('AIC-2026-000089');
      expect(data.student.fullName).toBe('Devika Krishnan');
      expect(data.student.department).toBe('CSE');
      expect(data.assessment).not.toBeNull();
      expect(data.assessment.score).toBe(21);
    });

    it('Returns 404 for non-existent application ID', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications/non-existent-id')
        .set('Authorization', adminToken);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('APPLICATION_NOT_FOUND');
    });
  });

  describe('5. Decision Engine & Audit Logging', () => {
    it('POST /api/v1/admin/applications/:id/approve successfully approves UNDER_REVIEW application', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/applications/${testAppId}/approve`)
        .set('Authorization', adminToken)
        .send({ reviewerNotes: 'Exceptional machine learning portfolio' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.reviewedBy).toBe('admin-user-id');
      expect(res.body.data.adminNotes).toBe('Exceptional machine learning portfolio');

      // Verify audit log
      const logs = await auditService.getLogsForEntity(testAppId);
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].action).toBe('APPLICATION_APPROVED');
      expect(logs[0].actorId).toBe('admin-user-id');
    });

    it('Repeated approval returns 409 APPLICATION_ALREADY_REVIEWED (Idempotent State Protection)', async () => {
      // First approve
      await request(app)
        .post(`/api/v1/admin/applications/${testAppId}/approve`)
        .set('Authorization', adminToken);

      // Second approve
      const res = await request(app)
        .post(`/api/v1/admin/applications/${testAppId}/approve`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('APPLICATION_ALREADY_REVIEWED');
    });

    it('POST /api/v1/admin/applications/:id/waitlist transitions application to WAITLISTED', async () => {
      const waitlistAppId = 'app-waitlist-test';
      localMemoryApplications.set(waitlistAppId, {
        id: waitlistAppId,
        userId: 'usr-waitlist',
        applicationNumber: 'AIC-2026-000090',
        status: 'under_review',
        submittedAt: new Date().toISOString(),
        assessmentScore: 18,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/api/v1/admin/applications/${waitlistAppId}/waitlist`)
        .set('Authorization', adminToken)
        .send({ reviewerNotes: 'Waitlisted for second round quota' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('waitlisted');

      const logs = await auditService.getLogsForEntity(waitlistAppId);
      expect(logs[0].action).toBe('APPLICATION_WAITLISTED');
    });

    it('POST /api/v1/admin/applications/:id/reject fails if rejection reason is missing', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/applications/${testAppId}/reject`)
        .set('Authorization', adminToken)
        .send({ reason: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('REJECTION_REASON_REQUIRED');
    });

    it('POST /api/v1/admin/applications/:id/reject transitions application to REJECTED with reason stored', async () => {
      const rejectAppId = 'app-reject-test';
      localMemoryApplications.set(rejectAppId, {
        id: rejectAppId,
        userId: 'usr-reject',
        applicationNumber: 'AIC-2026-000091',
        status: 'under_review',
        submittedAt: new Date().toISOString(),
        assessmentScore: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/api/v1/admin/applications/${rejectAppId}/reject`)
        .set('Authorization', adminToken)
        .send({ reason: 'Assessment score did not meet minimum threshold.' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.rejectionReason).toBe('Assessment score did not meet minimum threshold.');

      const logs = await auditService.getLogsForEntity(rejectAppId);
      expect(logs[0].action).toBe('APPLICATION_REJECTED');
    });

    it('Prevents invalid transition from draft to approved', async () => {
      const draftAppId = 'app-draft-test';
      localMemoryApplications.set(draftAppId, {
        id: draftAppId,
        userId: 'usr-draft',
        applicationNumber: 'AIC-2026-000092',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/api/v1/admin/applications/${draftAppId}/approve`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('INVALID_APPLICATION_STATE');
    });

    it('Prevents changing state after application is already approved (State Invariance)', async () => {
      // Approve first
      await request(app)
        .post(`/api/v1/admin/applications/${testAppId}/approve`)
        .set('Authorization', adminToken);

      // Attempt to reject an already approved application
      const rejectRes = await request(app)
        .post(`/api/v1/admin/applications/${testAppId}/reject`)
        .set('Authorization', adminToken)
        .send({ reason: 'Attempted conflicting decision' });

      expect(rejectRes.status).toBe(409);
      expect(rejectRes.body.error.code).toBe('INVALID_APPLICATION_STATE');
    });
  });
});
