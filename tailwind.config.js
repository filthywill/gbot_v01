/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
};
