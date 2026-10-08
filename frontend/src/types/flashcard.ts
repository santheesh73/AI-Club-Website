/**
 * AI CLUB - Member Dashboard Flashcard System Types
 * Normalized contract for dynamic editorial spotlight cards
 */

export type FlashcardType =
  | 'ANNOUNCEMENT'
  | 'EVENT'
  | 'ACHIEVEMENT'
  | 'PROJECT_IDEA'
  | 'IMPORTANT_UPDATE';

export interface FlashcardDto {
  id: string;
  sourceType: FlashcardType;
  sourceId: string;
  title: string;
  description: string;
  imageUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: number;
  badgeText: string;
  publishedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}
