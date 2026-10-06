/**
 * AI CLUB - Centralized Design Tokens
 * 
 * Strict single source of truth for the warm editorial design system.
 * Follows the visual guidelines:
 * - Canvas: Warm off-white / ivory
 * - Surfaces: Generous whitespace, subtle neutral borders, soft shadows
 * - Ink: High-contrast typography and deep black buttons
 * - Accents: Restrained green, muted lavender, soft orange
 */

export const tokens = {
  colors: {
    canvas: {
      default: '#FAF9F5',
      alt: '#F4F3ED',
    },
    surface: {
      default: '#FFFFFF',
      muted: '#F5F4EE',
      border: '#E8E6DF',
      hover: '#F2F0E8',
    },
    ink: {
      primary: '#141413',
      secondary: '#4D4C48',
      muted: '#73726E',
      faint: '#A09F9B',
      inverse: '#FAF9F5',
    },
    accent: {
      green: {
        default: '#10B981',
        subtle: '#E8F5E9',
        dark: '#065F46',
      },
      lavender: {
        default: '#8B5CF6',
        subtle: '#F3E8FF',
        dark: '#5B21B6',
      },
      orange: {
        default: '#F97316',
        subtle: '#FFF3E0',
        dark: '#9A3412',
      },
    },
  },
  radius: {
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    cardSm: '0.875rem',// 14px
    card: '1.25rem',   // 20px
    cardLg: '1.5rem',  // 24px
    cardXl: '2rem',    // 32px
    pill: '9999px',
  },
  shadows: {
    subtle: '0 1px 3px rgba(20, 20, 19, 0.03)',
    soft: '0 2px 8px -2px rgba(20, 20, 19, 0.04), 0 8px 24px -4px rgba(20, 20, 19, 0.05)',
    elevated: '0 4px 12px -2px rgba(20, 20, 19, 0.06), 0 16px 36px -4px rgba(20, 20, 19, 0.08)',
  },
  breakpoints: {
    xs: 375,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1440,
    '3xl': 1920,
  },
  transitions: {
    fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    normal: '250ms cubic-bezier(0.16, 1, 0.3, 1)',
    slow: '400ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type DesignTokens = typeof tokens;
