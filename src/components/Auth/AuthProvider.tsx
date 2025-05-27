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
  // Add ref to track if visibility change is in progress
  const visibilityChangeInProgressRef = useRef(false);
  // Add ref to track the last visibility change time
  const lastVisibilityChangeRef = useRef(0);
  
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
    let debounceTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = async () => {
      // Clear any pending timeouts
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      const now = Date.now();
      const timeSinceLastChange = now - lastVisibilityChangeRef.current;
      
      // If tab is becoming visible
      if (!document.hidden) {
        // Debounce rapid visibility changes (prevent multiple triggers)
        if (timeSinceLastChange < 1000) {
          logger.debug('Debouncing rapid visibility change');
          return;
        }
        
        // Check if we're already processing a visibility change
        if (visibilityChangeInProgressRef.current) {
          logger.debug('Visibility change already in progress, skipping');
          return;
        }
        
        lastVisibilityChangeRef.current = now;
        visibilityChangeInProgressRef.current = true;
        
        logger.debug('Tab became visible, checking auth state');
        
        // Add a debounced delay to prevent race conditions with ongoing operations
        debounceTimeout = setTimeout(async () => {
          try {
            const currentState = useAuthStore.getState();
            
            // If auth is currently loading, don't interfere
            if (currentState.isSessionLoading || currentState.isUserDataLoading) {
              logger.debug('Auth operations in progress, skipping visibility change refresh');
              visibilityChangeInProgressRef.current = false;
              return;
            }
            
            // Only proceed if we have a session or cached session
            if (!currentState.session && !lastKnownSessionRef.current) {
              logger.debug('No session to refresh, skipping visibility change refresh');
              visibilityChangeInProgressRef.current = false;
              return;
            }
            
            // For users who are already authenticated, just validate the current session
            if (currentState.user && currentState.session) {
              // Don't make async calls during tab switching - let the auth state change handler manage this
              logger.debug('User already authenticated, letting auth system manage state');
            } else if (currentState.status === 'ERROR' && currentState.session) {
              // If we're in an error state but have a session, trigger a gentle refresh
              // by temporarily clearing and restoring the session to trigger auth state change
              logger.debug('Attempting to recover from error state on tab visibility change');
              setTimeout(() => {
                try {
                  const session = currentState.session;
                  if (session) {
                    // Trigger auth state change by briefly clearing and restoring session
                    currentState.setSession(null);
                    setTimeout(() => {
                      currentState.setSession(session);
                    }, 100);
                  }
                } catch (err) {
                  logger.debug('Could not trigger session refresh:', err);
                }
              }, 250);
            } else if (!currentState.user && currentState.session) {
              // We have a session but no user - trigger a session refresh
              logger.debug('Session exists but no user, triggering refresh');
              setTimeout(() => {
                try {
                  const session = currentState.session;
                  if (session) {
                    // Trigger auth state change by briefly clearing and restoring session
                    currentState.setSession(null);
                    setTimeout(() => {
                      currentState.setSession(session);
                    }, 100);
                  }
                } catch (err) {
                  logger.debug('Could not trigger session refresh:', err);
                }
              }, 250);
            } else if (lastKnownSessionRef.current && !currentState.session) {
              // Try to restore from cached session
              logger.debug('Attempting to restore session from cache');
              try {
                currentState.setSession(lastKnownSessionRef.current);
              } catch (err) {
                logger.debug('Could not restore cached session:', err);
                lastKnownSessionRef.current = null;
              }
            }
          } catch (err) {
            logger.error('Error handling tab visibility change:', err);
            // Don't force logout on errors - preserve existing auth state
          } finally {
            visibilityChangeInProgressRef.current = false;
          }
        }, 500); // Increased debounce delay for better stability
      } else {
        // Tab is becoming hidden - just update the timestamp
        lastVisibilityChangeRef.current = now;
        logger.debug('Tab became hidden, preserving auth state');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also add focus event as backup (some browsers don't fire visibilitychange consistently)
    const handleWindowFocus = () => {
      if (!document.hidden) {
        handleVisibilityChange();
      }
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      visibilityChangeInProgressRef.current = false;
    };
  }, []);
  
  // Render children without waiting for auth to complete
  return <>{children}</>;
};

export default AuthProvider; 