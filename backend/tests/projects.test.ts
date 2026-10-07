import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { projectsService } from '../src/modules/projects/projects.service';
import { achievementsService } from '../src/modules/achievements/achievements.service';
import { membershipService } from '../src/modules/membership/membership.service';
import { auditService } from '../src/modules/admin/audit.service';

describe('AI CLUB Milestone 8: Projects, Achievements & Community Showcase Platform Tests', () => {
  const adminToken = 'admin-test-token';
  const memberToken = 'member-test-token';
  const userBToken = 'user-b-token';
  const applicantToken = 'applicant-test-token';

  beforeEach(() => {
    projectsService.resetLocalState();
    achievementsService.resetLocalState();
    membershipService.resetLocalState();
    auditService.resetLocalState();
  });

  // ============================================================================
  // 1. Authorization & Role Guards
  // ============================================================================
  describe('1. Route Authorization & Membership Guards', () => {
    it('rejects unauthenticated requests to member projects (401)', async () => {
      const res = await request(app).get('/api/v1/member/projects');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects applicant/non-member access to member projects (403)', async () => {
      const res = await request(app)
        .get('/api/v1/member/projects')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects applicant/non-member project creation (403)', async () => {
      const res = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          title: 'Applicant Project',
          shortDescription: 'Short description for project',
          description: 'Full description for applicant project',
          categoryId: 'pcat-1',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-admin access to admin moderation routes (403)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/projects/proj-123/hide')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ reason: 'Inappropriate content' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ============================================================================
  // 2. Taxonomy & Metadata
  // ============================================================================
  describe('2. Taxonomy Metadata', () => {
    it('returns project categories to public without auth', async () => {
      const res = await request(app).get('/api/v1/projects/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
      expect(res.body.data.some((c: any) => c.slug === 'ai-ml')).toBe(true);
    });

    it('returns technologies to public without auth', async () => {
      const res = await request(app).get('/api/v1/projects/technologies');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((t: any) => t.slug === 'pytorch')).toBe(true);
    });

    it('returns achievement categories to public without auth', async () => {
      const res = await request(app).get('/api/v1/achievements/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ============================================================================
  // 3. Project Creation & Slug Uniqueness
  // ============================================================================
  describe('3. Project Creation & Lifecycle', () => {
    it('allows active member to create a project and auto-assigns Owner contributor', async () => {
      const payload = {
        title: 'Autonomous Drone Vision',
        shortDescription: 'Real-time object detection and obstacle avoidance on edge devices.',
        description: 'Complete pipeline leveraging YOLOv8 quantized models running on Nvidia Jetson Orin Nano.',
        categoryId: 'pcat-1',
        visibility: 'public',
        technologyIds: ['tech-1', 'tech-2'],
      };

      const res = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.slug).toBe('autonomous-drone-vision');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.contributors.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.contributors[0].role).toBe('Owner');
    });

    it('generates unique collision-resistant slugs for duplicate titles', async () => {
      const payload1 = {
        title: 'Neural Style Transfer',
        shortDescription: 'Artistic neural image blending with style loss.',
        description: 'Implementation using deep convolutional feature representations.',
        categoryId: 'pcat-1',
      };

      const res1 = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(payload1);

      expect(res1.status).toBe(201);
      expect(res1.body.data.slug).toBe('neural-style-transfer');

      // Create a second project with identical title
      const res2 = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(payload1);

      expect(res2.status).toBe(201);
      expect(res2.body.data.slug).toBe('neural-style-transfer-2');
    });

    it('rejects project creation if categoryId is invalid (400)', async () => {
      const res = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Invalid Category Project',
          shortDescription: 'Valid short description for testing.',
          description: 'Valid full description for testing invalid category.',
          categoryId: 'non-existent-category',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CATEGORY');
    });
  });

  // ============================================================================
  // 4. Publishing & Discovery Visibility Gating
  // ============================================================================
  describe('4. Visibility & Discovery Gating', () => {
    it('draft projects are hidden from public showcase until published', async () => {
      // 1. Create draft project
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Stealth AI Agent',
          shortDescription: 'Currently in active research development.',
          description: 'Comprehensive evaluation of LLM agent architectures in isolated sandboxes.',
          categoryId: 'pcat-1',
          visibility: 'public',
        });

      const projectId = createRes.body.data.id;
      const slug = createRes.body.data.slug;

      // 2. Query public catalog
      const publicCatalog = await request(app).get('/api/v1/projects');
      expect(publicCatalog.status).toBe(200);
      const inCatalog = publicCatalog.body.data.items.some((p: any) => p.slug === slug);
      expect(inCatalog).toBe(false);

      // 3. Publish project
      const pubRes = await request(app)
        .post(`/api/v1/member/projects/${projectId}/publish`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('published');

      // 4. Query public catalog again -> now visible!
      const updatedCatalog = await request(app).get('/api/v1/projects');
      expect(updatedCatalog.body.data.items.some((p: any) => p.slug === slug)).toBe(true);
    });

    it('enforces members_only visibility gating against unauthenticated users', async () => {
      // 1. Create and publish members_only project
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Internal AI Research Paper Review',
          shortDescription: 'Confidential internal club research review pipeline.',
          description: 'Proprietary evaluations and internal benchmark results for club members.',
          categoryId: 'pcat-1',
          visibility: 'members_only',
        });

      const projectId = createRes.body.data.id;
      const slug = createRes.body.data.slug;

      await request(app)
        .post(`/api/v1/member/projects/${projectId}/publish`)
        .set('Authorization', `Bearer ${memberToken}`);

      // 2. Unauthenticated user querying detail gets 403
      const unauthDetail = await request(app).get(`/api/v1/projects/detail/${slug}`);
      expect(unauthDetail.status).toBe(403);
      expect(unauthDetail.body.error.code).toBe('MEMBERS_ONLY_RESTRICTION');

      // 3. Active member querying detail succeeds
      const memberDetail = await request(app)
        .get(`/api/v1/projects/detail/${slug}`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(memberDetail.status).toBe(200);
      expect(memberDetail.body.data.title).toBe('Internal AI Research Paper Review');
    });
  });

  // ============================================================================
  // 5. Ownership & Mutation Security
  // ============================================================================
  describe('5. Ownership & Mutation Permissions', () => {
    it('prevents non-owner non-admin members from updating a project (403)', async () => {
      // Member A creates project
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Member A Exclusive Project',
          shortDescription: 'High performance inference cluster for LLMs.',
          description: 'Distributed model partitioning across heterogeneous nodes.',
          categoryId: 'pcat-2',
        });

      const projectId = createRes.body.data.id;

      // User B tries to update it
      const hackedUpdate = await request(app)
        .patch(`/api/v1/member/projects/${projectId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ title: 'Hacked by User B' });

      expect(hackedUpdate.status).toBe(403);
      expect(hackedUpdate.body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin to modify or archive any project', async () => {
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Project For Admin Archive',
          shortDescription: 'Testing admin override on project management.',
          description: 'Testing admin override on project lifecycle operations.',
          categoryId: 'pcat-3',
        });

      const projectId = createRes.body.data.id;

      // Admin archives it
      const archRes = await request(app)
        .post(`/api/v1/member/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(archRes.status).toBe(200);
      expect(archRes.body.data.status).toBe('archived');
    });
  });

  // ============================================================================
  // 6. Contributors, Links & Media
  // ============================================================================
  describe('6. Contributors, Links & Media Management', () => {
    it('adds active member contributor and prevents duplicate contributor (409)', async () => {
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Collaborative Robotics Fleet',
          shortDescription: 'Multi-agent pathfinding for mobile robots.',
          description: 'Decentralized consensus algorithms tested on physical ground robots.',
          categoryId: 'pcat-4',
        });

      const projectId = createRes.body.data.id;

      // Add admin as a contributor
      const addRes = await request(app)
        .post(`/api/v1/member/projects/${projectId}/contributors`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ userId: 'admin-user-id', role: 'Hardware Lead' });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.contributors.some((c: any) => c.userId === 'admin-user-id')).toBe(true);

      // Attempt duplicate addition -> 409
      const dupRes = await request(app)
        .post(`/api/v1/member/projects/${projectId}/contributors`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ userId: 'admin-user-id', role: 'Hardware Lead' });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('CONTRIBUTOR_EXISTS');
    });

    it('adds and deletes links with strict URL scheme validation', async () => {
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Bio-Signal Audio Analyzer',
          shortDescription: 'Acoustic anomaly detection using spectrograms.',
          description: 'Edge-deployed audio classification system with low latency.',
          categoryId: 'pcat-5',
        });

      const projectId = createRes.body.data.id;

      // Add valid GitHub link
      const linkRes = await request(app)
        .post(`/api/v1/member/projects/${projectId}/links`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          label: 'Source Code',
          url: 'https://github.com/aiclub/bio-signal',
          linkType: 'github',
        });

      expect(linkRes.status).toBe(201);
      expect(linkRes.body.data.url).toBe('https://github.com/aiclub/bio-signal');

      // Delete link
      const delLink = await request(app)
        .delete(`/api/v1/member/projects/${projectId}/links/${linkRes.body.data.id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(delLink.status).toBe(200);
    });

    it('rejects links without http/https protocol', async () => {
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Link Test Project',
          shortDescription: 'Verifying protocol scheme enforcement.',
          description: 'Testing that only valid URLs are accepted by validation.',
          categoryId: 'pcat-1',
        });

      const projectId = createRes.body.data.id;

      const badLinkRes = await request(app)
        .post(`/api/v1/member/projects/${projectId}/links`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          label: 'Malicious Protocol',
          url: 'javascript:alert(1)',
          linkType: 'demo',
        });

      expect(badLinkRes.status).toBe(400);
    });
  });

  // ============================================================================
  // 7. Community Reporting Engine
  // ============================================================================
  describe('7. Community Reporting & Moderation', () => {
    it('allows member to report a project and rejects duplicate pending reports (409)', async () => {
      // Create project by Member
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Reportable Project',
          shortDescription: 'Under suspicion of containing copied assets.',
          description: 'Investigating potential community code of conduct issues.',
          categoryId: 'pcat-1',
        });

      const projectId = createRes.body.data.id;

      // User B reports Member's project
      const repRes = await request(app)
        .post('/api/v1/projects/report')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          targetType: 'project',
          targetId: projectId,
          reason: 'copyright',
          description: 'This repository contains copyrighted dataset code from another team.',
        });

      expect(repRes.status).toBe(201);
      expect(repRes.body.data.status).toBe('open');

      // User B tries to submit a second report on the same project -> 409
      const dupRep = await request(app)
        .post('/api/v1/projects/report')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          targetType: 'project',
          targetId: projectId,
          reason: 'spam',
          description: 'Submitting duplicate report.',
        });

      expect(dupRep.status).toBe(409);
      expect(dupRep.body.error.code).toBe('REPORT_ALREADY_PENDING');

      // Admin resolves the report
      const resolveRes = await request(app)
        .post(`/api/v1/admin/projects/reports/${repRes.body.data.id}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          adminNotes: 'Reviewed codebase and resolved copyright claim with original authors.',
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.status).toBe('resolved');
    });

    it('prevents owner from reporting their own project (400)', async () => {
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Self-Report Test Project',
          shortDescription: 'Verifying that owners cannot report themselves.',
          description: 'Ensuring strict business invariant that users cannot spam self-reports.',
          categoryId: 'pcat-1',
        });

      const projectId = createRes.body.data.id;

      const selfReport = await request(app)
        .post('/api/v1/projects/report')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          targetType: 'project',
          targetId: projectId,
          reason: 'spam',
          description: 'Attempting to self report.',
        });

      expect(selfReport.status).toBe(400);
      expect(selfReport.body.error.code).toBe('CANNOT_REPORT_SELF');
    });
  });

  // ============================================================================
  // 8. Admin Moderation: Hide, Restore & Feature
  // ============================================================================
  describe('8. Admin Moderation & Featuring', () => {
    it('admin can hide inappropriate project, preventing owner edits and public views', async () => {
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Inappropriate Content Project',
          shortDescription: 'Project violating content policies.',
          description: 'Violating project description for moderation testing.',
          categoryId: 'pcat-1',
        });

      const projectId = createRes.body.data.id;
      const slug = createRes.body.data.slug;

      // Publish it
      await request(app)
        .post(`/api/v1/member/projects/${projectId}/publish`)
        .set('Authorization', `Bearer ${memberToken}`);

      // Admin hides project
      const hideRes = await request(app)
        .post(`/api/v1/admin/projects/${projectId}/hide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Violates community guidelines section 4' });

      expect(hideRes.status).toBe(200);
      expect(hideRes.body.data.status).toBe('hidden');

      // Public view returns 404
      const publicView = await request(app).get(`/api/v1/projects/detail/${slug}`);
      expect(publicView.status).toBe(404);

      // Owner trying to edit hidden project gets 403 PROJECT_HIDDEN
      const editAttempt = await request(app)
        .patch(`/api/v1/member/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Attempted Title Edit' });

      expect(editAttempt.status).toBe(403);
      expect(editAttempt.body.error.code).toBe('PROJECT_HIDDEN');

      // Admin restores project
      const restoreRes = await request(app)
        .post(`/api/v1/admin/projects/${projectId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.status).toBe('published');
    });

    it('admin can feature published project and order it first in discovery', async () => {
      const createRes = await request(app)
        .post('/api/v1/member/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Flagship AI Club Showcase Project',
          shortDescription: 'State of the art multimodal vision transformer.',
          description: 'Extensive benchmark suite running across dozens of image datasets.',
          categoryId: 'pcat-1',
        });

      const projectId = createRes.body.data.id;

      await request(app)
        .post(`/api/v1/member/projects/${projectId}/publish`)
        .set('Authorization', `Bearer ${memberToken}`);

      // Feature project
      const featRes = await request(app)
        .post(`/api/v1/admin/projects/${projectId}/feature`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ position: 1 });

      expect(featRes.status).toBe(200);

      // Query discovery -> should have isFeatured = true
      const catRes = await request(app).get('/api/v1/projects');
      const found = catRes.body.data.items.find((p: any) => p.id === projectId);
      expect(found).toBeDefined();
      expect(found.isFeatured).toBe(true);

      // Admin unfeatures
      const unfeatRes = await request(app)
        .delete(`/api/v1/admin/projects/${projectId}/feature`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unfeatRes.status).toBe(200);
    });
  });

  // ============================================================================
  // 9. Achievements Management
  // ============================================================================
  describe('9. Member Achievements Platform', () => {
    it('active member can publish achievement and retrieve personal list', async () => {
      const payload = {
        categoryId: 'acat-1',
        title: 'TensorFlow Certified Developer',
        description: 'Demonstrated proficiency in building and training neural networks with TensorFlow.',
        issuer: 'Google Developers Certification',
        issuedAt: '2026-05-15',
        credentialUrl: 'https://credentials.google.com/cert/12345',
        credentialId: 'TF-CERT-9876',
      };

      const res = await request(app)
        .post('/api/v1/member/achievements')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.status).toBe('published');

      // Member retrieves their achievements
      const listRes = await request(app)
        .get('/api/v1/member/achievements')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(listRes.body.data[0].title).toBe(payload.title);

      // Public achievements query returns it
      const pubRes = await request(app).get('/api/v1/achievements');
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.some((a: any) => a.title === payload.title)).toBe(true);
    });
  });
});
