import rtl from 'tailwindcss-rtl'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: '576px',
      'sm-max': { max: '576px' },
      md: '768px',
      'md-max': { max: '768px' },
      lg: '992px',
      'lg-max': { max: '992px' },
      xl: '1200px',
      'xl-max': { max: '1200px' },
      '2xl': '1320px',
      '2xl-max': { max: '1320px' },
      '3xl': '1600px',
      '3xl-max': { max: '1600px' },
      '4xl': '1850px',
      '4xl-max': { max: '1850px' },
    },
    extend: {
      colors: {
        meridian: {
          red: '#ef4444',
          crimson: '#dc2626',
          dark: '#0a0a0a',
          charcoal: '#111111',
          smoke: '#1a1a1a',
          panel: '#0f0f0f',
          border: 'rgba(255,255,255,0.08)',
        },
        lightPrimary: '#0f0f11',
        blueSecondary: '#dc2626',
        brandLinear: '#f87171',
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#f87171',
          400: '#ef4444',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        navy: {
          50: '#e8e8e8',
          100: '#d4d4d4',
          200: '#a3a3a3',
          300: '#737373',
          400: '#525252',
          500: '#404040',
          600: '#262626',
          700: '#1e1e2a',
          800: '#161622',
          900: '#08080c',
        },
        shadow: {
          500: 'rgba(0, 0, 0, 0.12)',
        },
        gray: {
          600: '#a3aed0',
          700: '#707eae',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        poppins: ['Poppins', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        'red-glow': '0 0 40px rgba(220,38,38,0.15)',
        panel:
          '0 8px 32px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.07)',
        'panel-hover': '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(220,38,38,0.15)',
        '3xl': '14px 17px 40px 4px',
        inset: 'inset 0px 18px 22px',
        darkinset: '0px 4px 4px inset',
      },
      borderRadius: {
        primary: '20px',
      },
      animation: {
        marquee: 'marquee 35s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [rtl],
}
