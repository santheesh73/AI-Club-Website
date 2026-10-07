import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationItemCard } from '@/features/notifications/NotificationItemCard';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { MetricCard } from '@/features/analytics/MetricCard';
import { AnalyticsChartCard } from '@/features/analytics/AnalyticsChartCard';
import { MemberNotificationsPage } from '@/pages/member/MemberNotificationsPage';
import { AdminIntelligencePage } from '@/pages/admin/AdminIntelligencePage';
import { intelligenceApi } from '@/services/intelligenceApi';
import type { NotificationItem, AiInsight } from '@/types/intelligence';

const mockNotification: NotificationItem = {
  id: 'notif-test-1',
  userId: 'user-mem-1',
  type: 'EVENT_REGISTRATION_CONFIRMED',
  title: 'Registration Confirmed',
  message: 'You have been confirmed for the Generative AI Masterclass.',
  actionUrl: '/member/events/gen-ai-masterclass',
  readAt: null,
  createdAt: new Date().toISOString(),
};

const mockReadNotification: NotificationItem = {
  ...mockNotification,
  id: 'notif-test-2',
  title: 'Course Completed',
  message: 'Congratulations on completing Introduction to PyTorch!',
  type: 'COURSE_COMPLETED',
  readAt: new Date().toISOString(),
};

const mockInsight: AiInsight = {
  id: 'insight-test-1',
  period: '30d',
  summary: 'Platform momentum shows healthy active member participation and strong course completions.',
  platformOverview: 'Platform has 150 registered users and 45 active club members.',
  memberEngagement: 'Weekly engagement rate stands at 72%.',
  learningInsights: 'Introduction to PyTorch is the highest enrolled track with 85% completion rate.',
  eventInsights: 'Average attendance rate is 91% with low cancellation rate.',
  communityInsights: '12 active community projects published in showcase.',
  recommendations: [
    'Schedule weekend hands-on hackathons to sustain engagement.',
    'Publish advanced deep learning follow-up curriculum modules.',
  ],
  metricsSnapshot: {
    totalUsers: 150,
    activeMembers: 45,
  },
  createdAt: new Date().toISOString(),
};

describe('Milestone 9 - Intelligence & Notifications Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotificationItemCard', () => {
    it('renders unread notification with title, message, and mark read trigger', () => {
      const onMarkAsRead = vi.fn();
      render(
        <BrowserRouter>
          <NotificationItemCard
            notification={mockNotification}
            onMarkAsRead={onMarkAsRead}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Registration Confirmed')).toBeInTheDocument();
      expect(
        screen.getByText('You have been confirmed for the Generative AI Masterclass.')
      ).toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();

      const markReadBtn = screen.getByText('Mark read');
      expect(markReadBtn).toBeInTheDocument();
      fireEvent.click(markReadBtn);
      expect(onMarkAsRead).toHaveBeenCalledWith('notif-test-1');
    });

    it('renders read notification without mark read button', () => {
      render(
        <BrowserRouter>
          <NotificationItemCard notification={mockReadNotification} />
        </BrowserRouter>
      );

      expect(screen.getByText('Course Completed')).toBeInTheDocument();
      expect(screen.queryByText('Mark read')).not.toBeInTheDocument();
    });
  });

  describe('NotificationBell', () => {
    it('renders bell button and unread count badge', async () => {
      vi.spyOn(intelligenceApi, 'getUnreadCount').mockResolvedValue({
        success: true,
        data: { unreadCount: 3 },
      });
      vi.spyOn(intelligenceApi, 'getNotifications').mockResolvedValue({
        success: true,
        data: {
          notifications: [mockNotification],
          total: 1,
          unreadCount: 3,
        },
      });

      render(
        <BrowserRouter>
          <NotificationBell />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      // Click to toggle dropdown
      const button = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('View all notifications →')).toBeInTheDocument();
      });
    });
  });

  describe('MetricCard & AnalyticsChartCard', () => {
    it('renders MetricCard with label, value, and positive trend', () => {
      render(
        <MetricCard
          label="Active Members"
          value="45"
          subtext="Full privileges"
          trend={{ value: '+12%', isPositive: true }}
        />
      );

      expect(screen.getByText('Active Members')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Full privileges')).toBeInTheDocument();
      expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('renders AnalyticsChartCard with breakdown bars and values', () => {
      render(
        <AnalyticsChartCard
          title="Department Distribution"
          description="Members per department"
          items={[
            { label: 'Computer Science', value: 30, colorClass: 'bg-ink' },
            { label: 'Data Science', value: 15, colorClass: 'bg-accent-orange' },
          ]}
        />
      );

      expect(screen.getByText('Department Distribution')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('Data Science')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('MemberNotificationsPage', () => {
    it('loads and displays notifications tab', async () => {
      vi.spyOn(intelligenceApi, 'getNotifications').mockResolvedValue({
        success: true,
        data: {
          notifications: [mockNotification],
          total: 1,
          unreadCount: 1,
        },
      });
      vi.spyOn(intelligenceApi, 'getUnreadCount').mockResolvedValue({
        success: true,
        data: { unreadCount: 1 },
      });

      render(
        <BrowserRouter>
          <MemberNotificationsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Notification Center')).toBeInTheDocument();
        expect(screen.getByText('Registration Confirmed')).toBeInTheDocument();
      });
    });

    it('switches to preferences tab and displays delivery controls', async () => {
      vi.spyOn(intelligenceApi, 'getNotifications').mockResolvedValue({
        success: true,
        data: { notifications: [], total: 0, unreadCount: 0 },
      });
      vi.spyOn(intelligenceApi, 'getUnreadCount').mockResolvedValue({
        success: true,
        data: { unreadCount: 0 },
      });
      vi.spyOn(intelligenceApi, 'getPreferences').mockResolvedValue({
        success: true,
        data: {
          id: 'pref-1',
          userId: 'user-mem-1',
          applicationUpdates: true,
          membershipUpdates: true,
          eventUpdates: true,
          courseUpdates: true,
          communityUpdates: true,
          systemNotifications: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      render(
        <BrowserRouter>
          <MemberNotificationsPage />
        </BrowserRouter>
      );

      const prefTab = screen.getByRole('button', { name: /preferences/i });
      fireEvent.click(prefTab);

      await waitFor(() => {
        expect(screen.getByText('Delivery Preferences')).toBeInTheDocument();
        expect(screen.getByText('Application Updates')).toBeInTheDocument();
        expect(screen.getByText('Events & Workshops')).toBeInTheDocument();
        expect(screen.getByText('Save Preferences')).toBeInTheDocument();
      });
    });
  });

  describe('AdminIntelligencePage', () => {
    it('renders advisory banner, executive summary, recommendations, and domain cards', async () => {
      vi.spyOn(intelligenceApi, 'getAdminIntelligence').mockResolvedValue({
        success: true,
        data: mockInsight,
      });

      render(
        <BrowserRouter>
          <AdminIntelligencePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText('AI Platform Intelligence & Advisory')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Advisory Architecture & Privacy Guardrail Active/i)
        ).toBeInTheDocument();
        expect(screen.getByText('Platform Trajectory Summary')).toBeInTheDocument();
        expect(
          screen.getByText(/Platform momentum shows healthy active member participation/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText('Schedule weekend hands-on hackathons to sustain engagement.')
        ).toBeInTheDocument();
        expect(screen.getByText('Curriculum & Learning')).toBeInTheDocument();
      });
    });
  });
});
