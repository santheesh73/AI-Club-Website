import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';

describe('AI CLUB Milestone 3: Applications & 25-MCQ Assessment Engine Tests', () => {
  let createdAppId: string;
  let attemptId: string;
  let firstQuestionId: string;

  it('1. POST /api/v1/applications requires authentication (401)', async () => {
    const res = await request(app).post('/api/v1/applications');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('2. POST /api/v1/applications creates unique application with AIC-2026-XXXXXX', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.applicationNumber).toMatch(/^AIC-\d{4}-\d{6}$/);
    expect(res.body.data.status).toBe('test_required');

    createdAppId = res.body.data.id;
  });

  it('3. User cannot create a duplicate active application (409)', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('APPLICATION_ALREADY_EXISTS');
  });

  it('4. GET /api/v1/applications/me retrieves authenticated user application', async () => {
    const res = await request(app)
      .get('/api/v1/applications/me')
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdAppId);
  });

  it('5. User B cannot access User A application', async () => {
    const res = await request(app)
      .get('/api/v1/applications/me')
      .set('Authorization', 'Bearer user-b-token');

    // User B has not created an application yet
    expect(res.status).toBe(404);
  });

  it('6. POST /api/v1/applications/:appId/assessment/start initiates attempt with exactly 25 questions', async () => {
    const res = await request(app)
      .post(`/api/v1/applications/${createdAppId}/assessment/start`)
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.questionCount).toBe(25);
    expect(res.body.data.questions).toHaveLength(25);
    expect(res.body.data).toHaveProperty('expiresAt');
    expect(res.body.data.durationSeconds).toBe(1800);

    attemptId = res.body.data.attemptId;
    firstQuestionId = res.body.data.questions[0].id;

    // CRITICAL SECURITY CHECK: Ensure correct_option is NEVER exposed in the question DTO
    for (const q of res.body.data.questions) {
      expect(q).not.toHaveProperty('correctOption');
      expect(q).not.toHaveProperty('correct_option');
      expect(q).not.toHaveProperty('answer');
      expect(q).toHaveProperty('options');
      expect(q.options).toHaveProperty('A');
      expect(q.options).toHaveProperty('B');
      expect(q.options).toHaveProperty('C');
      expect(q.options).toHaveProperty('D');
    }
  });

  it('7. Resuming / restarting assessment returns the EXACT SAME attempt and persistent order', async () => {
    const res = await request(app)
      .post(`/api/v1/applications/${createdAppId}/assessment/start`)
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(200);
    expect(res.body.data.attemptId).toBe(attemptId);
    expect(res.body.data.questions[0].id).toBe(firstQuestionId);
  });

  it('8. PUT /api/v1/assessment/attempts/:attemptId/answers/:questionId autosaves answer', async () => {
    const res = await request(app)
      .put(`/api/v1/assessment/attempts/${attemptId}/answers/${firstQuestionId}`)
      .set('Authorization', 'Bearer user-a-token')
      .send({ selectedOption: 'B' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.selectedOption).toBe('B');
  });

  it('9. Reject invalid answer option (e.g. "E")', async () => {
    const res = await request(app)
      .put(`/api/v1/assessment/attempts/${attemptId}/answers/${firstQuestionId}`)
      .set('Authorization', 'Bearer user-a-token')
      .send({ selectedOption: 'E' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ANSWER');
  });

  it('10. Reject answering question not belonging to the attempt', async () => {
    const res = await request(app)
      .put(`/api/v1/assessment/attempts/${attemptId}/answers/random-unassigned-q`)
      .set('Authorization', 'Bearer user-a-token')
      .send({ selectedOption: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUESTION');
  });

  it('11. User B cannot autosave answers for User A attempt', async () => {
    const res = await request(app)
      .put(`/api/v1/assessment/attempts/${attemptId}/answers/${firstQuestionId}`)
      .set('Authorization', 'Bearer user-b-token')
      .send({ selectedOption: 'A' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('12. POST /api/v1/assessment/attempts/:attemptId/submit evaluates server-side score and transitions status', async () => {
    const res = await request(app)
      .post(`/api/v1/assessment/attempts/${attemptId}/submit`)
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('score');
    expect(res.body.data).toHaveProperty('percentage');
    expect(res.body.data).toHaveProperty('passed');
    expect(res.body.data).toHaveProperty('correctCount');
    expect(res.body.data).toHaveProperty('wrongCount');
    expect(res.body.data).toHaveProperty('unansweredCount');
    expect(res.body.data.applicationStatus).toBe('under_review');
    expect(res.body.data.notice).toContain('Final selection is made by AI CLUB administration');

    // Total count must sum to exactly 25
    const total =
      res.body.data.correctCount +
      res.body.data.wrongCount +
      res.body.data.unansweredCount;
    expect(total).toBe(25);
  });

  it('13. Submitting assessment again is IDEMPOTENT and returns the same result', async () => {
    const res = await request(app)
      .post(`/api/v1/assessment/attempts/${attemptId}/submit`)
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.applicationStatus).toBe('under_review');
  });

  it('14. Application status is now under_review', async () => {
    const res = await request(app)
      .get('/api/v1/applications/me/status')
      .set('Authorization', 'Bearer user-a-token');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('under_review');
    expect(res.body.data).toHaveProperty('assessmentScore');
  });
});
