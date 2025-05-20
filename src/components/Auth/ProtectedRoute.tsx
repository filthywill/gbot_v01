import React, { useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Spinner } from '../../components/ui';
import logger from '../../lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * A component that protects routes which require authentication.
 * Redirects to login if user is not authenticated.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/auth/login',
  fallback = <Spinner centered size="lg" />
}) => {
  const { status, isLoading } = useAuthStore();
  
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    if (!isLoading() && status !== 'AUTHENTICATED') {
      logger.info('Access to protected route denied, redirecting to login', {
        path: window.location.pathname,
        authStatus: status
      });
      
      // Include the return path so user can be redirected back after login
      const returnPath = encodeURIComponent(window.location.pathname + window.location.search);
      
      // Use the custom navigation method available on window
      if (typeof (window as any).navigateTo === 'function') {
        (window as any).navigateTo(`${redirectTo}?returnTo=${returnPath}`);
      } else {
        // Fallback to standard navigation if custom method is not available
        window.location.href = `${redirectTo}?returnTo=${returnPath}`;
      }
    }
  }, [status, isLoading, redirectTo]);
  
  // Show loading state while checking authentication
  if (isLoading()) {
    return <>{fallback}</>;
  }
  
  // Only render the protected content if authenticated
  return status === 'AUTHENTICATED' ? <>{children}</> : null;
};

export default ProtectedRoute; 