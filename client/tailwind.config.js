/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'ui-sans-serif', 'system-ui'],
        serif:   ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'ui-monospace', 'monospace'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        // ── Primary Navy ─────────────────────────────────────────
        navy: {
          50:  '#EEF1F7',
          100: '#D5DCEC',
          200: '#ADBAD9',
          300: '#7A91BE',
          400: '#4D6EA3',
          500: '#2D4F85',
          600: '#172B4D',   // ← Primary Navy
          700: '#122240',
          800: '#0D1A30',
          900: '#081120',
        },
        // ── Orange Accent ─────────────────────────────────────────
        orange: {
          50:  '#FFF6E8',
          100: '#FEEAC5',
          200: '#FDD28A',
          300: '#FBB84F',
          400: '#F9A01E',
          500: '#F28C00',   // ← Accent Orange
          600: '#C97400',
          700: '#9F5C00',
          800: '#754400',
          900: '#4C2C00',
        },
        // ── Warm Background Scale ─────────────────────────────────
        cream:  '#FAF8F2',   // page background
        warm:   '#F4F0E8',   // secondary warm surface
        card:   '#FFFFFF',   // card surface
        border: '#E8E4DB',   // borders
        ink:    '#1A1A1A',   // primary text
        muted:  '#64655E',   // muted text
        subtle: '#9B9A94',   // very muted
        // ── Keep legacy aliases for compat ────────────────────────
        chalk:  '#FAF8F2',
        ledger: '#E8E4DB',
        // ── Semantic ─────────────────────────────────────────────
        success: { 50: '#F0FDF4', 500: '#22C55E', 700: '#15803D' },
        warning: { 50: '#FFFBEB', 500: '#F59E0B', 700: '#B45309' },
        error:   { 50: '#FEF2F2', 500: '#EF4444', 700: '#B91C1C' },
        info:    { 50: '#EFF6FF', 500: '#3B82F6', 700: '#1D4ED8' },
        // Status colors
        applied:     { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
        shortlisted: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
        selected:    { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
        rejected:    { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
        // ── Slate kept for utilities ──────────────────────────────
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Legacy amber shim
        amber: {
          50:  '#FFF6E8',
          100: '#FEEAC5',
          200: '#FDD28A',
          300: '#FBB84F',
          400: '#F9A01E',
          500: '#F28C00',
          600: '#C97400',
          700: '#9F5C00',
          800: '#754400',
          900: '#4C2C00',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)',
        'nav':     '0 1px 0 rgba(0,0,0,0.12)',
        'glow':    '0 0 0 3px rgba(242,140,0,0.2)',
      },
      transitionDuration: {
        '250': '250ms',
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease-out both',
        'fade-rise': 'fadeRise 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in': 'slideIn 0.25s ease-out both',
        'pulse-once': 'pulseOnce 0.6s ease-out both',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        fadeRise: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: 0, transform: 'translateX(-8px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        pulseOnce: {
          '0%':   { boxShadow: '0 0 0 0 rgba(242,140,0,0.4)' },
          '70%':  { boxShadow: '0 0 0 8px rgba(242,140,0,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(242,140,0,0)' },
        },
      },
    },
  },
  plugins: [],
};
