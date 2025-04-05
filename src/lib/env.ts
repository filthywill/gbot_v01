// Environment configuration utility
let ENV = {
  isDevelopment: import.meta.env.PROD === false,
  isProduction: import.meta.env.PROD === true,
  // Add other environment variables here
};

// Debug logs for environment detection - more detailed for troubleshooting
console.log('ENV detection details:', {
  'import.meta.env.PROD': import.meta.env.PROD,
  'import.meta.env.DEV': import.meta.env.DEV,
  'import.meta.env.MODE': import.meta.env.MODE,
  'process.env.NODE_ENV': process.env.NODE_ENV,
  'Result - isDevelopment': ENV.isDevelopment,
  'Result - isProduction': ENV.isProduction
});

// Force production mode when deployed to Vercel
if (import.meta.env.MODE === 'production' || 
    process.env.VERCEL_ENV === 'production' || 
    process.env.NODE_ENV === 'production') {
  console.log('Forcing production mode based on environment variables');
  ENV.isDevelopment = false;
  ENV.isProduction = true;
}

// Validate environment configuration
const validateEnv = () => {
  // Ensure we have a valid environment
  if (!ENV.isDevelopment && !ENV.isProduction) {
    throw new Error('Invalid environment configuration: NODE_ENV must be either "development" or "production"');
  }
  
  // Ensure we don't have conflicting states
  if (ENV.isDevelopment && ENV.isProduction) {
    throw new Error('Invalid environment configuration: Cannot be both development and production');
  }
};

// Run validation immediately
validateEnv();

// Freeze the environment object to prevent modifications after initialization
const FROZEN_ENV = Object.freeze({...ENV} as const);
ENV = FROZEN_ENV as any; // Replace the mutable reference with the frozen one

// Type-safe environment getter
export const getEnv = () => ENV;

// Safe environment check functions
export const isDevelopment = () => ENV.isDevelopment;
export const isProduction = () => ENV.isProduction; 