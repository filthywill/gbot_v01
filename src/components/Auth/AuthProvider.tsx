import React, { useEffect, useRef } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useGoogleAuthStore from '../../store/useGoogleAuthStore';
import logger from '../../lib/logger';
import AUTH_CONFIG from '../../lib/auth/config';
import { supabase, getCurrentUser } from '../../lib/supabase';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that initializes authentication
 * Uses a non-blocking approach that doesn't prevent rendering
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { initialize, error, status, isSessionLoading, isUserDataLoading } = useAuthStore();
  const { initializeSDK } = useGoogleAuthStore();
  // Add ref to cache the last known good session
  const lastKnownSessionRef = useRef<any>(null);
  
  // Initialize authentication on mount
  useEffect(() => {
    logger.info('AuthProvider: Starting authentication services');
    
    const setupAuth = async () => {
      // Initialize Google SDK in parallel (non-blocking)
      if (window.isSecureContext) {
        initializeSDK().catch(err => 
          logger.warn('Non-critical Google SDK initialization error:', err)
        );
      }
      
      // Initialize authentication with enhanced error handling
      try {
        await initialize();
        logger.info('AuthProvider: Authentication initialization completed');
      } catch (err) {
        // Errors are already handled in the store
        logger.error('AuthProvider: Authentication initialization failed', err);
        
        // Add recovery mechanism - retry initialization after a delay if it failed
        setTimeout(() => {
          logger.info('AuthProvider: Retrying authentication initialization');
          initialize().catch(retryErr => {
            logger.error('AuthProvider: Retry authentication initialization failed', retryErr);
          });
        }, AUTH_CONFIG.retryDelay);
      }
    };
    
    setupAuth();
  }, [initialize, initializeSDK]);
  
  // Add detailed logging for loading states
  useEffect(() => {
    if (isSessionLoading) {
      logger.debug('AuthProvider: Session loading in progress');
    }
    if (isUserDataLoading) {
      logger.debug('AuthProvider: User data loading in progress');
    }
  }, [isSessionLoading, isUserDataLoading]);
  
  // Log errors but don't block rendering
  useEffect(() => {
    if (error) {
      logger.error('AuthProvider: Authentication error:', error);
    }
  }, [error]);
  
  // Log status changes with more context
  useEffect(() => {
    logger.debug(`AuthProvider: Auth status changed to ${status}`, {
      isSessionLoading,
      isUserDataLoading
    });
  }, [status, isSessionLoading, isUserDataLoading]);
  
  // Update the cached session when it changes
  useEffect(() => {
    const authState = useAuthStore.getState();
    if (authState.session) {
      lastKnownSessionRef.current = authState.session;
      logger.debug('Updated cached session reference');
    }
  }, [useAuthStore.getState().session]);
  
  // Handle tab visibility changes to refresh auth state
  useEffect(() => {
    let visibilityChangeTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = async () => {
      // Clear any pending visibility change operations
      if (visibilityChangeTimeout) {
        clearTimeout(visibilityChangeTimeout);
      }
      
      if (!document.hidden) {
        logger.debug('Tab became visible, refreshing auth state');
        
        // Add a small delay to prevent race conditions with ongoing token refresh
        visibilityChangeTimeout = setTimeout(async () => {
          try {
            // Force refresh the session when tab becomes visible
            const { data, error } = await supabase.auth.getSession();
            
            // Fall back to cached session if there's an error or no session
            if (error || !data.session) {
              logger.debug('Using cached session after visibility change');
              if (lastKnownSessionRef.current) {
                const currentState = useAuthStore.getState();
                // Only update if there's no current session
                if (!currentState.session) {
                  currentState.setSession(lastKnownSessionRef.current);
                  logger.debug('Restored session from cache');
                  
                  // Also try to refresh user data
                  const user = await getCurrentUser();
                  if (user) {
                    currentState.setUser(user);
                    logger.debug('User data refreshed after restoring cached session');
                  }
                }
              }
            } else if (data.session) {
              // Update store if needed
              const currentState = useAuthStore.getState();
              if (!currentState.session || currentState.session.expires_at !== data.session.expires_at) {
                logger.debug('Refreshing auth state after tab visibility change');
                currentState.setSession(data.session);
                lastKnownSessionRef.current = data.session;
                
                // Also refresh user data
                const user = await getCurrentUser();
                if (user) currentState.setUser(user);
              }
            }
          } catch (err) {
            logger.error('Error refreshing session on visibility change:', err);
            
            // Attempt recovery with cached session
            if (lastKnownSessionRef.current) {
              logger.debug('Attempting recovery with cached session');
              const currentState = useAuthStore.getState();
              if (!currentState.session) {
                currentState.setSession(lastKnownSessionRef.current);
              }
            }
          }
        }, import.meta.env.PROD ? 300 : 150); // Longer delay in production to prevent race conditions
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityChangeTimeout) {
        clearTimeout(visibilityChangeTimeout);
      }
    };
  }, []);
  
  // Render children without waiting for auth to complete
  return <>{children}</>;
};

export default AuthProvider; 