import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';

describe('AI CLUB Milestone 2: Profile & Security Tests', () => {
  it('GET /api/v1/profile without authentication returns 401 UNAUTHORIZED (Scenario 7)', async () => {
    const res = await request(app).get('/api/v1/profile');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/profile with Bearer token retrieves authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', 'user-a-id');
    expect(res.body.data).toHaveProperty('email', 'usera@aiclub.internal');
    expect(res.body.data.role).toBe('applicant');
  });

  it('PATCH /api/v1/profile allows updating permitted academic and bio fields', async () => {
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', 'Bearer user-a-token')
      .send({
        fullName: 'Grace Hopper',
        department: 'Computer Science',
        year: 3,
        bio: 'Compiler pioneer and systems engineer',
        skills: ['Compilers', 'Machine Code', 'FORTRAN'],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Grace Hopper');
    expect(res.body.data.department).toBe('Computer Science');
    expect(res.body.data.year).toBe(3);
    expect(res.body.data.skills).toContain('Compilers');
  });

  it('PATCH /api/v1/profile REJECTS self-promotion to admin (Scenario 3)', async () => {
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', 'Bearer user-a-token')
      .send({
        role: 'admin',
      });

    // Zod strict schema rejects unknown/forbidden properties
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /api/v1/profile REJECTS altering immutable user ID (Scenario 2 & 8)', async () => {
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', 'Bearer user-a-token')
      .send({
        id: 'victim-user-id',
        fullName: 'Attacker Attempt',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('User A and User B maintain completely isolated identities (Scenario 1)', async () => {
    const resA = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', 'Bearer user-a-token');

    const resB = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', 'Bearer user-b-token');

    expect(resA.body.data.id).toBe('user-a-id');
    expect(resB.body.data.id).toBe('user-b-id');
    expect(resA.body.data.id).not.toBe(resB.body.data.id);
  });
});
