/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: {
            50: 'var(--brand-primary-50)',
            100: 'var(--brand-primary-100)',
            200: 'var(--brand-primary-200)',
            300: 'var(--brand-primary-300)',
            400: 'var(--brand-primary-400)',
            500: 'var(--brand-primary-500)',
            600: 'var(--brand-primary-600)',
            700: 'var(--brand-primary-700)',
            800: 'var(--brand-primary-800)',
            900: 'var(--brand-primary-900)',
            950: 'var(--brand-primary-950)',
          },
          neutral: {
            50: 'var(--brand-neutral-50)',
            100: 'var(--brand-neutral-100)',
            200: 'var(--brand-neutral-200)',
            300: 'var(--brand-neutral-300)',
            400: 'var(--brand-neutral-400)',
            500: 'var(--brand-neutral-500)',
            600: 'var(--brand-neutral-600)',
            700: 'var(--brand-neutral-700)',
            800: 'var(--brand-neutral-800)',
            900: 'var(--brand-neutral-900)',
            950: 'var(--brand-neutral-950)',
          },
          indigo: {
            500: 'var(--brand-indigo-500)',
            600: 'var(--brand-indigo-600)',
            700: 'var(--brand-indigo-700)',
            800: 'var(--brand-indigo-800)',
            900: 'var(--brand-indigo-900)',
          },
          purple: {
            500: 'var(--brand-purple-500)',
            600: 'var(--brand-purple-600)',
            700: 'var(--brand-purple-700)',
            800: 'var(--brand-purple-800)',
            900: 'var(--brand-purple-900)',
          },
          magenta: {
            500: 'var(--brand-magenta-500)',
            600: 'var(--brand-magenta-600)',
            700: 'var(--brand-magenta-700)',
            800: 'var(--brand-magenta-800)',
            900: 'var(--brand-magenta-900)',
          },
        },
        status: {
          error: 'var(--status-error)',
          'error-light': 'var(--status-error-light)',
          'error-border': 'var(--status-error-border)',
          success: 'var(--status-success)',
          'success-light': 'var(--status-success-light)',
          'success-border': 'var(--status-success-border)',
          info: 'var(--status-info)',
          'info-light': 'var(--status-info-light)',
          'info-border': 'var(--status-info-border)',
          warning: 'var(--status-warning)',
          'warning-light': 'var(--status-warning-light)',
          'warning-border': 'var(--status-warning-border)',
        },
        app: {
          background: 'var(--app-background)',
          container: 'var(--container-background)',
          panel: 'var(--panel-background)',
          input: 'var(--input-background)',
          border: 'var(--border-color)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
      },
      screens: {
        'custom700': '700px',
      },
      fontFamily: {
        'dm-sans': ['DM Sans', 'sans-serif'],
        'kanit': ['Kanit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        'kanit-tight': '-0.04em',
        'kanit-normal': '-0.02em',
        'kanit-wide': '0em',
      },
      animation: {
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
      },
      keyframes: {
        'collapsible-down': {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-collapsible-content-height)', opacity: '1' },
        },
        'collapsible-up': {
          '0%': { height: 'var(--radix-collapsible-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, var(--brand-gradient-primary-from), var(--brand-gradient-primary-to))',
        'brand-gradient-hover': 'linear-gradient(to right, var(--brand-gradient-primary-from-hover), var(--brand-gradient-primary-to-hover))',
      },
    },
  },
  plugins: [],
};
