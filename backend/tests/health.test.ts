import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';

describe('AI CLUB Backend API Smoke Tests', () => {
  it('GET /health returns operational status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data.services).toHaveProperty('server', 'healthy');
  });

  it('GET /api/v1/health returns versioned operational status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status', 'ok');
  });

  it('GET /api/v1/unknown-endpoint returns standard 404 error format', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
  });
});
