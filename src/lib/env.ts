// Environment configuration utility

interface Env {
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleClientId: string;
  isDevelopment: boolean;
  isProduction: boolean;
  enableConcurrent: boolean; // Phase 4.1: React 18 concurrent features flag
}

const validateEnv = () => {
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_GOOGLE_CLIENT_ID'];
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    // Phase 4.1: React 18 concurrent features flag (defaults to true)
    enableConcurrent: import.meta.env.VITE_ENABLE_CONCURRENT !== 'false',
  };
};

const ENV: Env = validateEnv();

// Freeze the environment object to prevent modifications
Object.freeze(ENV);

// Type-safe environment getter
export const getEnv = () => ENV;

// Safe environment check functions
export const isDevelopment = () => ENV.isDevelopment;
export const isProduction = () => ENV.isProduction; 