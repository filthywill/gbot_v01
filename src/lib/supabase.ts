import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import logger from './logger';
import AUTH_CONFIG from './auth/config';
import useAuthStore from '../store/useAuthStore';
import { clearAllVerificationState } from './auth/utils';

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
  
  // Import state directly to avoid circular dependencies
  const authStore = useAuthStore.getState();
  
  // Handle session state changes
  if (event === 'SIGNED_IN') {
    logger.info('User signed in:', session?.user?.email);
    
    // Important: Fetch user data immediately after sign-in
    // This helps prevent the "session but no user data" warning
    if (session?.user?.id) {
      setTimeout(async () => {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (error) {
            logger.error('Error fetching user data after sign-in:', error);
            return;
          }
          
          if (data?.user) {
            // Direct access to the store
            authStore.setUser(data.user);
            logger.debug('Updated user data after auth state change');
          }
        } catch (err) {
          logger.error('Exception fetching user data after sign-in:', err);
        }
      }, AUTH_CONFIG.stateTransitionDelay);
    }
  } else if (event === 'SIGNED_OUT') {
    logger.info('User signed out');
    
    // Make sure verification state is also cleared on sign out
    clearAllVerificationState();
    logger.debug('Cleared verification state on sign out');
    
  } else if (event === 'PASSWORD_RECOVERY') {
    logger.info('Password recovery flow initiated');
    
    // IMPORTANT: Do NOT trigger verification flow for password recovery
    // Clear any verification state to prevent confusion with password recovery
    try {
      // When a password recovery event occurs, we need to clear
      // any verification state to avoid showing verification UI
      clearAllVerificationState();
      
      // This is crucial - log that we're NOT doing verification
      logger.debug('Password recovery flow active - verification flow DISABLED');
      
      // Store a recovery state that's separate from verification
      localStorage.setItem('passwordRecoveryState', JSON.stringify({
        active: true,
        startTime: Date.now(),
        email: session?.user?.email || null
      }));
    } catch (err) {
      logger.error('Error handling password recovery event:', err);
    }
    
  } else if (event === 'TOKEN_REFRESHED') {
    logger.debug('Auth token refreshed');
    
    // After token refresh, update user data
    setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          // Direct access to the store
          authStore.setUser(data.user);
          logger.debug('Updated user data after token refresh');
        }
      } catch (err) {
        logger.error('Failed to update user data after token refresh:', err);
      }
    }, AUTH_CONFIG.stateTransitionDelay);
    
  } else if (event === 'USER_UPDATED') {
    logger.info('User data updated');
    
    // Refresh user data in the store
    setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          authStore.setUser(data.user);
          logger.debug('Updated store with new user data after USER_UPDATED event');
        }
      } catch (err) {
        logger.error('Error updating user data after USER_UPDATED event:', err);
      }
    }, AUTH_CONFIG.stateTransitionDelay);
  }
  
  // Add explicit handling for token refresh failures
  if (event === 'TOKEN_REFRESH_FAILED' as AuthChangeEvent) {
    logger.warn('Token refresh failed, forcing user to re-authenticate');
    
    // Clear the user and session data
    authStore.setUser(null);
    authStore.setSession(null);
    
    // We don't have a direct setStatus method, so reinitialize to UNAUTHENTICATED
    setTimeout(() => {
      authStore.initialize();
    }, AUTH_CONFIG.stateTransitionDelay);
    
    // Show a user-friendly notification
    // If you have a toast/notification system, use it here
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('auth:session-expired', {
        detail: {
          message: 'Your session has expired. Please sign in again.'
        }
      }));
    }
    
    logger.info('User was signed out due to expired refresh token');
  }
});

// Helper function to get the current user with a timeout and retry logic
export const getCurrentUser = async (retryCount = AUTH_CONFIG.maxUserFetchRetries) => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User fetch timeout')), AUTH_CONFIG.userFetchTimeout);
      });
      
      const userPromise = supabase.auth.getUser();
      
      // Race between the actual request and the timeout
      const result = await Promise.race([userPromise, timeoutPromise]) as { data: { user: any } };
      
      if (!result?.data?.user) {
        logger.debug(`No user found in getCurrentUser (attempt ${attempt + 1}/${retryCount + 1})`);
        
        if (attempt < retryCount) {
          // Exponential backoff
          const backoffTime = Math.pow(2, attempt) * 500;
          logger.debug(`Retrying getCurrentUser in ${backoffTime}ms`);
          await delay(backoffTime);
          continue;
        }
        return null;
      }
      
      logger.debug('Successfully retrieved current user');
      return result.data.user;
    } catch (error) {
      logger.error(`Error getting current user (attempt ${attempt + 1}/${retryCount + 1}):`, error);
      
      if (attempt < retryCount) {
        // Exponential backoff
        const backoffTime = Math.pow(2, attempt) * 500;
        logger.debug(`Retrying getCurrentUser in ${backoffTime}ms`);
        await delay(backoffTime);
      } else {
        return null;
      }
    }
  }
  
  return null;
};

// Export types for easier usage
export type { User } from '@supabase/supabase-js';

export default supabase; 