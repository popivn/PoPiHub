/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--kh-gold, #d4af37)',
        accent: 'var(--kh-accent, #e94560)',
        info: 'var(--kh-blue, #4a9eff)',
        success: 'var(--kh-success, #4ade80)',
        warning: 'var(--kh-warning, #fbbf24)',
        danger: 'var(--kh-danger, #ef4444)',
        secondary: 'var(--kh-text, #c8c8d8)',
        dim: 'var(--kh-text-dim, #8a8a9c)',
        bg: {
          DEFAULT: 'var(--kh-bg, #0a0a1a)',
          deep: 'var(--kh-bg-deep, #050510)',
          soft: 'var(--kh-bg-soft, #0d0d2a)',
        },
        surface: {
          DEFAULT: 'var(--kh-surface, rgba(20, 20, 40, 0.7))',
          strong: 'var(--kh-surface-strong, rgba(15, 15, 30, 0.92))',
        },
        border: 'var(--kh-border, rgba(212, 175, 55, 0.4))',
      },
    },
  },
  plugins: [],
}
