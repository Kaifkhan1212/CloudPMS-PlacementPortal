/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui'],
        serif:   ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'ui-monospace', 'monospace'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        // ── CSS-var-driven semantic palette ──────────────────────────
        // Backgrounds
        page:       'var(--bg-page)',
        surface:    'var(--bg-surface)',
        'surface-2':'var(--bg-surface-2)',
        input:      'var(--bg-input)',
        elevated:   'var(--bg-elevated)',
        // Borders
        border:     'var(--border)',
        'border-strong': 'var(--border-strong)',
        // Text
        text:       'var(--text)',
        'text-muted':  'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        // Accent
        accent:     'var(--accent)',
        // ── Legacy aliases (keep all existing code working) ───────────
        cream:      'var(--bg-page)',
        warm:       'var(--bg-surface-2)',
        card:       'var(--bg-surface)',
        ink:        'var(--text)',
        muted:      'var(--text-muted)',
        subtle:     'var(--text-subtle)',
        chalk:      'var(--bg-page)',
        ledger:     'var(--border)',
        // ── Brand (CSS-var mapped) ────────────────────────────────────
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
        // ── Semantic states ───────────────────────────────────────────
        success: {
          50:  'var(--success-bg)',
          500: 'var(--success-fill)',
          600: 'var(--success-fill)',
          700: 'var(--success-text)',
        },
        warning: {
          50:  'var(--warning-bg)',
          500: 'var(--warning-fill)',
          600: 'var(--warning-fill)',
          700: 'var(--warning-text)',
        },
        error: {
          50:  'var(--error-bg)',
          500: 'var(--error-fill)',
          600: 'var(--error-fill)',
          700: 'var(--error-text)',
        },
        info: {
          50:  'var(--info-bg)',
          500: 'var(--info-fill)',
          600: 'var(--info-fill)',
          700: 'var(--info-text)',
        },
        // Slate kept for utilities
        slate: {
          50:  '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderWidth: { 3: '3px' },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'card':    'var(--shadow-xs)',
        'card-md': 'var(--shadow-md)',
        'card-lg': 'var(--shadow-lg)',
        'nav':     'var(--nav-shadow)',
        'glow':    '0 0 0 3px rgba(249,115,22,0.2)',
      },
      transitionDuration: { '250': '250ms' },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out both',
        'fade-rise': 'fadeRise 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in':  'slideIn 0.25s ease-out both',
        'pulse-once':'pulseOnce 0.6s ease-out both',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeRise:  { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseOnce: {
          '0%':   { boxShadow: '0 0 0 0 rgba(249,115,22,0.4)' },
          '70%':  { boxShadow: '0 0 0 8px rgba(249,115,22,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0)' },
        },
      },
    },
  },
  plugins: [],
};
