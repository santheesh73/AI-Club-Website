import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FAF9F5', // warm ivory base canvas
          alt: '#F4F3ED',     // slightly darker warm neutral
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F4EE',
          elevated: '#FFFFFF',
          border: '#E8E6DF',
          hover: '#F2F0E8',
        },
        ink: {
          DEFAULT: '#141413', // deep editorial black
          secondary: '#4D4C48',
          muted: '#73726E',
          faint: '#A09F9B',
        },
        accent: {
          green: {
            DEFAULT: '#10B981',
            subtle: '#E8F5E9',
            dark: '#065F46',
          },
          lavender: {
            DEFAULT: '#8B5CF6',
            subtle: '#F3E8FF',
            dark: '#5B21B6',
          },
          orange: {
            DEFAULT: '#F97316',
            subtle: '#FFF3E0',
            dark: '#9A3412',
          },
        },
      },
      borderRadius: {
        'card-sm': '0.875rem', // 14px
        'card': '1.25rem',     // 20px
        'card-lg': '1.5rem',   // 24px
        'card-xl': '2rem',     // 32px
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(20, 20, 19, 0.04), 0 8px 24px -4px rgba(20, 20, 19, 0.05)',
        'elevated': '0 4px 12px -2px rgba(20, 20, 19, 0.06), 0 16px 36px -4px rgba(20, 20, 19, 0.08)',
        'subtle': '0 1px 3px rgba(20, 20, 19, 0.03)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
};

export default config;
