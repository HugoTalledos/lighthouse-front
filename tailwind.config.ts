import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts}',
    './components/**/*.{vue,ts}',
    './pages/**/*.{vue,ts}',
    './layouts/**/*.{vue,ts}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0D1117',
        surface: '#1C2B3A',
        elevated: '#2E4460',
        signal: '#3B7DD8',
        'signal-dim': 'rgba(59,125,216,0.15)',
        'signal-mid': 'rgba(59,125,216,0.35)',
        'text-primary': '#F0F6FF',
        'text-secondary': '#8FA8C8',
        'text-muted': '#4D6B8A',
      },
      fontFamily: {
        display: ['"DM Mono"', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      borderRadius: {
        'sm': '6px',
        DEFAULT: '10px',
        'lg': '16px',
        'xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'signal': '0 0 0 1px rgba(59,125,216,0.15)',
        'signal-hover': '0 0 0 1px rgba(59,125,216,0.35)',
        'card': '0 1px 3px rgba(13,17,23,0.4), 0 0 0 1px rgba(59,125,216,0.10)',
      },
      animation: {
        'typing-dot': 'typingDot 1.4s ease-in-out infinite',
        'cursor-blink': 'cursorBlink 1s step-end infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        typingDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-6px)', opacity: '1' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
