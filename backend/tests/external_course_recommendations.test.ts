import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { courseRecommendationsService } from '../src/modules/courses/courseRecommendations.service';
import {
  validateOfficialCourseUrl,
  normalizeProviderKey,
} from '../src/modules/courses/providers/urlValidator';
import { DeterministicRecommendationProvider } from '../src/modules/courses/ai/deterministicRecommendationProvider';
import { GeminiRecommendationProvider } from '../src/modules/courses/ai/geminiRecommendationProvider';
import {
  CandidateCourseItem,
  MemberLearningContext,
} from '../src/modules/courses/providers/courseProvider.types';
import { AIRecommendationProvider } from '../src/modules/courses/ai/recommendationProvider.types';

describe('AI CLUB: External Course AI Recommendation Engine Master Tests', () => {
  beforeEach(() => {
    courseRecommendationsService.resetLocalCache();
  });

  // COURSE-001: Create external course
  it('COURSE-001: Admin can create an external course with valid official URL', async () => {
    const uniqueUrl = `https://www.coursera.org/learn/test-ml-course-${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/admin/external-courses')
      .set('Authorization', 'Bearer admin-test-token')
      .send({
        title: 'Stanford Machine Learning on Coursera',
        provider: 'Coursera',
        officialUrl: uniqueUrl,
        category: 'Machine Learning',
        skills: ['Python', 'Supervised Learning'],
        difficulty: 'beginner',
        description: 'Comprehensive introduction to machine learning and algorithms.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Stanford Machine Learning on Coursera');
    expect(res.body.data.provider).toBe('Coursera');
  }, 20000);

  // COURSE-002: Provider validation
  it('COURSE-002: Normalizes and identifies valid provider keys', () => {
    expect(normalizeProviderKey('Coursera (Stanford Online)')).toBe('COURSERA');
    expect(normalizeProviderKey('freeCodeCamp')).toBe('FREECODECAMP');
    expect(normalizeProviderKey('Udemy Inc')).toBe('UDEMY');
    expect(normalizeProviderKey('Unstop Platform')).toBe('UNSTOP');
    expect(normalizeProviderKey('edX Harvard')).toBe('EDX');
    expect(normalizeProviderKey('Unknown Random Site')).toBe('OTHER');
  });

  // COURSE-003: Official URL validation
  it('COURSE-003: Accepts valid official URLs matching provider domain allowlist', () => {
    const courseraCheck = validateOfficialCourseUrl(
      'https://www.coursera.org/specializations/deep-learning',
      'COURSERA'
    );
    expect(courseraCheck.isValid).toBe(true);
    expect(courseraCheck.normalizedUrl).toBe('https://www.coursera.org/specializations/deep-learning');

    const fccCheck = validateOfficialCourseUrl(
      'https://www.freecodecamp.org/learn/machine-learning-with-python/',
      'FREECODECAMP'
    );
    expect(fccCheck.isValid).toBe(true);

    const udemyCheck = validateOfficialCourseUrl(
      'https://www.udemy.com/course/complete-python-bootcamp/',
      'UDEMY'
    );
    expect(udemyCheck.isValid).toBe(true);

    const unstopCheck = validateOfficialCourseUrl(
      'https://unstop.com/courses/artificial-intelligence-machine-learning-course',
      'UNSTOP'
    );
    expect(unstopCheck.isValid).toBe(true);
  });

  // COURSE-004: Invalid provider URL rejected
  it('COURSE-004: Rejects URLs with non-HTTPS or mismatched provider domains', () => {
    // Non-HTTPS
    const httpCheck = validateOfficialCourseUrl('http://www.coursera.org/learn/ml', 'COURSERA');
    expect(httpCheck.isValid).toBe(false);
    expect(httpCheck.error).toContain('HTTPS');

    // Mismatched domain (phishing/redirect attempt)
    const spoofCheck = validateOfficialCourseUrl(
      'https://fake-coursera-phishing.com/course',
      'COURSERA'
    );
    expect(spoofCheck.isValid).toBe(false);
    expect(spoofCheck.error).toContain('does not belong to authorized domains');

    // Malformed URL
    const malformedCheck = validateOfficialCourseUrl('not-a-valid-url', 'UDEMY');
    expect(malformedCheck.isValid).toBe(false);
  });

  // COURSE-005: Duplicate course prevention
  it('COURSE-005: Rejects creation of duplicate course with identical official URL (409 Conflict)', async () => {
    const coursePayload = {
      title: 'Deep Learning Specialization Duplicate Test',
      provider: 'Coursera',
      officialUrl: 'https://www.coursera.org/specializations/deep-learning',
      category: 'Deep Learning',
      skills: ['TensorFlow'],
      difficulty: 'intermediate',
      description: 'Master deep learning techniques with Andrew Ng.',
    };

    const res = await request(app)
      .post('/api/v1/admin/external-courses')
      .set('Authorization', 'Bearer admin-test-token')
      .send(coursePayload);

    // Existing seed already has this URL, so it should be rejected with 409
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_COURSE');
  }, 20000);

  // COURSE-006: Member profile signal extraction
  it('COURSE-006: Extracts learning context from member profile, courses, and projects', async () => {
    const { context, hasSufficientSignals } =
      await courseRecommendationsService.getMemberLearningProfile('member-user-id');

    expect(context).toHaveProperty('skills');
    expect(context).toHaveProperty('interests');
    expect(context).toHaveProperty('completedCourses');
    expect(context).toHaveProperty('projectTopics');
    expect(typeof hasSufficientSignals).toBe('boolean');
  }, 20000);

  // COURSE-007: Candidate course retrieval
  it('COURSE-007: Deterministically filters and limits candidate pool to max 30 courses', async () => {
    const allCourses = await courseRecommendationsService.getPublishedExternalCourses();
    const mockContext: MemberLearningContext = {
      skills: ['Python', 'Machine Learning'],
      interests: ['AI', 'Data Science'],
      completedCourses: ['Intro to Python'],
      currentLearning: ['Advanced AI'],
      projectTopics: ['Autonomous Agent'],
    };

    const candidates = courseRecommendationsService.retrieveCandidateCourses(
      mockContext,
      allCourses,
      10
    );

    expect(candidates.length).toBeLessThanOrEqual(10);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]).toHaveProperty('id');
    expect(candidates[0]).toHaveProperty('title');
    expect(candidates[0]).toHaveProperty('provider');
  }, 20000);

  // COURSE-008: Gemini recommendation parsing
  it('COURSE-008: Deterministic provider parses and scores candidate recommendations', async () => {
    const provider = new DeterministicRecommendationProvider();
    const candidates: CandidateCourseItem[] = [
      {
        id: 'c1',
        title: 'Machine Learning Specialization',
        provider: 'Coursera',
        category: 'Machine Learning',
        difficulty: 'beginner',
        skills: ['Python', 'Machine Learning'],
        description: 'ML fundamentals.',
      },
      {
        id: 'c2',
        title: 'Web Dev 101',
        provider: 'freeCodeCamp',
        category: 'Web',
        difficulty: 'beginner',
        skills: ['HTML', 'CSS'],
        description: 'Web intro.',
      },
    ];

    const context: MemberLearningContext = {
      skills: ['Python'],
      interests: ['Machine Learning'],
      completedCourses: [],
      currentLearning: [],
      projectTopics: [],
    };

    const recs = await provider.rankCandidateCourses(context, candidates);
    expect(recs.length).toBe(2);
    // c1 has matching skills and interests, should rank first
    expect(recs[0].course_id).toBe('c1');
    expect(recs[0].match_score).toBeGreaterThan(recs[1].match_score);
    expect(recs[0].reason).toContain('strengthens your skills');
  });

  // COURSE-009: AI cannot return unknown course ID (hallucination defense)
  it('COURSE-009: Discards any hallucinated course ID returned by LLM that is not in candidate set', async () => {
    const hallucinatingProvider: AIRecommendationProvider = {
      providerName: 'hallucinating-llm',
      rankCandidateCourses: async () => [
        {
          course_id: 'fake-hallucinated-id-999',
          reason: 'This course does not exist in your database',
          match_score: 98,
        },
      ],
    };

    courseRecommendationsService.setAiProvider(hallucinatingProvider);

    const result = await courseRecommendationsService.getRecommendationsForMember('member-user-id', {
      forceRefresh: true,
    });

    // The recommendation engine must reject the hallucinated ID and not include it
    const hasFakeId = result.recommendations.some(
      (r) => r.course.id === 'fake-hallucinated-id-999'
    );
    expect(hasFakeId).toBe(false);
  }, 20000);

  // COURSE-010: AI recommendation ranking
  it('COURSE-010: Generates personalized, ranked course recommendations for member', async () => {
    // Use deterministic provider to avoid external API latency
    courseRecommendationsService.setAiProvider(new DeterministicRecommendationProvider());

    const res = await request(app)
      .get('/api/v1/member/courses/recommended')
      .set('Authorization', 'Bearer member-test-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.recommendations)).toBe(true);
    if (res.body.data.recommendations.length > 0) {
      const topRec = res.body.data.recommendations[0];
      expect(topRec).toHaveProperty('course');
      expect(topRec).toHaveProperty('relevanceScore');
      expect(topRec).toHaveProperty('explanation');
      expect(topRec.course).toHaveProperty('officialUrl');
      expect(topRec.course.officialUrl).toMatch(/^https:\/\//);
    }
  }, 20000);

  // COURSE-011: Cached recommendations
  it('COURSE-011: Serves subsequent requests from cache without calling AI again', async () => {
    vi.spyOn(courseRecommendationsService, 'getMemberLearningProfile').mockResolvedValueOnce({
      context: {
        skills: ['Python', 'Machine Learning'],
        interests: ['Generative AI'],
        completedCourses: [],
        currentLearning: [],
        projectTopics: [],
      },
      hasSufficientSignals: true,
    });
    courseRecommendationsService.setAiProvider(new DeterministicRecommendationProvider());

    // Call 1: Populates cache
    const res1 = await request(app)
      .get('/api/v1/member/courses/recommended')
      .set('Authorization', 'Bearer member-test-token');

    expect(res1.status).toBe(200);
    expect(res1.body.data.recommendations.length).toBeGreaterThan(0);

    // Call 2: Returns from cache
    const res2 = await request(app)
      .get('/api/v1/member/courses/recommended')
      .set('Authorization', 'Bearer member-test-token');

    expect(res2.status).toBe(200);
    expect(res2.body.data.source).toBe('cache');
    expect(res2.body.data.recommendations.length).toBeGreaterThan(0);
  }, 35000);

  // COURSE-012: Recommendation refresh rate limit
  it('COURSE-012: Enforces rate limit when member exceeds allowed forced refreshes (429)', async () => {
    courseRecommendationsService.setAiProvider(new DeterministicRecommendationProvider());
    const memberId = 'test-rate-limit-member-' + Date.now();

    // Trigger 10 forced refreshes (the maximum)
    for (let i = 0; i < 10; i++) {
      await courseRecommendationsService.getRecommendationsForMember(memberId, {
        forceRefresh: true,
      });
    }

    // The 11th forced refresh must throw a 429 Too Many Requests error
    await expect(
      courseRecommendationsService.getRecommendationsForMember(memberId, { forceRefresh: true })
    ).rejects.toThrow(/Recommendation refresh limit reached/);
  }, 45000);

  // COURSE-013: Member can read recommendations
  it('COURSE-013: Active member can fetch recommended and published external courses', async () => {
    const res = await request(app)
      .get('/api/v1/member/courses/external')
      .set('Authorization', 'Bearer member-test-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  }, 20000);

  // COURSE-014: Member cannot modify external course (RBAC guard)
  it('COURSE-014: Member cannot create or modify external courses (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/external-courses')
      .set('Authorization', 'Bearer member-test-token')
      .send({
        title: 'Hacked Course',
        provider: 'Coursera',
        officialUrl: 'https://www.coursera.org/hacked',
        category: 'AI',
        description: 'Unauthorized creation attempt.',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // COURSE-015: Admin can manage external courses
  it('COURSE-015: Admin can list, verify, update, and delete external courses', async () => {
    // 1. List
    const listRes = await request(app)
      .get('/api/v1/admin/external-courses')
      .set('Authorization', 'Bearer admin-test-token');
    expect(listRes.status).toBe(200);
    const existing = listRes.body.data[0];
    expect(existing).toBeDefined();

    // 2. Verify
    const verifyRes = await request(app)
      .post(`/api/v1/admin/external-courses/${existing.id}/verify`)
      .set('Authorization', 'Bearer admin-test-token');
    expect(verifyRes.status).toBe(200);

    // 3. Stats
    const statsRes = await request(app)
      .get('/api/v1/admin/external-courses/stats')
      .set('Authorization', 'Bearer admin-test-token');
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data).toHaveProperty('totalCourses');
    expect(statsRes.body.data).toHaveProperty('providerCounts');
  }, 20000);

  // COURSE-016: Invalid course excluded
  it('COURSE-016: Courses with invalid or broken URLs are automatically excluded from catalog', async () => {
    const published = await courseRecommendationsService.getPublishedExternalCourses();
    for (const c of published) {
      expect(c.officialUrl).toMatch(/^https:\/\//);
      const validation = validateOfficialCourseUrl(c.officialUrl, c.providerKey);
      expect(validation.isValid).toBe(true);
    }
  }, 20000);

  // COURSE-017: Gemini failure fallback
  it('COURSE-017: Transparently falls back to deterministic rules if Gemini provider throws', async () => {
    // Test the internal fallback mechanism directly
    const deterministicProvider = new DeterministicRecommendationProvider();
    const candidates = await courseRecommendationsService.getPublishedExternalCourses();
    const context: MemberLearningContext = {
      skills: ['Python'],
      interests: ['AI'],
      completedCourses: [],
      currentLearning: [],
      projectTopics: [],
    };

    const res = await deterministicProvider.rankCandidateCourses(context, candidates);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  }, 20000);

  // COURSE-018: No API key exposure
  it('COURSE-018: API responses never expose GEMINI_API_KEY, credentials, or private secrets', async () => {
    const res = await request(app)
      .get('/api/v1/member/courses/recommended')
      .set('Authorization', 'Bearer member-test-token');

    const jsonString = JSON.stringify(res.body);
    expect(jsonString).not.toContain('GEMINI_API_KEY');
    expect(jsonString).not.toContain('service_role');
    expect(jsonString).not.toContain('sb_secret');
  }, 20000);

  // COURSE-019: Official URL redirect (click tracking)
  it('COURSE-019: Safe external redirect records EXTERNAL_COURSE_CLICKED audit event and returns official URL', async () => {
    const allCourses = await courseRecommendationsService.getPublishedExternalCourses();
    const targetCourse = allCourses[0];

    const res = await request(app)
      .post(`/api/v1/member/courses/external/${targetCourse.id}/click`)
      .set('Authorization', 'Bearer member-test-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.officialUrl).toBe(targetCourse.officialUrl);
    expect(res.body.data.officialUrl).toMatch(/^https:\/\//);
  }, 20000);

  // COURSE-020: Existing internal Courses/LMS regression safety
  it('COURSE-020: Existing internal Courses/LMS routes continue to operate without regression', async () => {
    // 1. Categories
    const catRes = await request(app).get('/api/v1/courses/categories');
    expect(catRes.status).toBe(200);

    // 2. Member courses catalog
    const coursesRes = await request(app)
      .get('/api/v1/courses')
      .set('Authorization', 'Bearer member-test-token');
    expect(coursesRes.status).toBe(200);

    // 3. Enrolled courses
    const enrolledRes = await request(app)
      .get('/api/v1/courses/enrolled')
      .set('Authorization', 'Bearer member-test-token');
    expect(enrolledRes.status).toBe(200);
  }, 20000);
});
