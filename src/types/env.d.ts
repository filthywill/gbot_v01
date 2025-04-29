/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Application environment
   */
  readonly APP_ENV?: string;
  
  /**
   * The base URL of the API
   */
  readonly VITE_API_URL?: string;
  
  /**
   * Flag to enable HTTPS for development server
   */
  readonly VITE_USE_HTTPS?: string;
  
  /**
   * Supabase URL
   */
  readonly VITE_SUPABASE_URL: string;
  
  /**
   * Supabase anonymous key
   */
  readonly VITE_SUPABASE_ANON_KEY: string;
  
  /**
   * Google Auth Client ID
   */
  readonly VITE_GOOGLE_CLIENT_ID?: string;

  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Utility type to ensure environment variables are defined
type RequiredEnv<T> = {
  [K in keyof T]: T[K] extends string | undefined ? string : T[K];
};

// Type for required environment variables
type RequiredEnvVars = RequiredEnv<
  Pick<ImportMetaEnv, 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'>
>; 