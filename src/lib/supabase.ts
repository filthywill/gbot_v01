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
          // Always get from localStorage first
          const value = localStorage.getItem(key);
          
          // If this is a session key, handle it carefully
          if (key === 'gbot_supabase_auth') {
            // If no value exists, return null
            if (!value) {
              return null;
            }
            
            // Check if it's a valid session before returning
            try {
              const session = JSON.parse(value);
              const now = Math.floor(Date.now() / 1000);
              
              // CRITICAL: For tab switching scenarios, be very conservative about when to return null
              // Only return null if the session is significantly expired AND we have explicit user preference
              if (session && session.expires_at) {
                // Much more conservative grace period - prioritize user experience over security margins
                const sessionAge = now - (session.issued_at || session.expires_at - 3600);
                const sessionAgeHours = sessionAge / 3600;
                
                // Extended grace periods to handle tab switching and network delays
                let gracePeriod;
                if (sessionAgeHours < 2) {
                  gracePeriod = 15 * 60; // 15 minutes for sessions under 2 hours
                } else if (sessionAgeHours < 12) {
                  gracePeriod = 10 * 60; // 10 minutes for sessions under 12 hours
                } else {
                  gracePeriod = 5 * 60; // 5 minutes for older sessions
                }
                
                const effectiveExpiry = session.expires_at - gracePeriod;
                
                // If session is still valid or within grace period, ALWAYS return it
                if (session.expires_at > now || effectiveExpiry > now) {
                  if (import.meta.env.DEV) {
                    logger.debug('Auth storage getItem: returning valid/grace period session', {
                      gracePeriod,
                      sessionAgeHours: Math.round(sessionAgeHours * 100) / 100,
                      timeUntilExpiry: session.expires_at - now
                    });
                  }
                  return value;
                }
                
                // Session appears expired - be VERY careful about returning null
                // Only return null if we're absolutely sure the user wants to be logged out
                let rememberMe = true; // Default to true for safety
                try {
                  const preferences = JSON.parse(localStorage.getItem('gbot-preferences') || '{}');
                  rememberMe = preferences?.state?.rememberMe ?? true;
                } catch (prefError) {
                  // If we can't parse preferences, assume rememberMe is true for safety
                  logger.warn('Error parsing preferences, defaulting rememberMe to true:', prefError);
                  rememberMe = true;
                }
                
                // Only return null if rememberMe is explicitly false AND session is very expired
                const veryExpiredThreshold = session.expires_at + (30 * 60); // 30 minutes past expiry
                if (!rememberMe && now > veryExpiredThreshold) {
                  logger.debug('Not returning very expired session due to rememberMe=false');
                  return null;
                }
                
                // In all other cases, return the session and let Supabase handle refresh
                if (import.meta.env.DEV) {
                  logger.debug('Returning potentially expired session for refresh attempt', {
                    rememberMe,
                    secondsPastExpiry: now - session.expires_at
                  });
                }
                return value;
              }
            } catch (parseError) {
              logger.warn('Error parsing session data, returning raw value:', parseError);
              // If we can't parse it, return the raw value and let Supabase handle it
              // This prevents loss of session due to parsing errors
              return value;
            }
          }
          
          return value;
        } catch (error) {
          logger.error('Error reading from storage:', error);
          // On storage errors, try to return the raw value as fallback
          try {
            return localStorage.getItem(key);
          } catch (fallbackError) {
            logger.error('Fallback storage read also failed:', fallbackError);
            return null;
          }
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
    
    // After token refresh, update user data with retries
    let retryCount = 0;
    const maxRetries = AUTH_CONFIG.maxUserFetchRetries;
    
    const updateUserData = async () => {
      try {
        // Check if we're in a background tab and use cached data if possible
        if (document.hidden && lastKnownUserCache) {
          // For background tabs, don't try to fetch fresh data to avoid errors
          logger.debug('Using cached user data for token refresh in background tab');
          authStore.setUser(lastKnownUserCache);
          return true;
        }
        
        // Use a longer timeout for token refresh operations to handle tab switching
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Token refresh user fetch timeout')), 8000); // Increased from 3000ms to 8000ms
        });
        
        const userPromise = supabase.auth.getUser();
        const result = await Promise.race([userPromise, timeoutPromise]) as { data: { user: any } };
        
        if (result?.data?.user) {
          // Update cache
          lastKnownUserCache = result.data.user;
          lastUserFetchTime = Date.now();
          
          // Direct access to the store
          authStore.setUser(result.data.user);
          logger.debug('Updated user data after token refresh');
          return true;
        }
        return false;
      } catch (err) {
        logger.warn('Failed to update user data after token refresh (will use fallback):', err);
        
        // Try to use cached data as fallback
        if (lastKnownUserCache) {
          logger.debug('Using cached user data after token refresh error');
          authStore.setUser(lastKnownUserCache);
          return true;
        }
        
        // Don't treat this as a fatal error - token refresh can fail temporarily
        logger.debug('No cached user data available, continuing with existing session');
        return false;
      }
    };
    
    const retryUpdateUserData = async () => {
      const success = await updateUserData();
      if (!success && retryCount < maxRetries) {
        retryCount++;
        logger.debug(`Retrying user data update after token refresh (attempt ${retryCount}/${maxRetries})`);
        // Use shorter retry delays for token refresh to prevent long waits
        setTimeout(retryUpdateUserData, 500); // 500ms instead of 1000ms
      }
    };
    
    // Use shorter delay for production builds to prevent race conditions
    setTimeout(retryUpdateUserData, import.meta.env.PROD ? 100 : AUTH_CONFIG.stateTransitionDelay);
    
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

// Cache the last known user data to improve resilience
let lastKnownUserCache: any = null;
let lastUserFetchTime = 0;
const USER_CACHE_TTL = 30 * 1000; // 30 seconds

// Helper function to get the current user with a timeout and retry logic
export const getCurrentUser = async (retryCount = AUTH_CONFIG.maxUserFetchRetries) => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Check if we have a recent cached user and we're in a visible tab
  const now = Date.now();
  const isRecentCache = (now - lastUserFetchTime) < USER_CACHE_TTL;
  
  if (lastKnownUserCache && isRecentCache && !document.hidden) {
    logger.debug('Using cached user data (visible tab with recent cache)');
    return lastKnownUserCache;
  }
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If we have cached data but it's stale, still return it on first try while fetching in background
      if (attempt === 0 && lastKnownUserCache && !document.hidden) {
        logger.debug('Using stale cached user data while fetching fresh data');
        // Schedule a background refresh but still return the cached data
        setTimeout(() => {
          supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
              lastKnownUserCache = data.user;
              lastUserFetchTime = Date.now();
              logger.debug('Background refresh of user data completed');
            }
          }).catch(err => {
            logger.debug('Background refresh of user data failed (non-critical):', err);
          });
        }, 0);
        return lastKnownUserCache;
      }
      
      // Increased timeout for better tab switching support
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User fetch timeout')), 8000); // Increased from 4000ms to 8000ms
      });
      
      const userPromise = supabase.auth.getUser();
      
      // Race between the actual request and the timeout
      const result = await Promise.race([userPromise, timeoutPromise]) as { data: { user: any } };
      
      if (!result?.data?.user) {
        logger.debug(`No user found in getCurrentUser (attempt ${attempt + 1}/${retryCount + 1})`);
        
        // If we have cached data and tab is not visible, return it
        if (lastKnownUserCache && document.hidden) {
          logger.debug('Using cached user data for hidden tab');
          return lastKnownUserCache;
        }
        
        if (attempt < retryCount) {
          // Exponential backoff with longer delays for tab switching scenarios
          const backoffTime = Math.pow(2, attempt) * 1000; // Increased from 500ms base to 1000ms
          logger.debug(`Retrying getCurrentUser in ${backoffTime}ms`);
          await delay(backoffTime);
          continue;
        }
        return null;
      }
      
      // Cache the user data for future use
      lastKnownUserCache = result.data.user;
      lastUserFetchTime = Date.now();
      
      logger.debug('Successfully retrieved current user');
      return result.data.user;
    } catch (error) {
      logger.warn(`Error getting current user (attempt ${attempt + 1}/${retryCount + 1}):`, error);
      
      // If we have cached data and tab is not visible, return it even in error case
      if (lastKnownUserCache && document.hidden) {
        logger.debug('Using cached user data for hidden tab after error');
        return lastKnownUserCache;
      }
      
      if (attempt < retryCount) {
        // Exponential backoff with longer delays
        const backoffTime = Math.pow(2, attempt) * 1000; // Increased from 500ms base to 1000ms
        logger.debug(`Retrying getCurrentUser in ${backoffTime}ms`);
        await delay(backoffTime);
      } else {
        // If all retries fail but we have a cached user, return it as last resort
        if (lastKnownUserCache) {
          logger.debug('All retries failed, using cached user data as fallback');
          return lastKnownUserCache;
        }
        return null;
      }
    }
  }
  
  return null;
};

// Add document visibility change listener for debugging
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (import.meta.env.DEV) {
      logger.debug('Tab visibility changed:', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        hasCache: !!lastKnownUserCache,
        cacheAge: lastKnownUserCache ? Date.now() - lastUserFetchTime : 0
      });
    }
  });
  
  // Add focus/blur listeners for additional debugging
  window.addEventListener('focus', () => {
    if (import.meta.env.DEV) {
      logger.debug('Window focused - checking auth state');
    }
  });
  
  window.addEventListener('blur', () => {
    if (import.meta.env.DEV) {
      logger.debug('Window blurred - preserving auth state');
    }
  });
}

// Export types for easier usage
export type { User } from '@supabase/supabase-js';

export default supabase; 