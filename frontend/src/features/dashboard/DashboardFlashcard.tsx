import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { FlashcardDto, FlashcardType } from '@/types/flashcard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import {
  Bell,
  Calendar,
  Award,
  Lightbulb,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface DashboardFlashcardProps {
  flashcards?: FlashcardDto[];
  isLoading?: boolean;
  className?: string;
  autoRotateInterval?: number; // default: 3000ms
}

/**
 * Returns icon and badge variant configuration for a normalized flashcard type.
 */
function getTypeConfig(type: FlashcardType) {
  switch (type) {
    case 'EVENT':
      return {
        icon: Calendar,
        badgeVariant: 'orange' as const,
        defaultBadge: 'Upcoming Event',
      };
    case 'ACHIEVEMENT':
      return {
        icon: Award,
        badgeVariant: 'success' as const,
        defaultBadge: 'Achievement Spotlight',
      };
    case 'PROJECT_IDEA':
      return {
        icon: Lightbulb,
        badgeVariant: 'neutral' as const,
        defaultBadge: 'Project Inspiration',
      };
    case 'IMPORTANT_UPDATE':
      return {
        icon: AlertCircle,
        badgeVariant: 'orange' as const,
        defaultBadge: 'Important Update',
      };
    case 'ANNOUNCEMENT':
    default:
      return {
        icon: Bell,
        badgeVariant: 'lavender' as const,
        defaultBadge: 'Club Announcement',
      };
  }
}

export const DashboardFlashcard: React.FC<DashboardFlashcardProps> = ({
  flashcards = [],
  isLoading = false,
  className,
  autoRotateInterval = 3000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Timer ref to prevent orphaned or competing intervals
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch gesture refs for mobile horizontal swipe
  const touchStartCoords = useRef<{ x: number; y: number } | null>(null);
  const touchEndCoords = useRef<{ x: number; y: number } | null>(null);

  const totalCards = flashcards.length;

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Listen to document visibility change to stop timer when tab is hidden
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Keep index within bounds if cards length changes
  useEffect(() => {
    if (totalCards > 0 && currentIndex >= totalCards) {
      setCurrentIndex(0);
    }
  }, [totalCards, currentIndex]);

  const goToNext = useCallback(() => {
    if (totalCards <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalCards);
  }, [totalCards]);

  const goToPrev = useCallback(() => {
    if (totalCards <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
  }, [totalCards]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalCards) {
        setCurrentIndex(index);
      }
    },
    [totalCards]
  );

  // Determine whether rotation should be active
  const isPaused =
    isHovered ||
    isFocused ||
    isManuallyPaused ||
    isTabHidden ||
    prefersReducedMotion ||
    totalCards <= 1;

  // Single controlled setTimeout loop that runs only when unpaused and cleans up properly
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isPaused || isLoading || totalCards <= 1) {
      return;
    }

    timerRef.current = setTimeout(() => {
      goToNext();
    }, autoRotateInterval);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, isPaused, isLoading, totalCards, autoRotateInterval, goToNext]);

  // User manual controls reset the timer
  const handleManualNext = () => {
    goToNext();
  };

  const handleManualPrev = () => {
    goToPrev();
  };

  const handleManualSelect = (index: number) => {
    goToIndex(index);
  };

  const toggleManualPause = () => {
    setIsManuallyPaused((prev) => !prev);
  };

  // Keyboard navigation within carousel container
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleManualNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleManualPrev();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      // Toggle pause/play on Space when focused on the carousel
      e.preventDefault();
      toggleManualPause();
    }
  };

  // Mobile horizontal swipe gestures (without preventing vertical scrolling)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartCoords.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      touchEndCoords.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchEndCoords.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartCoords.current || !touchEndCoords.current) return;

    const deltaX = touchEndCoords.current.x - touchStartCoords.current.x;
    const deltaY = touchEndCoords.current.y - touchStartCoords.current.y;

    // Minimum swipe threshold: 50px, and horizontal distance must dominate vertical
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        // Swiped left -> next
        handleManualNext();
      } else {
        // Swiped right -> prev
        handleManualPrev();
      }
    }

    touchStartCoords.current = null;
    touchEndCoords.current = null;
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div
        className={cn(
          'p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4',
          className
        )}
        aria-busy="true"
        aria-label="Loading member highlights"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded-pill" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-9 w-28 rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-2.5 w-6 rounded-pill" />
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty State (No fake cards, editorial empty state)
  if (!flashcards || flashcards.length === 0) {
    return (
      <div
        className={cn(
          'p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border/80 shadow-soft text-center space-y-2.5',
          className
        )}
        role="region"
        aria-label="Member spotlight highlights"
      >
        <div className="inline-flex p-2.5 rounded-full bg-surface-muted text-ink-muted mb-1">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-ink">No new updates right now</h3>
        <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
          Check back regularly for announcements, upcoming club events, project inspiration, and member achievement spotlights.
        </p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const typeConfig = getTypeConfig(currentCard.sourceType);
  const TypeIcon = typeConfig.icon;

  // Format date helper if available
  const formattedDate = currentCard.publishedAt
    ? new Date(currentCard.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <section
      className={cn(
        'group relative overflow-hidden rounded-card-lg bg-surface border border-surface-border shadow-soft transition-all duration-300 hover:border-ink/20 focus-within:ring-2 focus-within:ring-ink focus-within:ring-offset-2',
        className
      )}
      role="region"
      aria-roledescription="carousel"
      aria-label="Member dashboard highlights"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Editorial Spotlight Card Interior */}
      <div className="p-6 sm:p-8 space-y-4">
        {/* Top Header: Badge, Source Meta, and Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={typeConfig.badgeVariant} className="flex items-center gap-1.5 py-1 px-3">
              <TypeIcon className="h-3 w-3" />
              <span>{currentCard.badgeText || typeConfig.defaultBadge}</span>
            </Badge>

            {formattedDate && (
              <span className="text-[11px] font-mono text-ink-muted">
                {formattedDate}
              </span>
            )}
          </div>

          {/* Quick Carousel Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Pause / Play Accessible Toggle */}
            {totalCards > 1 && (
              <button
                type="button"
                onClick={toggleManualPause}
                className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors focus:outline-none focus:ring-1 focus:ring-ink"
                aria-label={
                  isManuallyPaused
                    ? 'Resume automatic highlight rotation'
                    : 'Pause automatic highlight rotation'
                }
                title={isManuallyPaused ? 'Play' : 'Pause'}
              >
                {isManuallyPaused ? (
                  <Play className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {/* Previous Button */}
            {totalCards > 1 && (
              <button
                type="button"
                onClick={handleManualPrev}
                className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors focus:outline-none focus:ring-1 focus:ring-ink"
                aria-label="Previous highlight"
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {/* Next Button */}
            {totalCards > 1 && (
              <button
                type="button"
                onClick={handleManualNext}
                className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors focus:outline-none focus:ring-1 focus:ring-ink"
                aria-label="Next highlight"
                title="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area with Restrained Transition */}
        <div
          className={cn(
            'space-y-2 min-h-[5.5rem] transition-opacity duration-300',
            prefersReducedMotion ? 'transition-none' : 'ease-out'
          )}
          aria-live="off"
        >
          <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight line-clamp-2">
            {currentCard.title}
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed line-clamp-3">
            {currentCard.description}
          </p>
        </div>

        {/* Footer: Action Button & Dot Indicators */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-surface-border/50">
          <div>
            {currentCard.actionUrl && currentCard.actionLabel ? (
              currentCard.actionUrl.startsWith('http') ? (
                <a
                  href={currentCard.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button variant="secondary" size="sm" className="group/btn text-xs font-medium">
                    <span>{currentCard.actionLabel}</span>
                    <ArrowRight className="h-3 w-3 ml-1.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </Button>
                </a>
              ) : (
                <Link to={currentCard.actionUrl} className="inline-block">
                  <Button variant="secondary" size="sm" className="group/btn text-xs font-medium">
                    <span>{currentCard.actionLabel}</span>
                    <ArrowRight className="h-3 w-3 ml-1.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </Button>
                </Link>
              )
            ) : null}
          </div>

          {/* Dot Pagination Indicators */}
          {totalCards > 1 && (
            <div
              className="flex items-center gap-1.5 justify-center sm:justify-end"
              role="tablist"
              aria-label="Highlight pagination"
            >
              {flashcards.map((card, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={card.id || `dot-${idx}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to highlight ${idx + 1} of ${totalCards}: ${card.title}`}
                    onClick={() => handleManualSelect(idx)}
                    className={cn(
                      'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1 rounded-pill',
                      isActive
                        ? 'w-6 h-2 bg-ink'
                        : 'w-2 h-2 bg-surface-border hover:bg-ink-muted/60'
                    )}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
