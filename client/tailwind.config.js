/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        // ── Primary Brand ─────────────────────────────────────────
        navy: {
          50:  'var(--navy-50)',
          100: 'var(--navy-100)',
          200: 'var(--navy-200)',
          300: 'var(--navy-300)',
          400: 'var(--navy-400)',
          500: 'var(--navy-500)',
          600: 'var(--navy-600)',
          700: 'var(--navy-700)',
          800: 'var(--navy-800)',
          900: 'var(--navy-900)',
        },
        orange: {
          50:  'var(--orange-50)',
          100: 'var(--orange-100)',
          200: 'var(--orange-200)',
          300: 'var(--orange-300)',
          400: 'var(--orange-400)',
          500: 'var(--orange-500)',
          600: 'var(--orange-600)',
          700: 'var(--orange-700)',
          800: 'var(--orange-800)',
          900: 'var(--orange-900)',
        },
        // ── Semantic Theme Colors ─────────────────────────────────
        cream:  'var(--bg-primary)',   // page background
        warm:   'var(--bg-secondary)', // secondary warm surface
        card:   'var(--bg-card)',      // card surface
        elevated: 'var(--bg-elevated)', // elevated surface
        border: 'var(--border-color)', // borders
        ink:    'var(--text-primary)', // primary text
        muted:  'var(--text-secondary)', // muted text
        subtle: 'var(--text-muted)',   // very muted text
        // ── Keep legacy aliases for compat ────────────────────────
        chalk:  'var(--bg-primary)',
        ledger: 'var(--border-color)',
        // ── Semantic ─────────────────────────────────────────────
        success: { 50: 'var(--success-50)', 500: '#22C55E', 700: '#15803D' },
        warning: { 50: 'var(--warning-50)', 500: '#F59E0B', 700: '#B45309' },
        error:   { 50: 'var(--error-50)', 500: '#EF4444', 700: '#B91C1C' },
        info:    { 50: 'var(--info-50)', 500: '#38BDF8', 700: '#0284C7' }, // Adjusted info color based on prompt
        
        // Slate kept for utilities
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
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        'card':    '0 1px 3px var(--shadow-sm), 0 1px 2px var(--shadow-xs)',
        'card-md': '0 4px 12px var(--shadow-md), 0 2px 4px var(--shadow-sm)',
        'card-lg': '0 8px 24px var(--shadow-lg), 0 4px 8px var(--shadow-md)',
        'nav':     '0 1px 0 var(--nav-border)',
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
