import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import logger from './logger';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Log Supabase configuration (hiding sensitive details)
logger.info('Initializing Supabase client with URL:', supabaseUrl);

// Create a custom fetch function with timeout
const fetchWithTimeout = (url: RequestInfo | URL, options: RequestInit = {}) => {
  const timeout = 15000; // 15 seconds timeout
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => {
    controller.abort();
    logger.warn('Supabase API request timed out:', url.toString());
  }, timeout);
  
  return fetch(url, {
    ...options,
    signal
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Initialize the Supabase client with proper options
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'gbot_supabase_auth',
    // Define flow types for smoother user experience
    flowType: 'pkce',
    debug: import.meta.env.DEV, // Enable auth debugging in development mode
    // Custom URL handling is implemented in the callback pages
    storage: {
      // Use a custom storage implementation that respects the remember me preference
      async getItem(key: string) {
        try {
          // Always get from localStorage first to check preferences
          const preferences = JSON.parse(localStorage.getItem('gbot-preferences') || '{}');
          const rememberMe = preferences?.state?.rememberMe ?? false;
          
          if (import.meta.env.DEV) {
            logger.debug('Auth storage getItem:', { key, rememberMe });
          }
          
          // If remember me is false, don't return any stored session
          if (!rememberMe && key === 'gbot_supabase_auth') {
            logger.debug('Not returning stored session due to rememberMe=false');
            return null;
          }
          
          const value = localStorage.getItem(key);
          return value;
        } catch (error) {
          logger.error('Error reading from storage:', error);
          return null;
        }
      },
      setItem(key: string, value: string) {
        try {
          if (import.meta.env.DEV) {
            logger.debug('Auth storage setItem:', { key, valueLength: value?.length || 0 });
          }
          localStorage.setItem(key, value);
        } catch (error) {
          logger.error('Error writing to storage:', error);
        }
      },
      removeItem(key: string) {
        try {
          if (import.meta.env.DEV) {
            logger.debug('Auth storage removeItem:', { key });
          }
          localStorage.removeItem(key);
        } catch (error) {
          logger.error('Error removing from storage:', error);
        }
      }
    }
  },
  global: {
    fetch: fetchWithTimeout
  },
  realtime: {
    timeout: 10000 // 10 seconds for realtime connections
  }
});

// Listen for auth events
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  logger.info('Auth event:', event);
  if (event === 'SIGNED_IN') {
    logger.info('User signed in:', session?.user?.email);
  } else if (event === 'SIGNED_OUT') {
    logger.info('User signed out');
  } else if (event === 'PASSWORD_RECOVERY') {
    logger.info('Password recovery flow initiated');
  } else if (event === 'TOKEN_REFRESHED') {
    logger.debug('Auth token refreshed');
  } else if (event === 'USER_UPDATED') {
    logger.info('User data updated');
  }
});

// Helper function to get the current user with a timeout
export const getCurrentUser = async () => {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('User fetch timeout')), 4000);
    });
    
    const userPromise = supabase.auth.getUser();
    
    // Race between the actual request and the timeout
    const result = await Promise.race([userPromise, timeoutPromise]) as { data: { user: any } };
    
    if (!result?.data?.user) {
      logger.debug('No user found in getCurrentUser');
      return null;
    }
    
    logger.debug('Successfully retrieved current user');
    return result.data.user;
  } catch (error) {
    logger.error('Error getting current user:', error);
    return null;
  }
};

// Export types for easier usage
export type { User } from '@supabase/supabase-js';

export default supabase; 