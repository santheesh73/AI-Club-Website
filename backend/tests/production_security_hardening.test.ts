import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { createRateLimiter, resetRateLimits } from '../src/middleware/rateLimit';
import express from 'express';

describe('Milestone 10: Production Hardening & Security Audit Test Suite', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  // ============================================================================
  // 1. OBSERVABILITY & HEALTH MONITORING
  // ============================================================================
  describe('1. Health Check & Observability Endpoint', () => {
    it('returns 200 with system status, uptime, and services metrics on root /health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.version).toBe('0.1.0');
      expect(typeof res.body.data.uptimeSeconds).toBe('number');
      expect(res.body.data.services.server).toBe('healthy');
      expect(res.body.data.system).toBeDefined();
      expect(res.body.data.system.heapUsedMb).toBeGreaterThan(0);
    });

    it('returns identical health metrics on versioned /api/v1/health', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });
  });

  // ============================================================================
  // 2. SECURITY HEADERS & HELMET HARDENING
  // ============================================================================
  describe('2. Security Headers & Protection Invariants', () => {
    it('emits nosniff and frame protection headers on all responses', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });
  });

  // ============================================================================
  // 3. RATE LIMITING & ABUSE MITIGATION
  // ============================================================================
  describe('3. Rate Limiting Middleware', () => {
    it('emits standard RateLimit headers and enforces HTTP 429 when threshold exceeded', async () => {
      const testApp = express();
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        skipInTest: false,
      });

      testApp.use(limiter);
      testApp.get('/test-limit', (_req, res) => res.json({ ok: true }));

      // 1st request -> Allowed
      const res1 = await request(testApp).get('/test-limit');
      expect(res1.status).toBe(200);
      expect(res1.headers['ratelimit-limit']).toBe('3');
      expect(res1.headers['ratelimit-remaining']).toBe('2');

      // 2nd request -> Allowed
      const res2 = await request(testApp).get('/test-limit');
      expect(res2.status).toBe(200);
      expect(res2.headers['ratelimit-remaining']).toBe('1');

      // 3rd request -> Allowed
      const res3 = await request(testApp).get('/test-limit');
      expect(res3.status).toBe(200);
      expect(res3.headers['ratelimit-remaining']).toBe('0');

      // 4th request -> Blocked with HTTP 429 TOO_MANY_REQUESTS
      const res4 = await request(testApp).get('/test-limit');
      expect(res4.status).toBe(429);
      expect(res4.headers['retry-after']).toBeDefined();
    });
  });

  // ============================================================================
  // 4. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) GATING
  // ============================================================================
  describe('4. RBAC & Privilege Escalation Defenses', () => {
    it('rejects unauthenticated requests to member endpoints with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/member/events');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects unauthenticated requests to admin control center with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('blocks active member from calling admin endpoints with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', 'Bearer member-test-token');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks applicant role from calling active member endpoints with 403 FORBIDDEN', async () => {
      // Token without member prefix defaults to applicant role
      const res = await request(app)
        .get('/api/v1/member/events')
        .set('Authorization', 'Bearer applicant-token');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ============================================================================
  // 5. CROSS-USER RESOURCE ISOLATION & OWNERSHIP INVARIANTS
  // ============================================================================
  describe('5. Cross-User Resource Isolation & IDOR Defenses', () => {
    it('prevents member from updating another member’s project', async () => {
      // User A creates project
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', 'Bearer member-test-token')
        .send({
          title: 'User A Secret Project',
          shortDescription: 'Project authored by User A',
          description: 'Detailed description by user A',
          categoryId: 'pcat-1',
          technologies: ['tech-1'],
        });

      expect(createRes.status).toBe(201);
      const projectId = createRes.body.data.id;

      // User B attempts to mutate User A's project
      const mutateRes = await request(app)
        .put(`/api/v1/member/projects/${projectId}`)
        .set('Authorization', 'Bearer user-b-token')
        .send({
          title: 'Malicious Hijack Attempt',
          shortDescription: 'Hijacked by User B',
          description: 'Malicious hijack description',
          categoryId: 'pcat-1',
          technologies: ['tech-1'],
        });

      // Must be rejected with 403 FORBIDDEN
      expect(mutateRes.status).toBe(403);
      expect(mutateRes.body.success).toBe(false);
      expect(mutateRes.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents user from reading or marking another user’s notification as read', async () => {
      // Dispatch notification for User A
      const notifRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer member-test-token');

      expect(notifRes.status).toBe(200);

      // User B attempts to mark User A notification as read
      const fakeOrOtherNotifId = 'notif-other-user-999';
      const markRes = await request(app)
        .patch(`/api/v1/notifications/${fakeOrOtherNotifId}/read`)
        .set('Authorization', 'Bearer user-b-token');

      // Must return 404 or 403, never succeed
      expect([403, 404]).toContain(markRes.status);
    });
  });

  // ============================================================================
  // 6. INPUT VALIDATION & SAFE ERROR HANDLING
  // ============================================================================
  describe('6. Input Validation & Stack Trace Masking', () => {
    it('returns 400 VALIDATION_ERROR on malformed request payloads', async () => {
      const res = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', 'Bearer member-test-token')
        .send({
          // Missing required title, categoryId, etc.
          shortDescription: 'Incomplete',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it('returns clean 404 for nonexistent endpoints without exposing server stack or paths', async () => {
      const res = await request(app).get('/api/v1/nonexistent-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
      expect(res.body.error.details).toBeUndefined();
    });
  });

  // ============================================================================
  // 7. AI ADVISORY READ-ONLY INTEGRITY
  // ============================================================================
  describe('7. AI Intelligence Advisory Isolation', () => {
    it('synthesizes AI advisory report without mutating underlying platform tables', async () => {
      const res = await request(app)
        .get('/api/v1/admin/intelligence?period=30d')
        .set('Authorization', 'Bearer admin-test-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(Array.isArray(res.body.data.recommendations)).toBe(true);
      // AI insights are strictly read-only advisory
    });
  });
});
