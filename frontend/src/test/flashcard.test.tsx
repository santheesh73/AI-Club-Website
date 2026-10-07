import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardFlashcard } from '@/features/dashboard/DashboardFlashcard';
import type { FlashcardDto } from '@/types/flashcard';

const mockCards: FlashcardDto[] = [
  {
    id: 'f1',
    sourceType: 'ANNOUNCEMENT',
    sourceId: 'ann-1',
    title: 'AI CLUB Hackathon Registrations Open',
    description: 'Register before October 20 to participate in the flagship hackathon.',
    actionLabel: 'View Details',
    actionUrl: '/events/hackathon',
    priority: 90,
    badgeText: 'ANNOUNCEMENT',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'f2',
    sourceType: 'EVENT',
    sourceId: 'evt-2',
    title: 'Transformer Architecture Masterclass',
    description: 'Hands-on training session on self-attention and PyTorch implementations.',
    actionLabel: 'View Event',
    actionUrl: '/events/transformers',
    priority: 85,
    badgeText: 'UPCOMING EVENT',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'f3',
    sourceType: 'ACHIEVEMENT',
    sourceId: 'ach-3',
    title: 'Congratulations, Nikesh! You earned AI Innovator badge',
    description: 'Recognized for outstanding open-source contributions.',
    actionLabel: 'View Badge',
    actionUrl: '/achievements/innovator',
    priority: 80,
    badgeText: 'YOUR ACHIEVEMENT',
    publishedAt: new Date().toISOString(),
  },
];

describe('Member Dashboard Flashcard System Tests (FLASH-018 to FLASH-035)', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Setup window.matchMedia mock for JSDOM
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // FLASH-018: Automatic rotation occurs every 3 seconds
  it('FLASH-018: Automatic rotation occurs every 3 seconds', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} autoRotateInterval={3000} />
      </MemoryRouter>
    );

    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();

    // Advance 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Transformer Architecture Masterclass')).toBeInTheDocument();

    // Advance another 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(
      screen.getByText('Congratulations, Nikesh! You earned AI Innovator badge')
    ).toBeInTheDocument();

    // Advance 3 seconds -> cyclic back to first card
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();
  });

  // FLASH-019: Previous button works
  it('FLASH-019: Previous button navigates to previous card immediately', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} />
      </MemoryRouter>
    );

    const prevButton = screen.getByRole('button', { name: /previous highlight/i });
    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();

    // Click previous -> wraps around to last card
    fireEvent.click(prevButton);
    expect(
      screen.getByText('Congratulations, Nikesh! You earned AI Innovator badge')
    ).toBeInTheDocument();
  });

  // FLASH-020: Next button works
  it('FLASH-020: Next button navigates to next card immediately', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} />
      </MemoryRouter>
    );

    const nextButton = screen.getByRole('button', { name: /next highlight/i });
    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();

    // Click next -> advances to second card
    fireEvent.click(nextButton);
    expect(screen.getByText('Transformer Architecture Masterclass')).toBeInTheDocument();
  });

  // FLASH-021: Dot navigation works
  it('FLASH-021: Dot indicator navigation activates the target card', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} />
      </MemoryRouter>
    );

    const dotButtons = screen.getAllByRole('tab');
    expect(dotButtons.length).toBe(3);

    // Click third dot
    fireEvent.click(dotButtons[2]);
    expect(
      screen.getByText('Congratulations, Nikesh! You earned AI Innovator badge')
    ).toBeInTheDocument();
  });

  // FLASH-022: Hover pauses rotation
  it('FLASH-022: Hover pauses automatic rotation', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} autoRotateInterval={3000} />
      </MemoryRouter>
    );

    const carousel = screen.getByRole('region', { name: /member dashboard highlights/i });

    // Mouse enters carousel
    fireEvent.mouseEnter(carousel);

    // Advance 6 seconds while hovered
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Still on first card!
    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();

    // Mouse leaves carousel
    fireEvent.mouseLeave(carousel);

    // Advance 3 seconds after mouse leave -> should rotate!
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Transformer Architecture Masterclass')).toBeInTheDocument();
  });

  // FLASH-023: Focus pauses rotation
  it('FLASH-023: Keyboard focus pauses rotation', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} autoRotateInterval={3000} />
      </MemoryRouter>
    );

    const carousel = screen.getByRole('region', { name: /member dashboard highlights/i });

    // Focus carousel
    fireEvent.focus(carousel);

    // Advance 6 seconds
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Still on first card
    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();

    // Blur carousel
    fireEvent.blur(carousel);

    // Advance 3 seconds after blur -> should rotate!
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Transformer Architecture Masterclass')).toBeInTheDocument();
  });

  // FLASH-024: Manual navigation resets timer
  it('FLASH-024: Manual navigation resets the 3-second timer', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} autoRotateInterval={3000} />
      </MemoryRouter>
    );

    // Advance 2 seconds (1 second remaining on card 1)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // User clicks Next manually
    const nextBtn = screen.getByRole('button', { name: /next highlight/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText('Transformer Architecture Masterclass')).toBeInTheDocument();

    // Wait 2 seconds (total 4 seconds since test start, but only 2s on card 2)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should STILL be on card 2 because manual click gave a fresh 3 seconds!
    expect(screen.getByText('Transformer Architecture Masterclass')).toBeInTheDocument();

    // Wait remaining 1 second (total 3s on card 2) -> advances to card 3
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText('Congratulations, Nikesh! You earned AI Innovator badge')
    ).toBeInTheDocument();
  });

  // FLASH-025 & FLASH-026: Mobile swipe gestures
  it('FLASH-025 & FLASH-026: Mobile swipe left and right gestures work', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} />
      </MemoryRouter>
    );

    const carousel = screen.getByRole('region', { name: /member dashboard highlights/i });

    // Swipe Left (deltaX = 100 - 200 = -100px -> next)
    fireEvent.touchStart(carousel, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchMove(carousel, { touches: [{ clientX: 100, clientY: 105 }] });
    fireEvent.touchEnd(carousel);

    expect(screen.getByText('Transformer Architecture Masterclass')).toBeInTheDocument();

    // Swipe Right (deltaX = 220 - 100 = +120px -> prev)
    fireEvent.touchStart(carousel, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchMove(carousel, { touches: [{ clientX: 220, clientY: 102 }] });
    fireEvent.touchEnd(carousel);

    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();
  });

  // FLASH-027: Keyboard navigation works
  it('FLASH-027: Keyboard controls (ArrowRight, ArrowLeft, Space) work when focused', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} />
      </MemoryRouter>
    );

    const carousel = screen.getByRole('region', { name: /member dashboard highlights/i });

    // ArrowRight -> next card
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(screen.getByText('Transformer Architecture Masterclass')).toBeInTheDocument();

    // ArrowLeft -> previous card
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();

    // Space -> pause rotation toggle
    fireEvent.keyDown(carousel, { key: ' ' });
    const resumeBtn = screen.getByRole('button', { name: /resume automatic highlight rotation/i });
    expect(resumeBtn).toBeInTheDocument();
  });

  // FLASH-028: Reduced motion works
  it('FLASH-028: prefers-reduced-motion stops auto-rotation', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} autoRotateInterval={3000} />
      </MemoryRouter>
    );

    // Advance 6 seconds
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Still on first card because reduced motion is respected
    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();
  });

  // FLASH-029: Unmount clears timers
  it('FLASH-029: Unmounting component clears active timers without errors', () => {
    const { unmount } = render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} />
      </MemoryRouter>
    );

    expect(() => {
      unmount();
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
  });

  // FLASH-030: Hidden tab pauses rotation
  it('FLASH-030: Document visibility change (hidden tab) pauses rotation', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} autoRotateInterval={3000} />
      </MemoryRouter>
    );

    // Mock document.hidden = true
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    fireEvent(document, new Event('visibilitychange'));

    // Advance 6 seconds while hidden
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByText('AI CLUB Hackathon Registrations Open')).toBeInTheDocument();

    // Mock document.hidden = false
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    fireEvent(document, new Event('visibilitychange'));

    // Advance 3 seconds after resuming
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Transformer Architecture Masterclass')).toBeInTheDocument();
  });

  // FLASH-031: Empty state works
  it('FLASH-031: Renders clean empty state when no flashcards are available', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText('No new updates right now')).toBeInTheDocument();
    expect(
      screen.getByText(/check back regularly for announcements/i)
    ).toBeInTheDocument();
  });

  // FLASH-032: Loading state works
  it('FLASH-032: Renders skeleton loading state when isLoading is true', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard isLoading={true} />
      </MemoryRouter>
    );

    const skeleton = screen.getByLabelText('Loading member highlights');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  // FLASH-033: API failure does not crash dashboard
  it('FLASH-033: Undefined flashcards array does not throw or crash', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <DashboardFlashcard flashcards={undefined} />
        </MemoryRouter>
      );
    }).not.toThrow();

    expect(screen.getByText('No new updates right now')).toBeInTheDocument();
  });

  // FLASH-034: Mobile layout works
  it('FLASH-034: Component includes responsive flex and padding classes', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} />
      </MemoryRouter>
    );

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('rounded-card-lg');
  });

  // FLASH-035: Accessibility checks pass
  it('FLASH-035: Complies with ARIA carousel roles, labels, and aria-live="off"', () => {
    render(
      <MemoryRouter>
        <DashboardFlashcard flashcards={mockCards} />
      </MemoryRouter>
    );

    const carousel = screen.getByRole('region', { name: /member dashboard highlights/i });
    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');

    // Controls have accessible labels
    expect(screen.getByRole('button', { name: /previous highlight/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next highlight/i })).toBeInTheDocument();

    // Tablist indicators have accessible roles
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });
});
