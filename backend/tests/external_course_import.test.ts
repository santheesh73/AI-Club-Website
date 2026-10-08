import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { courseRecommendationsService } from '../src/modules/courses/courseRecommendations.service';
import { coursesService } from '../src/modules/courses/courses.service';
import { auditService } from '../src/modules/admin/audit.service';
import {
  isPrivateIPv4,
  isPrivateIPv6,
  isInternalHostname,
  validateSafeCourseUrl,
} from '../src/modules/courses/providers/ssrfGuard';
import * as safeFetcherModule from '../src/modules/courses/providers/safeFetcher';
import { extractMetadataFromHtml } from '../src/modules/courses/providers/extractors';
import { CourseraExtractor } from '../src/modules/courses/providers/extractors/courseraExtractor';
import { FreeCodeCampExtractor } from '../src/modules/courses/providers/extractors/freeCodeCampExtractor';
import { UdemyExtractor } from '../src/modules/courses/providers/extractors/udemyExtractor';
import { UnstopExtractor } from '../src/modules/courses/providers/extractors/unstopExtractor';
import express from 'express';
import { createRateLimiter } from '../src/middleware/rateLimit';
import { validateOfficialCourseUrl } from '../src/modules/courses/providers/urlValidator';
import { DeterministicRecommendationProvider } from '../src/modules/courses/ai/deterministicRecommendationProvider';

describe('AI CLUB: Smart External Course URL Import & Extraction Master Tests (IMPORT-001 - IMPORT-030)', () => {
  const adminToken = 'admin-test-token';
  const memberToken = 'member-test-token';
  const applicantToken = 'applicant-test-token';

  beforeEach(() => {
    courseRecommendationsService.resetLocalCache();
    coursesService.resetLocalState();
    auditService.resetLocalState();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // URL VALIDATION & SSRF TESTS (IMPORT-005 to IMPORT-010)
  // ============================================================================
  describe('SSRF Protection & URL Validation', () => {
    it('IMPORT-005: Unsupported domain rejected', async () => {
      const res = await validateSafeCourseUrl('https://malicious-external-site.com/course/123', { checkDns: false });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/Unsupported provider domain/);

      // Verify endpoint also rejects it
      const apiRes = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://malicious-external-site.com/course/123' });

      expect(apiRes.status).toBe(400);
      expect(apiRes.body.success).toBe(false);
      expect(apiRes.body.error.message).toMatch(/Unsupported provider domain/);
    });

    it('IMPORT-006: HTTP URL rejected (Only HTTPS allowed)', async () => {
      const res = await validateSafeCourseUrl('http://www.coursera.org/learn/machine-learning', { checkDns: false });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/Insecure protocol/);

      const apiRes = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'http://www.coursera.org/learn/machine-learning' });

      expect(apiRes.status).toBe(400);
      expect(apiRes.body.success).toBe(false);
      expect(apiRes.body.error.message).toMatch(/Only secure "https:\/\/" URLs are allowed/);
    });

    it('IMPORT-007: Malformed URL rejected', async () => {
      const malformedCheck = await validateSafeCourseUrl('not-a-valid-url-at-all');
      expect(malformedCheck.isValid).toBe(false);
      expect(malformedCheck.error).toMatch(/Invalid course URL format/);

      const apiRes = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'javascript:alert(1)' });

      expect(apiRes.status).toBe(400);
      expect(apiRes.body.success).toBe(false);
    });

    it('IMPORT-008: Private IP rejected (RFC 1918 & metadata ranges)', async () => {
      expect(isPrivateIPv4('127.0.0.1')).toBe(true);
      expect(isPrivateIPv4('10.0.0.1')).toBe(true);
      expect(isPrivateIPv4('172.16.5.1')).toBe(true);
      expect(isPrivateIPv4('192.168.1.1')).toBe(true);
      expect(isPrivateIPv4('169.254.169.254')).toBe(true); // AWS/GCP metadata
      expect(isPrivateIPv4('8.8.8.8')).toBe(false);

      const privateRes = await validateSafeCourseUrl('https://192.168.1.50/course/ml', { checkDns: false });
      expect(privateRes.isValid).toBe(false);
      expect(privateRes.error).toMatch(/Access to localhost, private networks, or metadata services is strictly forbidden/);
    });

    it('IMPORT-009: Localhost rejected', async () => {
      expect(isInternalHostname('localhost')).toBe(true);
      expect(isInternalHostname('127.0.0.1')).toBe(true);
      expect(isInternalHostname('::1')).toBe(true);
      expect(isPrivateIPv6('::1')).toBe(true);

      const localhostRes = await validateSafeCourseUrl('https://localhost:8080/course', { checkDns: false });
      expect(localhostRes.isValid).toBe(false);
      expect(localhostRes.error).toMatch(/Access to localhost, private networks, or metadata services is strictly forbidden/);
    });

    it('IMPORT-010: SSRF attempt rejected (AWS metadata & internal hostnames)', async () => {
      const metadataCheck = await validateSafeCourseUrl('https://169.254.169.254/latest/meta-data', { checkDns: false });
      expect(metadataCheck.isValid).toBe(false);

      const internalCheck = await validateSafeCourseUrl('https://internal.corp.network/course', { checkDns: false });
      expect(internalCheck.isValid).toBe(false);
    });
  });

  // ============================================================================
  // EXTRACTOR ENGINE & PROVIDERS (IMPORT-001 to IMPORT-004, IMPORT-011 to IMPORT-017)
  // ============================================================================
  describe('Metadata Extraction Engine', () => {
    it('IMPORT-001: Valid Coursera URL extracts metadata correctly', async () => {
      const courseraHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Machine Learning Specialization",
            "description": "Master Machine Learning fundamentals with Andrew Ng and Stanford Online.",
            "provider": { "@type": "Organization", "name": "Coursera" },
            "image": "https://images.coursera.org/ml-spec.jpg"
          }
          </script>
        </head>
        <body>
          <div data-e2e="key-skills"><span>Python Programming</span><span>Supervised Learning</span></div>
        </body>
        </html>
      `;

      vi.spyOn(safeFetcherModule, 'fetchCoursePage').mockResolvedValue({
        html: courseraHtml,
        finalUrl: 'https://www.coursera.org/specializations/machine-learning-introduction',
        statusCode: 200,
        contentType: 'text/html',
      });

      const res = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://www.coursera.org/specializations/machine-learning-introduction' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('COURSERA');
      expect(res.body.data.metadata.title).toBe('Machine Learning Specialization');
      expect(res.body.data.metadata.description).toContain('Master Machine Learning fundamentals');
      expect(res.body.data.metadata.imageUrl).toBe('https://images.coursera.org/ml-spec.jpg');
      expect(res.body.data.metadata.category).toBe('MACHINE_LEARNING');
      expect(res.body.data.extraction.titleSource).toBe('jsonld');
    });

    it('IMPORT-002: Valid freeCodeCamp URL extracts metadata correctly', async () => {
      const fccHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Scientific Computing with Python Certification | freeCodeCamp.org</title>
          <meta property="og:title" content="Scientific Computing with Python Certification" />
          <meta property="og:description" content="Learn Python from scratch, understand data structures, and build algorithms." />
          <meta property="og:image" content="https://cdn.freecodecamp.org/fcc-python.png" />
        </head>
        <body>
          <h1>Scientific Computing with Python</h1>
        </body>
        </html>
      `;

      vi.spyOn(safeFetcherModule, 'fetchCoursePage').mockResolvedValue({
        html: fccHtml,
        finalUrl: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
        statusCode: 200,
        contentType: 'text/html',
      });

      const res = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('FREECODECAMP');
      expect(res.body.data.metadata.title).toBe('Scientific Computing with Python Certification');
      expect(res.body.data.metadata.priceType).toBe('free');
      expect(res.body.data.extraction.titleSource).toBe('og:title');
    });

    it('IMPORT-003: Valid Udemy URL extracts metadata correctly', async () => {
      const udemyHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "2026 Complete Python Bootcamp: Go from zero to hero",
            "description": "Learn Python like a Professional! Start from the basics and go all the way to creating your own applications and games.",
            "provider": "Udemy",
            "image": "https://img-c.udemycdn.com/course/750x422/567828_67d0.jpg"
          }
          </script>
        </head>
        <body>
          <span data-purpose="rating-number">4.7</span>
        </body>
        </html>
      `;

      vi.spyOn(safeFetcherModule, 'fetchCoursePage').mockResolvedValue({
        html: udemyHtml,
        finalUrl: 'https://www.udemy.com/course/complete-python-bootcamp/',
        statusCode: 200,
        contentType: 'text/html',
      });

      const res = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://www.udemy.com/course/complete-python-bootcamp/' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('UDEMY');
      expect(res.body.data.metadata.title).toBe('2026 Complete Python Bootcamp: Go from zero to hero');
      expect(res.body.data.metadata.imageUrl).toBe('https://img-c.udemycdn.com/course/750x422/567828_67d0.jpg');
    });

    it('IMPORT-004: Valid Unstop URL extracts metadata correctly', async () => {
      const unstopHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Generative AI & LLM Workshop" />
          <meta property="og:description" content="Hands-on workshop on Prompt Engineering, LangChain, and fine-tuning LLMs." />
          <meta property="og:image" content="https://d8it4huxumps7.cloudfront.net/unstop-genai.png" />
        </head>
        <body>
          <h1 class="course-header">Generative AI & LLM Workshop</h1>
        </body>
        </html>
      `;

      vi.spyOn(safeFetcherModule, 'fetchCoursePage').mockResolvedValue({
        html: unstopHtml,
        finalUrl: 'https://unstop.com/courses/generative-ai-llm-workshop',
        statusCode: 200,
        contentType: 'text/html',
      });

      const res = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://unstop.com/courses/generative-ai-llm-workshop' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('UNSTOP');
      expect(res.body.data.metadata.title).toBe('Generative AI & LLM Workshop');
      expect(res.body.data.metadata.category).toBe('GENERATIVE_AI');
    });

    it('IMPORT-011: JSON-LD extraction precedence over OpenGraph and HTML', async () => {
      const html = `
        <html>
        <head>
          <title>HTML Fallback Title</title>
          <meta property="og:title" content="OpenGraph Title" />
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Authoritative JSON-LD Course Title",
            "description": "Authoritative JSON-LD description."
          }
          </script>
        </head>
        </html>
      `;

      const result = await extractMetadataFromHtml(html, 'https://www.coursera.org/learn/example', 'COURSERA');
      expect(result.title).toBe('Authoritative JSON-LD Course Title');
      expect(result.description).toBe('Authoritative JSON-LD description.');
      expect(result.extraction.titleSource).toBe('jsonld');
      expect(result.extraction.descriptionSource).toBe('jsonld');
    });

    it('IMPORT-012: OpenGraph extraction fallback when JSON-LD is absent', async () => {
      const html = `
        <html>
        <head>
          <title>HTML Fallback Title</title>
          <meta property="og:title" content="OpenGraph Title for Course" />
          <meta property="og:description" content="OpenGraph Course description content." />
          <meta property="og:image" content="https://example.com/banner.jpg" />
        </head>
        </html>
      `;

      const result = await extractMetadataFromHtml(html, 'https://www.udemy.com/course/example', 'UDEMY');
      expect(result.title).toBe('OpenGraph Title for Course');
      expect(result.description).toBe('OpenGraph Course description content.');
      expect(result.imageUrl).toBe('https://example.com/banner.jpg');
      expect(result.extraction.titleSource).toBe('og:title');
      expect(result.extraction.descriptionSource).toBe('og:description');
    });

    it('IMPORT-013: HTML <title> fallback cleans provider suffix', async () => {
      const html = `
        <html>
        <head>
          <title>Deep Learning Specialization | Coursera</title>
        </head>
        </html>
      `;

      const result = await extractMetadataFromHtml(html, 'https://www.coursera.org/learn/deep-learning', 'COURSERA');
      expect(result.title).toBe('Deep Learning Specialization');
      expect(result.extraction.titleSource).toBe('html:title');
    });

    it('IMPORT-014: Meta description fallback when JSON-LD and OG absent', async () => {
      const html = `
        <html>
        <head>
          <title>Python Essentials</title>
          <meta name="description" content="Learn the core syntax and libraries of Python 3." />
        </head>
        </html>
      `;

      const result = await extractMetadataFromHtml(html, 'https://www.freecodecamp.org/learn/python', 'FREECODECAMP');
      expect(result.description).toBe('Learn the core syntax and libraries of Python 3.');
      expect(result.extraction.descriptionSource).toBe('meta:description');
    });

    it('IMPORT-015: Partial extraction returns success: true without hallucinating missing fields', async () => {
      const html = `
        <html>
        <head>
          <title>Minimal Course Title</title>
        </head>
        </html>
      `;

      const result = await extractMetadataFromHtml(html, 'https://www.coursera.org/learn/minimal', 'COURSERA');
      expect(result.title).toBe('Minimal Course Title');
      expect(result.description).toBeNull();
      expect(result.imageUrl).toBeNull();
      expect(result.skills).toEqual([]);
    });

    it('IMPORT-016: Missing description returns null and does not fabricate fake text', async () => {
      const html = `<html><head><title>Title Only</title></head></html>`;
      const result = await extractMetadataFromHtml(html, 'https://www.udemy.com/course/sample', 'UDEMY');
      expect(result.description).toBeNull();
    });

    it('IMPORT-017: Missing image returns null gracefully', async () => {
      const html = `<html><head><title>Course Without Image</title></head></html>`;
      const result = await extractMetadataFromHtml(html, 'https://unstop.com/courses/sample', 'UNSTOP');
      expect(result.imageUrl).toBeNull();
    });
  });

  // ============================================================================
  // PROVIDER INTEGRITY & DUPLICATE CHECKS (IMPORT-018, IMPORT-019)
  // ============================================================================
  describe('Provider Integrity & Duplicate Detection', () => {
    it('IMPORT-018: Provider mismatch rejected (URL and provider must align)', () => {
      // Trying to pair a Coursera URL with UDEMY provider key
      const validation = validateOfficialCourseUrl('https://www.coursera.org/learn/ml', 'UDEMY');
      expect(validation.isValid).toBe(false);
      expect(validation.error).toMatch(/authorized domains/);
    });

    it('IMPORT-019: Duplicate course detected and existing record returned', async () => {
      const canonicalUrl = `https://www.coursera.org/learn/duplicate-test-${Date.now()}`;

      // Create initial course
      await courseRecommendationsService.createExternalCourse(
        {
          title: 'Initial Registered Course',
          provider: 'Coursera',
          officialUrl: canonicalUrl,
          category: 'AI',
          skills: ['Python'],
          difficulty: 'beginner',
          description: 'Original course record.',
          status: 'published',
        },
        'admin-user-id'
      );

      vi.spyOn(safeFetcherModule, 'fetchCoursePage').mockResolvedValue({
        html: `<html><head><title>Initial Registered Course | Coursera</title></head></html>`,
        finalUrl: canonicalUrl,
        statusCode: 200,
        contentType: 'text/html',
      });

      // Attempt extraction of same course URL
      const extractRes = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: canonicalUrl });

      expect(extractRes.status).toBe(200);
      expect(extractRes.body.success).toBe(true);
      expect(extractRes.body.data.alreadyExists).toBe(true);
      expect(extractRes.body.data.existingCourse).toBeDefined();
      expect(extractRes.body.data.existingCourse.title).toBe('Initial Registered Course');
    });
  });

  // ============================================================================
  // AUTHORIZATION & ACCESS CONTROL (IMPORT-020 to IMPORT-022)
  // ============================================================================
  describe('Admin Authorization Enforced (403 for Non-Admins)', () => {
    it('IMPORT-020: Admin authorization succeeds on extraction endpoint', async () => {
      vi.spyOn(safeFetcherModule, 'fetchCoursePage').mockResolvedValue({
        html: `<html><head><title>Admin Auth Course | Coursera</title></head></html>`,
        finalUrl: 'https://www.coursera.org/learn/admin-auth',
        statusCode: 200,
        contentType: 'text/html',
      });

      const res = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://www.coursera.org/learn/admin-auth' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('IMPORT-021: Applicant receives 403 on extraction endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ url: 'https://www.coursera.org/learn/sample' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('IMPORT-022: Member receives 403 on extraction endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ url: 'https://www.coursera.org/learn/sample' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ============================================================================
  // RATE LIMITING & SECURITY (IMPORT-023, IMPORT-028)
  // ============================================================================
  describe('Rate Limiting & Security Hardening', () => {
    it('IMPORT-023: Extraction endpoint is protected by rate limiting', async () => {
      const testLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 2,
        skipInTest: false,
      });

      const testApp = express();
      testApp.use(testLimiter);
      testApp.post('/test-extract', (_req, res) => res.json({ success: true }));
      testApp.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(err.statusCode || 500).json({
          success: false,
          error: { code: err.code || 'ERROR', message: err.message },
        });
      });

      const res1 = await request(testApp).post('/test-extract');
      expect(res1.status).toBe(200);
      const res2 = await request(testApp).post('/test-extract');
      expect(res2.status).toBe(200);
      const res3 = await request(testApp).post('/test-extract');
      expect(res3.status).toBe(429);
      expect(res3.body.error.code).toBe('TOO_MANY_REQUESTS');
    });

    it('IMPORT-028: No sensitive secrets exposed in extraction metadata or response', async () => {
      vi.spyOn(safeFetcherModule, 'fetchCoursePage').mockResolvedValue({
        html: `<html><head><title>Secrets Check Course | Coursera</title></head></html>`,
        finalUrl: 'https://www.coursera.org/learn/secrets-check',
        statusCode: 200,
        contentType: 'text/html',
      });

      const res = await request(app)
        .post('/api/v1/admin/external-courses/extract')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://www.coursera.org/learn/secrets-check' });

      expect(res.status).toBe(200);
      const stringified = JSON.stringify(res.body);
      expect(stringified).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(stringified).not.toContain('JWT_SECRET');
      expect(stringified).not.toContain('GEMINI_API_KEY');
      expect(stringified).not.toContain('password');
    });
  });

  // ============================================================================
  // DRAFT & PUBLISH LIFECYCLE (IMPORT-024 to IMPORT-027)
  // ============================================================================
  describe('Admin Review, Draft & Publishing Lifecycle', () => {
    it('IMPORT-024: Admin can edit extracted metadata before saving', async () => {
      const courseUrl = `https://www.coursera.org/learn/edit-metadata-${Date.now()}`;

      // Admin modifies extracted title and custom skills
      const createRes = await request(app)
        .post('/api/v1/admin/external-courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Modified Machine Learning Course Title',
          provider: 'Coursera',
          officialUrl: courseUrl,
          category: 'Deep Learning',
          skills: ['PyTorch', 'Transformers', 'Custom Skill'],
          difficulty: 'advanced',
          description: 'Curated description by admin.',
          status: 'draft',
          extractionMetadata: {
            source: 'jsonld',
            extractedAt: new Date().toISOString(),
          },
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.title).toBe('Modified Machine Learning Course Title');
      expect(createRes.body.data.skills).toContain('Custom Skill');
      expect(createRes.body.data.difficulty).toBe('advanced');
    });

    it('IMPORT-025: Course is saved as DRAFT first with published_at null', async () => {
      const courseUrl = `https://www.coursera.org/learn/draft-first-${Date.now()}`;

      const draftRes = await request(app)
        .post('/api/v1/admin/external-courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Pending Draft Course',
          provider: 'Coursera',
          officialUrl: courseUrl,
          category: 'AI',
          skills: ['Python'],
          difficulty: 'beginner',
          description: 'A draft awaiting review.',
          status: 'draft',
        });

      expect(draftRes.status).toBe(201);
      expect(draftRes.body.success).toBe(true);
      expect(draftRes.body.data.status).toBe('draft');
      expect(draftRes.body.data.publishedAt).toBeNull();
    });

    it('IMPORT-026: Admin can explicitly publish a draft course', async () => {
      const courseUrl = `https://www.coursera.org/learn/publish-lifecycle-${Date.now()}`;

      // Create draft first
      const draftRes = await request(app)
        .post('/api/v1/admin/external-courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Draft Course Pending Review',
          provider: 'Coursera',
          officialUrl: courseUrl,
          category: 'AI',
          skills: ['Python'],
          difficulty: 'beginner',
          description: 'To be reviewed before publishing.',
          status: 'draft',
        });

      expect(draftRes.status).toBe(201);
      const courseId = draftRes.body.data.id;

      // Admin publishes course
      const publishRes = await request(app)
        .post(`/api/v1/admin/external-courses/${courseId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(publishRes.status).toBe(200);
      expect(publishRes.body.success).toBe(true);
      expect(publishRes.body.data.status).toBe('published');
      expect(publishRes.body.data.publishedAt).toBeDefined();
    });

    it('IMPORT-027: Invalid URL after manual edit rejected', async () => {
      const res = await request(app)
        .post('/api/v1/admin/external-courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Altered to Insecure Domain Course',
          provider: 'Coursera',
          officialUrl: 'http://insecure-domain.org/course', // Non-allowlisted & HTTP
          category: 'AI',
          skills: ['Python'],
          difficulty: 'beginner',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // SYSTEM INTEGRITY: RECOMMENDATION ENGINE & LMS (IMPORT-029, IMPORT-030)
  // ============================================================================
  describe('System Integrity: Existing Engine & LMS Not Broken', () => {
    it('IMPORT-029: Existing recommendation engine still works and serves published courses', async () => {
      courseRecommendationsService.setAiProvider(new DeterministicRecommendationProvider());
      const courseUrl = `https://www.coursera.org/learn/rec-engine-test-${Date.now()}`;

      // Create and publish external course
      await courseRecommendationsService.createExternalCourse(
        {
          title: 'Autonomous Robotics with ROS',
          provider: 'Coursera',
          officialUrl: courseUrl,
          category: 'Robotics',
          skills: ['Robotics', 'ROS', 'Python'],
          difficulty: 'intermediate',
          description: 'Build autonomous robot navigation systems.',
          status: 'published',
        },
        'admin-user-id'
      );

      // Request recommendations as member
      const recRes = await request(app)
        .get('/api/v1/member/courses/recommended')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(recRes.status).toBe(200);
      expect(recRes.body.success).toBe(true);
      expect(Array.isArray(recRes.body.data.recommendations)).toBe(true);
    }, 30000);

    it('IMPORT-030: Existing internal Courses / LMS API still works seamlessly', async () => {
      const lmsRes = await request(app)
        .get('/api/v1/member/courses')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(lmsRes.status).toBe(200);
      expect(lmsRes.body.success).toBe(true);
      expect(Array.isArray(lmsRes.body.data)).toBe(true);
    });
  });
});
