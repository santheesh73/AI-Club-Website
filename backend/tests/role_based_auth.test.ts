import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import {
  AUTHORIZED_ADMIN_EMAIL,
  normalizeEmail,
  isAuthorizedAdmin,
} from '../src/middleware/auth';
import { auditService } from '../src/modules/admin/audit.service';

describe('AI CLUB: Master Role-Based Authentication & Admin Access Tests', () => {
  const authorizedAdminToken = 'Bearer admin-test-token'; // Maps to santheesh651@gmail.com with role admin
  const memberToken = 'Bearer member-test-token';
  const studentToken = 'Bearer applicant-test-token';
  const hackedAdminToken = 'Bearer hacked-admin-token';

  beforeEach(() => {
    auditService.resetLocalState();
  });

  // ============================================================================
  // AUTH-001 & AUTH-006 & AUTH-007: REGISTRATION & ROLE MANIPULATION SAFEGUARDS
  // ============================================================================
  describe('AUTH-001 & AUTH-006 & AUTH-007: Role Assignment & Manipulation Hardening', () => {
    it('AUTH-001: Public signup rejects or strictly blocks client role parameter injection', async () => {
      // Direct profile update attempting to inject role=admin
      const res = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', studentToken)
        .send({
          fullName: 'Malicious Student',
          role: 'admin',
        });

      // Zod schema must reject unknown / protected keys with 400
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('AUTH-006: Database role manipulation fails if email is not santheesh651@gmail.com', async () => {
      // In the mock/test token system, simulate a user who hacked their role to 'admin'
      // but their email is NOT santheesh651@gmail.com
      const hackedUserRes = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', hackedAdminToken); // Non-whitelisted email with admin role

      // Must be rejected with 403 NOT HAVE ACCESS
      expect(hackedUserRes.status).toBe(403);
      expect(hackedUserRes.body.success).toBe(false);
      expect(hackedUserRes.body.error.code).toBe('FORBIDDEN');
      expect(hackedUserRes.body.error.message).toBe('NOT HAVE ACCESS');
    });

    it('AUTH-007: Profile update rejects role injection via strict validator', async () => {
      const res = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', memberToken)
        .send({
          role: 'admin',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================================================
  // AUTH-003, AUTH-010, AUTH-011: ADMIN IDENTITY & EXACT-MATCH NORMALIZATION
  // ============================================================================
  describe('AUTH-003, AUTH-010, AUTH-011: Admin Email Allowlist & Exact-Match Logic', () => {
    it('AUTH-003: Authoritative admin email santheesh651@gmail.com is granted access', () => {
      expect(isAuthorizedAdmin('santheesh651@gmail.com', 'admin')).toBe(true);
    });

    it('AUTH-010: Email normalization trims leading/trailing spaces and converts to lowercase', () => {
      expect(normalizeEmail('   SANTHEESH651@GMAIL.COM   ')).toBe(AUTHORIZED_ADMIN_EMAIL);
      expect(isAuthorizedAdmin('   SANTHEESH651@GMAIL.COM   ', 'admin')).toBe(true);
      expect(isAuthorizedAdmin('Santheesh651@Gmail.Com', 'admin')).toBe(true);
    });

    it('AUTH-011: Rejects lookalike, domain-matching, prefix or substring variations', () => {
      // Substring / prefix / suffix attacks
      expect(isAuthorizedAdmin('santheesh651+admin@gmail.com', 'admin')).toBe(false);
      expect(isAuthorizedAdmin('fake_santheesh651@gmail.com', 'admin')).toBe(false);
      expect(isAuthorizedAdmin('santheesh651@gmail.com.evil.co', 'admin')).toBe(false);
      expect(isAuthorizedAdmin('admin@gmail.com', 'admin')).toBe(false);
      expect(isAuthorizedAdmin('santheesh651@google.com', 'admin')).toBe(false);
      expect(isAuthorizedAdmin('', 'admin')).toBe(false);
      expect(isAuthorizedAdmin(null, 'admin')).toBe(false);
      expect(isAuthorizedAdmin(undefined, 'admin')).toBe(false);

      // Correct email but wrong role
      expect(isAuthorizedAdmin('santheesh651@gmail.com', 'member')).toBe(false);
      expect(isAuthorizedAdmin('santheesh651@gmail.com', 'applicant')).toBe(false);
    });
  });

  // ============================================================================
  // AUTH-004, AUTH-005, AUTH-008: ADMIN ROUTE & API AUTHORIZATION ENFORCEMENT
  // ============================================================================
  describe('AUTH-004, AUTH-005, AUTH-008: Admin Endpoint Protection (403 NOT HAVE ACCESS)', () => {
    it('AUTH-004: Rejects normal student accessing /api/v1/admin/dashboard/summary with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', studentToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toBe('NOT HAVE ACCESS');
    });

    it('AUTH-005: Rejects authenticated member accessing /api/v1/admin/applications with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications')
        .set('Authorization', memberToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toBe('NOT HAVE ACCESS');
    });

    it('AUTH-008: Rejects non-admin attempting to access /api/v1/admin/assessment/questions', async () => {
      const res = await request(app)
        .get('/api/v1/admin/assessment/questions')
        .set('Authorization', studentToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('NOT HAVE ACCESS');
    });

    it('AUTH-008: Rejects non-admin calling /api/v1/admin/events with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/events')
        .set('Authorization', studentToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('NOT HAVE ACCESS');
    });

    it('AUTH-008: Rejects non-admin calling /api/v1/admin/courses with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/courses')
        .set('Authorization', memberToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('NOT HAVE ACCESS');
    });

    it('Allows authorized admin santheesh651@gmail.com full access to admin routes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', authorizedAdminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================================================
  // AUTH-009: UNAUTHENTICATED REQUESTS
  // ============================================================================
  describe('AUTH-009: Unauthenticated API Access Protection', () => {
    it('AUTH-009: Rejects unauthenticated request to /admin with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/summary');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('AUTH-009: Rejects invalid Bearer token with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', 'Bearer invalid-garbage-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ============================================================================
  // AUTH-012: EXISTING MEMBER FLOW PRESERVATION
  // ============================================================================
  describe('AUTH-012: Existing Member & Applicant Flow Integrity', () => {
    it('AUTH-012: Member can access member routes without regression', async () => {
      const res = await request(app)
        .get('/api/v1/member/events')
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('AUTH-012: Applicant can access application and assessment routes without regression', async () => {
      const res = await request(app)
        .get('/api/v1/applications/me')
        .set('Authorization', studentToken);

      // Either 200 or 404 (if not applied yet), but NOT 403 Forbidden
      expect(res.status).not.toBe(403);
    });
  });

  // ============================================================================
  // AUTH-015: SENSITIVE CREDENTIAL LEAKAGE PREVENTION & AUDIT LOGGING
  // ============================================================================
  describe('AUTH-015: Security Sanitation & Audit Logs', () => {
    it('AUTH-015: Error responses do not leak database connection details or JWT secrets', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications')
        .set('Authorization', studentToken);

      expect(res.status).toBe(403);
      const stringified = JSON.stringify(res.body);
      expect(stringified).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(stringified).not.toContain('JWT_SECRET');
      expect(stringified).not.toContain('postgres:');
    });

    it('Records ADMIN_ACCESS_DENIED audit log event on unauthorized attempts', async () => {
      await request(app)
        .get('/api/v1/admin/applications')
        .set('Authorization', studentToken);

      const logs = await auditService.getLogsForEntity('admin-portal');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('ADMIN_ACCESS_DENIED');
      expect(logs[0].actorId).toBe('user-a-id');
    });
  });
});
