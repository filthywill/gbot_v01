// Environment configuration utility
const ENV = {
  isDevelopment: import.meta.env.DEV || process.env.NODE_ENV === 'development',
  isProduction: import.meta.env.PROD || process.env.NODE_ENV === 'production',
  // Add other environment variables here
} as const;

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

// Freeze the environment object to prevent modifications
Object.freeze(ENV);

// Type-safe environment getter
export const getEnv = () => ENV;

// Safe environment check functions
export const isDevelopment = () => ENV.isDevelopment;
export const isProduction = () => ENV.isProduction; 