/**
 * Brand color system for gbot_v01
 * This file serves as the single source of truth for all brand colors used in the application.
 */

export const brandColors = {
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Base purple
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  accent: {
    indigo: {
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
    },
    purple: {
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
    }
  },
  gradient: {
    primary: {
      from: '#6d28d9', // indigo-600 equivalent
      to: '#9333ea',   // purple-600 equivalent
      fromHover: '#5b21b6', // indigo-700 equivalent
      toHover: '#7e22ce',   // purple-700 equivalent
    },
  },
  ui: {
    background: '#ffffff',
    foreground: '#0f172a',
    card: '#ffffff',
    cardForeground: '#0f172a',
    border: '#e2e8f0',
    input: '#e2e8f0',
  }
};

// Named color references for the application
export const appColors = {
  verificationBanner: {
    gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600',
    buttonText: brandColors.primary[600],
  },
  buttons: {
    primary: {
      background: brandColors.primary[600],
      text: '#ffffff',
      hoverBackground: brandColors.primary[700],
    },
    secondary: {
      background: '#ffffff',
      text: brandColors.primary[600],
      hoverBackground: '#f9fafb',
    },
  },
  links: {
    default: brandColors.primary[600],
    hover: brandColors.primary[700],
  }
};

export default brandColors; 