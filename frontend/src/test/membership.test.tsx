import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ActivateMembershipModal } from '@/features/admin/ActivateMembershipModal';
import { MemberMembershipPage } from '@/pages/member/MemberMembershipPage';
import { MemberDashboard } from '@/pages/member/MemberDashboard';
import { MemberApplicationPage } from '@/pages/member/MemberApplicationPage';
import { MemberAssessmentPage } from '@/pages/member/MemberAssessmentPage';
import * as membershipHooks from '@/features/membership';
import type { MemberDashboardData } from '@/types/membership';

const mockDashboardData: MemberDashboardData = {
  profile: {
    id: 'user-m5-test-01',
    email: 'member.test@aiclub.internal',
    fullName: 'Nikesh Sundaram',
    role: 'member',
    department: 'Artificial Intelligence & Data Science',
    year: 3,
    section: 'A',
    registerNumber: 'REG-2026-9901',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-10-06T12:00:00Z',
    skills: ['PyTorch', 'TypeScript', 'FastAPI'],
    interests: ['Deep Learning', 'Computer Vision'],
  },
  membership: {
    id: 'mem-m5-test-01',
    userId: 'user-m5-test-01',
    applicationId: 'app-m5-test-01',
    memberNumber: 'AIC-2026-0042',
    status: 'active',
    joinedAt: '2026-10-06T12:00:00Z',
    activatedAt: '2026-10-06T12:00:00Z',
    activatedBy: 'admin-user-01',
    createdAt: '2026-10-06T12:00:00Z',
    updatedAt: '2026-10-06T12:00:00Z',
  },
  application: {
    id: 'app-m5-test-01',
    userId: 'user-m5-test-01',
    applicationNumber: 'AIC-2026-000042',
    academicYear: '2026-2027',
    status: 'approved',
    submittedAt: '2026-10-01T10:00:00Z',
    reviewedAt: '2026-10-06T11:30:00Z',
    reviewedBy: 'admin-user-01',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-06T11:30:00Z',
  },
  assessment: {
    id: 'attempt-m5-test-01',
    userId: 'user-m5-test-01',
    applicationId: 'app-m5-test-01',
    score: 23,
    percentage: 92,
    totalQuestions: 25,
    correctCount: 23,
    wrongCount: 2,
    unansweredCount: 0,
    durationSeconds: 1140,
    isPassed: true,
    submittedAt: '2026-10-02T15:30:00Z',
    createdAt: '2026-10-02T15:10:00Z',
  },
};

describe('AI CLUB Milestone 5: Membership & Member Experience Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ActivateMembershipModal', () => {
    it('renders candidate details, application number, and confirms activation', () => {
      const handleConfirm = vi.fn().mockResolvedValue(true);
      const handleClose = vi.fn();

      render(
        <ActivateMembershipModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          studentName="Nikesh Sundaram"
          applicationNumber="AIC-2026-000042"
          isSubmitting={false}
        />
      );

      expect(screen.getByText(/Activate Club Membership/i)).toBeInTheDocument();
      expect(screen.getByText(/Nikesh Sundaram/i)).toBeInTheDocument();
      expect(screen.getByText(/AIC-2026-000042/i)).toBeInTheDocument();

      const activateBtn = screen.getByRole('button', { name: /confirm activation/i });
      fireEvent.click(activateBtn);

      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables activation button when submission is in flight', () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      render(
        <ActivateMembershipModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          studentName="Nikesh Sundaram"
          applicationNumber="AIC-2026-000042"
          isSubmitting={true}
        />
      );

      const activateBtn = screen.getByRole('button', { name: /activating membership/i });
      expect(activateBtn).toBeDisabled();
    });
  });

  describe('MemberMembershipPage', () => {
    it('renders digital membership credential card and triggers print action', () => {
      vi.spyOn(membershipHooks, 'useMemberDashboard').mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <MemberMembershipPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/Official Membership/i)).toBeInTheDocument();
      expect(screen.getAllByText('AIC-2026-0042').length).toBeGreaterThan(0);
      expect(screen.getByText('Nikesh Sundaram')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();

      const printBtn = screen.getByRole('button', { name: /print \/ save card/i });
      fireEvent.click(printBtn);
      expect(printSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('MemberDashboard', () => {
    it('renders welcome banner, official member number, and entrance scorecard summary', () => {
      vi.spyOn(membershipHooks, 'useMemberDashboard').mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <BrowserRouter>
          <MemberDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText(/Welcome back, Nikesh Sundaram/i)).toBeInTheDocument();
      expect(screen.getAllByText('AIC-2026-0042').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Active Member/i).length).toBeGreaterThan(0);
      expect(screen.getByText('92%')).toBeInTheDocument();
    });
  });

  describe('MemberApplicationPage', () => {
    it('renders approved application record and application number', () => {
      vi.spyOn(membershipHooks, 'useMemberDashboard').mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <BrowserRouter>
          <MemberApplicationPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/Admissions Application History/i)).toBeInTheDocument();
      expect(screen.getByText('AIC-2026-000042')).toBeInTheDocument();
      expect(screen.getByText('2026-2027')).toBeInTheDocument();
    });
  });

  describe('MemberAssessmentPage', () => {
    it('renders official entrance examination scorecard with questions and score', () => {
      vi.spyOn(membershipHooks, 'useMemberDashboard').mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <BrowserRouter>
          <MemberAssessmentPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/Entrance Assessment Scorecard/i)).toBeInTheDocument();
      expect(screen.getByText(/92%/i)).toBeInTheDocument();
      expect(screen.getByText(/Authoritative Examination Record/i)).toBeInTheDocument();
    });
  });
});
