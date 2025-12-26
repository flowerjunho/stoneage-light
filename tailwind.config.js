/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-elevated': 'var(--bg-elevated)',

        // Text hierarchy
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',

        // Accent colors
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-soft': 'var(--accent-soft)',
        'accent-glow': 'var(--accent-glow)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',

        // Neon colors
        'neon-blue': 'var(--neon-blue)',
        'neon-purple': 'var(--neon-purple)',
        'neon-pink': 'var(--neon-pink)',
        'neon-cyan': 'var(--neon-cyan)',

        // Borders
        border: 'var(--border)',
        'border-light': 'var(--border-light)',
        'border-accent': 'var(--border-accent)',

        // Shadows
        shadow: 'var(--shadow)',

        // Element colors
        'element-earth': 'var(--element-earth)',
        'element-water': 'var(--element-water)',
        'element-fire': 'var(--element-fire)',
        'element-wind': 'var(--element-wind)',

        // Grade colors
        'grade-normal': 'var(--grade-normal)',
        'grade-rare': 'var(--grade-rare)',
        'grade-hero': 'var(--grade-hero)',

        // Glass
        'glass-bg': 'var(--glass-bg)',
        'glass-border': 'var(--glass-border)',
      },
      fontFamily: {
        display: ['Orbitron', 'Russo One', 'sans-serif'],
        body: ['Noto Sans KR', 'Rajdhani', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      screens: {
        xs: { max: '320px' },
        iphone16: { max: '430px' },
        sm: { max: '640px' },
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 20px var(--accent-glow)',
        'glow-lg': '0 0 40px var(--accent-glow)',
        'glow-xl': '0 0 60px var(--accent-glow)',
        neon: 'var(--accent-neon)',
        card: '0 4px 20px -4px var(--shadow)',
        'card-hover': '0 20px 40px -8px var(--shadow)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-left': 'slideInFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInFromRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        float: 'float 4s ease-in-out infinite',
        gradient: 'gradient-shift 3s ease infinite',
        glow: 'glow-pulse 2s ease-in-out infinite',
        'border-flow': 'border-flow 3s ease infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
