import React, { useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useGoogleAuthStore from '../../store/useGoogleAuthStore';
import logger from '../../lib/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that initializes authentication
 * Uses a non-blocking approach that doesn't prevent rendering
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { initialize, error, status } = useAuthStore();
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
      
      // Initialize authentication
      try {
        await initialize();
        logger.info('AuthProvider: Authentication initialization completed');
      } catch (err) {
        // Errors are already handled in the store
        logger.error('AuthProvider: Authentication initialization failed', err);
      }
    };
    
    setupAuth();
  }, [initialize, initializeSDK]);
  
  // Log errors but don't block rendering
  useEffect(() => {
    if (error) {
      logger.error('AuthProvider: Authentication error:', error);
    }
  }, [error]);
  
  // Log status changes
  useEffect(() => {
    logger.debug('AuthProvider: Auth status changed to', status);
  }, [status]);
  
  // Render children without waiting for auth to complete
  return <>{children}</>;
};

export default AuthProvider; 