import React, { useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useGoogleAuthStore from '../../store/useGoogleAuthStore';
import logger from '../../lib/logger';
import AUTH_CONFIG from '../../lib/auth/config';

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
  
  // Add visibility change listener to handle tab switching
  useEffect(() => {
    // Handle visibilitychange events (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.debug('AuthProvider: Page became visible, reinitializing auth');
        
        // Use a small delay to ensure browser has fully restored state
        setTimeout(() => {
          initialize().catch(err => {
            logger.error('AuthProvider: Error reinitializing after visibility change', err);
          });
        }, 100);
      }
    };
    
    // Add focus event as a backup strategy
    const handleFocus = () => {
      logger.debug('AuthProvider: Window focused, checking auth state');
      
      // Use a small delay to ensure browser has fully restored state
      setTimeout(() => {
        initialize().catch(err => {
          logger.error('AuthProvider: Error reinitializing after window focus', err);
        });
      }, 100);
    };
    
    // Register event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [initialize]);
  
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
  
  // Render children without waiting for auth to complete
  return <>{children}</>;
};

export default AuthProvider; 