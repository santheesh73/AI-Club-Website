import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { notificationsService } from '../src/modules/notifications/notifications.service';
import { aiIntelligenceService } from '../src/modules/ai/ai.service';
import { eventsService } from '../src/modules/events/events.service';
import { coursesService } from '../src/modules/courses/courses.service';

describe('AI CLUB Milestone 9: Notifications, Analytics & AI Intelligence Platform Tests', () => {
  const adminHeaders = {
    authorization: 'Bearer admin-test-token',
  };

  const memberHeaders = {
    authorization: 'Bearer member-test-token',
  };

  const otherMemberHeaders = {
    authorization: 'Bearer user-b-token',
  };

  beforeEach(() => {
    notificationsService.resetLocalState();
    aiIntelligenceService.resetLocalState();
  });

  // ==========================================================================
  // 1. NOTIFICATIONS AUTHENTICATION & OWNERSHIP
  // ==========================================================================
  describe('1. Notifications Access & Ownership Guards', () => {
    it('rejects unauthenticated requests to notifications center with 401', async () => {
      const res = await request(app).get('/api/v1/member/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('allows authenticated member to retrieve their notifications and unread count', async () => {
      // Seed a notification for member-user-id
      await notificationsService.createNotification({
        userId: 'member-user-id',
        type: 'SYSTEM_ALERT',
        title: 'Platform Maintenance Notice',
        message: 'Scheduled infrastructure update on Sunday at 02:00 AM UTC.',
        actionUrl: null,
      });

      const listRes = await request(app)
        .get('/api/v1/member/notifications')
        .set(memberHeaders);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.total).toBe(1);
      expect(listRes.body.data.unreadCount).toBe(1);
      expect(listRes.body.data.notifications[0].title).toBe('Platform Maintenance Notice');

      const countRes = await request(app)
        .get('/api/v1/member/notifications/unread-count')
        .set(memberHeaders);

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.unreadCount).toBe(1);
    });

    it('prevents user from viewing or modifying another user notifications', async () => {
      // Create notification for member 1
      const notif = await notificationsService.createNotification({
        userId: 'member-user-id',
        type: 'MEMBERSHIP_ACTIVATED',
        title: 'Confidential Membership Credential',
        message: 'Your personal membership card is ready.',
      });

      // Member 2 tries to mark Member 1's notification as read
      const markRes = await request(app)
        .patch(`/api/v1/member/notifications/${notif!.id}/read`)
        .set(otherMemberHeaders);

      expect(markRes.status).toBe(403);
      expect(markRes.body.success).toBe(false);

      // Verify Member 2 notification list does NOT include Member 1's notification
      const listRes = await request(app)
        .get('/api/v1/member/notifications')
        .set(otherMemberHeaders);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.total).toBe(0);
    });
  });

  // ==========================================================================
  // 2. READ/UNREAD STATE LIFECYCLE
  // ==========================================================================
  describe('2. Notification Read State Lifecycle', () => {
    it('marks a notification as read and decrements unread count', async () => {
      const notif = await notificationsService.createNotification({
        userId: 'member-user-id',
        type: 'COURSE_ENROLLMENT_CONFIRMED',
        title: 'Course Enrolled',
        message: 'Welcome to Generative AI Course.',
      });

      expect(await notificationsService.getUnreadCount('member-user-id')).toBe(1);

      const res = await request(app)
        .patch(`/api/v1/member/notifications/${notif!.id}/read`)
        .set(memberHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readAt).not.toBeNull();

      const count = await notificationsService.getUnreadCount('member-user-id');
      expect(count).toBe(0);
    });

    it('marks all notifications as read in bulk', async () => {
      await notificationsService.createNotification({
        userId: 'member-user-id',
        type: 'SYSTEM_ALERT',
        title: 'Alert 1',
        message: 'Msg 1',
      });
      await notificationsService.createNotification({
        userId: 'member-user-id',
        type: 'SYSTEM_ALERT',
        title: 'Alert 2',
        message: 'Msg 2',
      });

      expect(await notificationsService.getUnreadCount('member-user-id')).toBe(2);

      const res = await request(app)
        .post('/api/v1/member/notifications/read-all')
        .set(memberHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBe(2);

      const count = await notificationsService.getUnreadCount('member-user-id');
      expect(count).toBe(0);
    });
  });

  // ==========================================================================
  // 3. NOTIFICATION PREFERENCES
  // ==========================================================================
  describe('3. Notification Preferences & Gating', () => {
    it('retrieves default notification preferences', async () => {
      const res = await request(app)
        .get('/api/v1/member/notifications/preferences')
        .set(memberHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.eventUpdates).toBe(true);
      expect(res.body.data.courseUpdates).toBe(true);
    });

    it('updates preferences and respects them for optional notifications', async () => {
      // Turn off event updates
      const patchRes = await request(app)
        .patch('/api/v1/member/notifications/preferences')
        .set(memberHeaders)
        .send({ eventUpdates: false });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.eventUpdates).toBe(false);

      // Attempt to dispatch an event notification - should be suppressed
      const suppressed = await notificationsService.createNotification({
        userId: 'member-user-id',
        type: 'EVENT_REMINDER',
        title: 'Event Reminder',
        message: 'Event starts in 1 hour',
      });
      expect(suppressed).toBeNull();

      // Critical notification (e.g. MEMBERSHIP_ACTIVATED) must NEVER be suppressed
      const critical = await notificationsService.createNotification({
        userId: 'member-user-id',
        type: 'MEMBERSHIP_ACTIVATED',
        title: 'Membership Activated',
        message: 'Welcome to AI CLUB',
      });
      expect(critical).not.toBeNull();
    });
  });

  // ==========================================================================
  // 4. ADMIN NOTIFICATIONS
  // ==========================================================================
  describe('4. Administrative Notifications', () => {
    it('denies non-admin members from accessing /api/v1/admin/notifications', async () => {
      const res = await request(app)
        .get('/api/v1/admin/notifications')
        .set(memberHeaders);

      expect(res.status).toBe(403);
    });

    it('allows admin to access administrative alert notifications', async () => {
      await notificationsService.createNotification({
        userId: 'admin-user-id',
        type: 'NEW_REPORT',
        title: 'New Community Report Filed',
        message: 'A member flagged a project for review.',
      });

      const res = await request(app)
        .get('/api/v1/admin/notifications')
        .set(adminHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.notifications[0].type).toBe('NEW_REPORT');
    });
  });

  // ==========================================================================
  // 5. PLATFORM ANALYTICS DASHBOARD
  // ==========================================================================
  describe('5. Platform Analytics Gating & Derivation', () => {
    it('denies non-admin members from accessing admin analytics overview', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set(memberHeaders);

      expect(res.status).toBe(403);
    });

    it('allows admin to retrieve authoritative platform overview metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/overview?period=30d')
        .set(adminHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('activeMembers');
      expect(res.body.data).toHaveProperty('publishedCourses');
      expect(res.body.data).toHaveProperty('publishedProjects');
    });

    it('returns subdomain analytics: memberships, applications, events, courses, community, engagement', async () => {
      const [memRes, appRes, evRes, crsRes, commRes, engRes] = await Promise.all([
        request(app).get('/api/v1/admin/analytics/memberships').set(adminHeaders),
        request(app).get('/api/v1/admin/analytics/applications').set(adminHeaders),
        request(app).get('/api/v1/admin/analytics/events').set(adminHeaders),
        request(app).get('/api/v1/admin/analytics/courses').set(adminHeaders),
        request(app).get('/api/v1/admin/analytics/community').set(adminHeaders),
        request(app).get('/api/v1/admin/analytics/engagement').set(adminHeaders),
      ]);

      expect(memRes.status).toBe(200);
      expect(memRes.body.data).toHaveProperty('activeMemberships');

      expect(appRes.status).toBe(200);
      expect(appRes.body.data).toHaveProperty('assessmentPassRate');
      expect(appRes.body.data).toHaveProperty('applicationApprovalRate');

      expect(evRes.status).toBe(200);
      expect(evRes.body.data).toHaveProperty('totalRegistrations');

      expect(crsRes.status).toBe(200);
      expect(crsRes.body.data).toHaveProperty('courseCompletionRate');

      expect(commRes.status).toBe(200);
      expect(commRes.body.data).toHaveProperty('publishedProjects');

      expect(engRes.status).toBe(200);
      expect(engRes.body.data).toHaveProperty('weeklyActivePercentage');
    });
  });

  // ==========================================================================
  // 6. MEMBER LEARNING & ACTIVITY ANALYTICS
  // ==========================================================================
  describe('6. Member Learning & Activity Analytics', () => {
    it('returns personal learning analytics for authenticated member', async () => {
      const res = await request(app)
        .get('/api/v1/member/analytics/learning')
        .set(memberHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('enrolledCoursesCount');
      expect(res.body.data).toHaveProperty('completedCoursesCount');
      expect(res.body.data).toHaveProperty('averageProgressPercentage');
    });

    it('returns personal activity timeline for member', async () => {
      const res = await request(app)
        .get('/api/v1/member/analytics/activity')
        .set(memberHeaders);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('title');
    });
  });

  // ==========================================================================
  // 7. AI INTELLIGENCE & ADVISORY INSIGHTS
  // ==========================================================================
  describe('7. AI Advisory Intelligence Layer', () => {
    it('denies non-admin from accessing AI insights', async () => {
      const res = await request(app)
        .get('/api/v1/admin/intelligence/insights')
        .set(memberHeaders);

      expect(res.status).toBe(403);
    });

    it('generates structured advisory insights with caching and recommendations', async () => {
      const res = await request(app)
        .post('/api/v1/admin/intelligence/generate')
        .set(adminHeaders)
        .send({ period: '30d', forceRefresh: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('platformOverview');
      expect(res.body.data).toHaveProperty('memberEngagement');
      expect(res.body.data).toHaveProperty('learningInsights');
      expect(res.body.data).toHaveProperty('eventInsights');
      expect(res.body.data).toHaveProperty('communityInsights');
      expect(Array.isArray(res.body.data.recommendations)).toBe(true);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    });

    it('returns cached insight on subsequent requests', async () => {
      const res1 = await request(app)
        .get('/api/v1/admin/intelligence/insights?period=30d')
        .set(adminHeaders);

      expect(res1.status).toBe(200);
      const firstId = res1.body.data.id;

      const res2 = await request(app)
        .get('/api/v1/admin/intelligence/insights?period=30d')
        .set(adminHeaders);

      expect(res2.status).toBe(200);
      expect(res2.body.data.id).toBe(firstId);
    });
  });
});
