import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { coursesService } from '../src/modules/courses/courses.service';
import { membershipService } from '../src/modules/membership/membership.service';
import { auditService } from '../src/modules/admin/audit.service';

describe('AI CLUB Milestone 7: Courses & Learning Management Platform Tests', () => {
  const adminToken = 'admin-test-token';
  const memberToken = 'member-test-token';
  const applicantToken = 'applicant-test-token';

  beforeEach(() => {
    coursesService.resetLocalState();
    membershipService.resetLocalState();
    auditService.resetLocalState();
  });

  // ============================================================================
  // 1. Authorization & Role Guards
  // ============================================================================
  describe('1. Route Authorization & Role Guards', () => {
    it('rejects unauthenticated requests to member courses (401)', async () => {
      const res = await request(app).get('/api/v1/member/courses');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects applicant/non-member access to member courses catalog (403)', async () => {
      const res = await request(app)
        .get('/api/v1/member/courses')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects non-admin access to admin course management routes (403)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/courses')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Unauthorized Course' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ============================================================================
  // 2. Categories Discovery
  // ============================================================================
  describe('2. Course Categories', () => {
    it('returns course categories without requiring authentication', async () => {
      await coursesService.createCategory({
        name: 'AI Engineering',
        slug: 'ai-engineering',
        description: 'Applied AI systems',
      });

      const res = await request(app).get('/api/v1/courses/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c: any) => c.slug === 'ai-engineering')).toBe(true);
    });
  });

  // ============================================================================
  // 3. Admin Course CRUD & Publication Lifecycle
  // ============================================================================
  describe('3. Admin Course CRUD & Publication Lifecycle', () => {
    let categoryId: string;

    beforeEach(async () => {
      const cat = await coursesService.createCategory({
        name: 'Deep Learning',
        slug: 'deep-learning',
      });
      categoryId = cat.id;
    });

    it('creates a new draft course with valid payload and slug generation', async () => {
      const res = await request(app)
        .post('/api/v1/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Deep Reinforcement Learning Masterclass',
          shortDescription: 'Comprehensive training on Policy Gradients, PPO, and Q-Learning.',
          description: 'A full-length deep dive into continuous action spaces and reward shaping.',
          categoryId,
          difficulty: 'advanced',
          estimatedDuration: 180,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Deep Reinforcement Learning Masterclass');
      expect(res.body.data.slug).toBe('deep-reinforcement-learning-masterclass');
      expect(res.body.data.status).toBe('draft');
    });

    it('rejects course creation with duplicate slug (409)', async () => {
      await coursesService.createCourse(
        {
          title: 'Computer Vision with PyTorch',
          slug: 'computer-vision-pytorch',
          shortDescription: 'Convolutional neural networks and vision transformers.',
          description: 'Detailed analysis of ViTs, ResNets, and segmentation models.',
          categoryId,
          difficulty: 'intermediate',
          estimatedDuration: 120,
        },
        'admin-user-id'
      );

      const res = await request(app)
        .post('/api/v1/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Computer Vision with PyTorch Alternate',
          slug: 'computer-vision-pytorch',
          shortDescription: 'Another vision course attempting duplicate slug.',
          description: 'Should fail with 409 conflict.',
          categoryId,
          difficulty: 'intermediate',
          estimatedDuration: 120,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('COURSE_SLUG_CONFLICT');
    });

    it('transitions course through draft -> published -> archived states', async () => {
      const course = await coursesService.createCourse(
        {
          title: 'Natural Language Processing',
          shortDescription: 'Transformers and attention mechanisms.',
          description: 'BERT, RoBERTa, and encoder-decoder systems.',
          categoryId,
          difficulty: 'beginner',
          estimatedDuration: 90,
        },
        'admin-user-id'
      );

      // Publish
      const pubRes = await request(app)
        .post(`/api/v1/admin/courses/${course.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('published');

      // Archive
      const archRes = await request(app)
        .post(`/api/v1/admin/courses/${course.id}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(archRes.status).toBe(200);
      expect(archRes.body.data.status).toBe('archived');

      // Unpublish back to draft
      const unpubRes = await request(app)
        .post(`/api/v1/admin/courses/${course.id}/unpublish`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(unpubRes.status).toBe(200);
      expect(unpubRes.body.data.status).toBe('draft');
    });
  });

  // ============================================================================
  // 4. Module & Lesson Structure Management & Ordering
  // ============================================================================
  describe('4. Course Modules & Lessons Structure', () => {
    let courseId: string;

    beforeEach(async () => {
      const cat = await coursesService.createCategory({
        name: 'Core AI',
        slug: 'core-ai',
      });
      const course = await coursesService.createCourse(
        {
          title: 'Neural Networks 101',
          shortDescription: 'Basic neural networks theory and practice.',
          description: 'Full course syllabus.',
          categoryId: cat.id,
          difficulty: 'beginner',
          estimatedDuration: 100,
        },
        'admin-user-id'
      );
      courseId = course.id;
    });

    it('allows admin to create modules and lessons with explicit positions', async () => {
      // Create Module
      const modRes = await request(app)
        .post(`/api/v1/admin/courses/${courseId}/modules`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Module 1: Perceptrons',
          description: 'Single-layer and multi-layer perceptrons.',
          position: 1,
        });

      expect(modRes.status).toBe(201);
      const moduleId = modRes.body.data.id;

      // Create Lesson
      const lsnRes = await request(app)
        .post(`/api/v1/admin/courses/modules/${moduleId}/lessons`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Linear Separability',
          description: 'Hyperplanes and the XOR problem.',
          content: '# Linear Separability\n\nPerceptrons cannot solve XOR without hidden layers.',
          duration: 15,
          position: 1,
          isPreview: true,
        });

      expect(lsnRes.status).toBe(201);
      expect(lsnRes.body.data.title).toBe('Linear Separability');
      expect(lsnRes.body.data.position).toBe(1);
      expect(lsnRes.body.data.isPreview).toBe(true);
    });

    it('prevents deletion of module containing lessons (integrity guard 409)', async () => {
      const mod = await coursesService.createModule(courseId, { title: 'Protected Module', position: 1 }, 'admin-user-id');
      await coursesService.createLesson(mod.id, { title: 'Active Lesson', content: 'content' }, 'admin-user-id');

      const delRes = await request(app)
        .delete(`/api/v1/admin/courses/modules/${mod.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(409);
      expect(delRes.body.error.code).toBe('MODULE_NOT_EMPTY');
    });

    it('allows reordering modules', async () => {
      const m1 = await coursesService.createModule(courseId, { title: 'Mod 1', position: 1 }, 'admin-user-id');
      const m2 = await coursesService.createModule(courseId, { title: 'Mod 2', position: 2 }, 'admin-user-id');

      const reorderRes = await request(app)
        .put(`/api/v1/admin/courses/${courseId}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            { id: m1.id, position: 2 },
            { id: m2.id, position: 1 },
          ],
        });

      expect(reorderRes.status).toBe(200);
      const modules = reorderRes.body.data;
      expect(modules[0].id).toBe(m2.id);
      expect(modules[1].id).toBe(m1.id);
    });
  });

  // ============================================================================
  // 5. Member Course Discovery & Catalog
  // ============================================================================
  describe('5. Member Discovery & Catalog Visibility', () => {
    beforeEach(async () => {
      const cat = await coursesService.createCategory({ name: 'Robotics', slug: 'robotics' });
      // 1 published course
      await coursesService.createCourse(
        {
          title: 'ROS 2 for Autonomous Navigation',
          shortDescription: 'Robot Operating System fundamentals.',
          description: 'Nodes, topics, services, actions.',
          categoryId: cat.id,
          difficulty: 'intermediate',
          estimatedDuration: 120,
          status: 'published',
        },
        'admin-user-id'
      );

      // 1 draft course
      await coursesService.createCourse(
        {
          title: 'Humanoid Kinematics',
          shortDescription: 'Inverse kinematics for bipedal motion.',
          description: 'Draft syllabus not yet ready for public.',
          categoryId: cat.id,
          difficulty: 'advanced',
          estimatedDuration: 180,
          status: 'draft',
        },
        'admin-user-id'
      );
    });

    it('displays only published courses to active members (drafts hidden)', async () => {
      const res = await request(app)
        .get('/api/v1/member/courses')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('ROS 2 for Autonomous Navigation');
    });

    it('returns course detail by slug with module and lesson outlines', async () => {
      const res = await request(app)
        .get('/api/v1/member/courses/ros-2-for-autonomous-navigation')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('ros-2-for-autonomous-navigation');
      expect(res.body.data.isEnrolled).toBe(false);
    });
  });

  // ============================================================================
  // 6. Member Enrollment Engine
  // ============================================================================
  describe('6. Member Enrollment Engine', () => {
    let publishedCourseId: string;
    let draftCourseId: string;

    beforeEach(async () => {
      const cat = await coursesService.createCategory({ name: 'Data', slug: 'data' });
      const pub = await coursesService.createCourse(
        {
          title: 'Big Data with Apache Spark',
          shortDescription: 'Distributed data pipelines.',
          description: 'RDDs, DataFrames, Spark SQL.',
          categoryId: cat.id,
          difficulty: 'intermediate',
          estimatedDuration: 140,
          status: 'published',
        },
        'admin-user-id'
      );
      publishedCourseId = pub.id;

      const drf = await coursesService.createCourse(
        {
          title: 'Kafka Streaming',
          shortDescription: 'Real-time pub/sub streams.',
          description: 'Brokers, topics, partitions.',
          categoryId: cat.id,
          difficulty: 'advanced',
          estimatedDuration: 90,
          status: 'draft',
        },
        'admin-user-id'
      );
      draftCourseId = drf.id;
    });

    it('allows active member to enroll in published course', async () => {
      const res = await request(app)
        .post(`/api/v1/member/courses/${publishedCourseId}/enroll`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.courseId).toBe(publishedCourseId);
      expect(res.body.data.status).toBe('active');
    });

    it('rejects duplicate enrollment in the same course (409 CONFLICT)', async () => {
      await coursesService.enrollMemberInCourse(publishedCourseId, 'member-user-id', 'member');

      const res = await request(app)
        .post(`/api/v1/member/courses/${publishedCourseId}/enroll`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_ENROLLED');
    });

    it('rejects enrollment in an unpublished draft course (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/member/courses/${draftCourseId}/enroll`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('COURSE_NOT_PUBLISHED');
    });
  });

  // ============================================================================
  // 7. Learning Workspace, Protected Content & Progress Engine
  // ============================================================================
  describe('7. Learning Workspace & Progress Engine', () => {
    let courseSlug: string;
    let previewLessonSlug: string;
    let protectedLessonSlug: string;
    let lesson1Id: string;
    let lesson2Id: string;

    beforeEach(async () => {
      const cat = await coursesService.createCategory({ name: 'ML', slug: 'ml' });
      const course = await coursesService.createCourse(
        {
          title: 'Machine Learning Fundamentals',
          slug: 'machine-learning-fundamentals',
          shortDescription: 'Linear regression, classification, clustering.',
          description: 'Core ML concepts.',
          categoryId: cat.id,
          difficulty: 'beginner',
          estimatedDuration: 100,
          status: 'published',
        },
        'admin-user-id'
      );
      courseSlug = course.slug;

      const mod = await coursesService.createModule(course.id, { title: 'Module 1', position: 1 }, 'admin-user-id');

      const l1 = await coursesService.createLesson(
        mod.id,
        {
          title: 'What is ML?',
          slug: 'what-is-ml',
          content: 'Free preview lesson on supervised vs unsupervised learning.',
          duration: 10,
          position: 1,
          isPreview: true,
        },
        'admin-user-id'
      );
      previewLessonSlug = l1.slug;
      lesson1Id = l1.id;

      const l2 = await coursesService.createLesson(
        mod.id,
        {
          title: 'Gradient Descent Deep Dive',
          slug: 'gradient-descent-deep-dive',
          content: 'Protected lesson: learning rates, momentum, Adam optimizer.',
          duration: 20,
          position: 2,
          isPreview: false,
        },
        'admin-user-id'
      );
      protectedLessonSlug = l2.slug;
      lesson2Id = l2.id;
    });

    it('allows reading preview lesson without enrollment', async () => {
      const res = await request(app)
        .get(`/api/v1/member/courses/${courseSlug}/lessons/${previewLessonSlug}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe(previewLessonSlug);
      expect(res.body.data.content).toContain('Free preview lesson');
    });

    it('blocks access to protected lesson if member is not enrolled (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/member/courses/${courseSlug}/lessons/${protectedLessonSlug}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ENROLLMENT_REQUIRED');
    });

    it('allows access to protected lesson once member is enrolled', async () => {
      const course = await coursesService.getCourseBySlug(courseSlug);
      await coursesService.enrollMemberInCourse(course!.id, 'member-user-id', 'member');

      const res = await request(app)
        .get(`/api/v1/member/courses/${courseSlug}/lessons/${protectedLessonSlug}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe(protectedLessonSlug);
      expect(res.body.data.content).toContain('Protected lesson');
    });

    it('completes lessons, updates progress percentage, and marks course completed when 100%', async () => {
      const course = await coursesService.getCourseBySlug(courseSlug);
      await coursesService.enrollMemberInCourse(course!.id, 'member-user-id', 'member');

      // Complete Lesson 1
      const res1 = await request(app)
        .post(`/api/v1/member/courses/lessons/${lesson1Id}/complete`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.completedLessons).toBe(1);
      expect(res1.body.data.totalLessons).toBe(2);
      expect(res1.body.data.percentage).toBe(50);
      expect(res1.body.data.status).toBe('active');
      expect(res1.body.data.resumeLesson.slug).toBe(protectedLessonSlug);

      // Complete Lesson 2 (Final Lesson)
      const res2 = await request(app)
        .post(`/api/v1/member/courses/lessons/${lesson2Id}/complete`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.completedLessons).toBe(2);
      expect(res2.body.data.percentage).toBe(100);
      expect(res2.body.data.status).toBe('completed');
      expect(res2.body.data.completedAt).not.toBeNull();
    });

    it('returns learning dashboard statistics for active member', async () => {
      const course = await coursesService.getCourseBySlug(courseSlug);
      await coursesService.enrollMemberInCourse(course!.id, 'member-user-id', 'member');
      await coursesService.completeLesson(lesson1Id, 'member-user-id');

      const res = await request(app)
        .get('/api/v1/member/courses/dashboard/stats')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enrolledCount).toBe(1);
      expect(res.body.data.totalLessonsCompleted).toBe(1);
      expect(res.body.data.continueLearning.courseSlug).toBe(courseSlug);
    });
  });

  // ============================================================================
  // 8. Admin Enrollment & Learner Progress Oversight
  // ============================================================================
  describe('8. Admin Enrollment Oversight & Learner Progress', () => {
    it('admin can inspect enrolled members and individual progress', async () => {
      const cat = await coursesService.createCategory({ name: 'AI', slug: 'ai' });
      const course = await coursesService.createCourse(
        {
          title: 'Advanced AI',
          shortDescription: 'AI for systems.',
          description: 'Long description.',
          categoryId: cat.id,
          difficulty: 'advanced',
          estimatedDuration: 120,
          status: 'published',
        },
        'admin-user-id'
      );

      const mod = await coursesService.createModule(course.id, { title: 'Mod 1', position: 1 }, 'admin-user-id');
      const lsn = await coursesService.createLesson(mod.id, { title: 'L1', content: 'test' }, 'admin-user-id');

      await coursesService.enrollMemberInCourse(course.id, 'member-user-id', 'member');
      await coursesService.completeLesson(lsn.id, 'member-user-id');

      const res = await request(app)
        .get(`/api/v1/admin/courses/${course.id}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].userId).toBe('member-user-id');
      expect(res.body.data[0].progressPercentage).toBe(100);
      expect(res.body.data[0].status).toBe('completed');
    });
  });
});
