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
    gradient: `bg-gradient-to-r from-[${brandColors.gradient.primary.from}] to-[${brandColors.gradient.primary.to}]`,
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

// Generate CSS variables string to be included in global styles
export const generateCssVariables = () => {
  return `
  :root {
    /* Primary colors */
    --brand-primary-50: ${brandColors.primary[50]};
    --brand-primary-100: ${brandColors.primary[100]};
    --brand-primary-200: ${brandColors.primary[200]};
    --brand-primary-300: ${brandColors.primary[300]};
    --brand-primary-400: ${brandColors.primary[400]};
    --brand-primary-500: ${brandColors.primary[500]};
    --brand-primary-600: ${brandColors.primary[600]};
    --brand-primary-700: ${brandColors.primary[700]};
    --brand-primary-800: ${brandColors.primary[800]};
    --brand-primary-900: ${brandColors.primary[900]};
    --brand-primary-950: ${brandColors.primary[950]};
    
    /* Accent colors */
    --brand-indigo-500: ${brandColors.accent.indigo[500]};
    --brand-indigo-600: ${brandColors.accent.indigo[600]};
    --brand-indigo-700: ${brandColors.accent.indigo[700]};
    --brand-purple-500: ${brandColors.accent.purple[500]};
    --brand-purple-600: ${brandColors.accent.purple[600]};
    --brand-purple-700: ${brandColors.accent.purple[700]};
    
    /* Gradient colors */
    --brand-gradient-primary-from: ${brandColors.gradient.primary.from};
    --brand-gradient-primary-to: ${brandColors.gradient.primary.to};
    --brand-gradient-primary-from-hover: ${brandColors.gradient.primary.fromHover};
    --brand-gradient-primary-to-hover: ${brandColors.gradient.primary.toHover};
  }
  `;
};

export default brandColors; 