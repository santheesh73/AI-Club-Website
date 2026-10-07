import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EventCard } from '@/features/events/EventCard';
import { EventPublishModal } from '@/features/events/EventPublishModal';
import { EventCancelModal } from '@/features/events/EventCancelModal';
import type { MemberEventCardDto } from '@/types/events';

const mockEvent: MemberEventCardDto = {
  id: 'evt-test-101',
  title: 'Advanced LLM Fine-Tuning Workshop',
  slug: 'advanced-llm-fine-tuning-workshop',
  shortDescription: 'Hands-on practical training on parameter-efficient fine-tuning with LoRA.',
  description: 'Deep dive into parameter-efficient fine-tuning (PEFT), LoRA and QLoRA on open-source LLMs using HuggingFace and PyTorch.',
  category: 'workshop',
  eventMode: 'physical',
  location: 'Hall 4, Technology Block',
  isOnline: false,
  meetingUrl: null,
  coverImageUrl: null,
  startAt: '2026-11-15T10:00:00Z',
  endAt: '2026-11-15T13:00:00Z',
  registrationOpenAt: '2026-10-01T00:00:00Z',
  registrationCloseAt: '2026-11-14T23:59:59Z',
  capacity: 40,
  eligibility: 'members_only',
  status: 'published',
  speaker: 'Dr. Jane Smith',
  organizer: 'AI Club Research Division',
  requirements: 'Bring a laptop with Python 3.10+ and CUDA support or Google Colab account.',
  tags: ['LLM', 'FineTuning', 'PyTorch'],
  createdBy: 'admin-01',
  publishedAt: '2026-10-01T00:00:00Z',
  cancelledAt: null,
  cancellationReason: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  registeredCount: 38,
  availableSeats: 2,
  isFull: false,
  isRegistered: false,
};

describe('AI CLUB Milestone 6: Events & Activities Platform Frontend Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('EventCard Component', () => {
    it('renders event details, capacity info, and navigation button correctly', () => {
      render(
        <BrowserRouter>
          <EventCard event={mockEvent} />
        </BrowserRouter>
      );

      expect(screen.getByText('Advanced LLM Fine-Tuning Workshop')).toBeInTheDocument();
      expect(screen.getByText(/Hands-on practical training on parameter-efficient fine-tuning/i)).toBeInTheDocument();
      expect(screen.getByText('workshop')).toBeInTheDocument();
      expect(screen.getByText('Hall 4, Technology Block')).toBeInTheDocument();
      expect(screen.getByText('2 seats left')).toBeInTheDocument();
      expect(screen.getByText('40 Max')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view event/i })).toBeInTheDocument();
    });

    it('displays registration badge when member is registered', () => {
      const registeredEvent: MemberEventCardDto = {
        ...mockEvent,
        isRegistered: true,
      };

      render(
        <BrowserRouter>
          <EventCard event={registeredEvent} />
        </BrowserRouter>
      );

      expect(screen.getByText('Registered')).toBeInTheDocument();
    });

    it('indicates when event capacity is full', () => {
      const fullEvent: MemberEventCardDto = {
        ...mockEvent,
        registeredCount: 40,
        availableSeats: 0,
        isFull: true,
      };

      render(
        <BrowserRouter>
          <EventCard event={fullEvent} />
        </BrowserRouter>
      );

      expect(screen.getByText('Event Full')).toBeInTheDocument();
    });
  });

  describe('EventPublishModal Component', () => {
    it('renders event title and calls onConfirm when publish is submitted', () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <EventPublishModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          eventTitle="Autonomous Agents Hackathon"
          isSubmitting={false}
        />
      );

      expect(screen.getByText(/Publish Event/i)).toBeInTheDocument();
      expect(screen.getByText(/Autonomous Agents Hackathon/i)).toBeInTheDocument();

      const publishBtn = screen.getByRole('button', { name: /confirm & publish/i });
      fireEvent.click(publishBtn);

      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables actions while publication request is pending', () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      render(
        <EventPublishModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          eventTitle="Autonomous Agents Hackathon"
          isSubmitting={true}
        />
      );

      const publishBtn = screen.getByRole('button', { name: /publishing\.\.\./i });
      expect(publishBtn).toBeDisabled();
    });
  });

  describe('EventCancelModal Component', () => {
    it('validates reason entry before triggering cancellation', () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <EventCancelModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          eventTitle="Reinforcement Learning Bootcamp"
          isSubmitting={false}
        />
      );

      expect(screen.getByText(/Cancel Event/i)).toBeInTheDocument();
      expect(screen.getByText(/Reinforcement Learning Bootcamp/i)).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /confirm cancellation/i });
      // Initially button should be disabled because reason is empty
      expect(cancelBtn).toBeDisabled();

      const textarea = screen.getByPlaceholderText(/speaker scheduling conflict/i);
      fireEvent.change(textarea, { target: { value: 'Speaker travel disruption requires rescheduling' } });

      expect(cancelBtn).not.toBeDisabled();
      fireEvent.click(cancelBtn);

      expect(handleConfirm).toHaveBeenCalledWith('Speaker travel disruption requires rescheduling');
    });
  });
});
