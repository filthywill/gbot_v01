import React, { useState, useEffect, lazy, Suspense } from 'react';
import App from '../App';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import ResetPassword from '../pages/ResetPassword';
// Use dynamic imports instead of static imports to avoid build failures
const EmailVerificationSuccess = lazy(() => import('../pages/EmailVerificationSuccess'));
import AuthCallback from '../pages/AuthCallback';
import logger from '../lib/logger';

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
      logger.debug('Path changed to:', window.location.pathname);
    };

    window.addEventListener('popstate', handlePathChange);

    return () => {
      window.removeEventListener('popstate', handlePathChange);
    };
  }, []);

  // Function to navigate without page reload
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Add navigate function to window for global access
  React.useEffect(() => {
    (window as any).navigateTo = navigate;
    
    // Override link clicks to use our router
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.getAttribute('href')?.startsWith('/') && !anchor.getAttribute('target')) {
        e.preventDefault();
        navigate(anchor.getAttribute('href') || '/');
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
      delete (window as any).navigateTo;
    };
  }, []);

  // Log the current URL
  useEffect(() => {
    logger.info('Current location:', window.location.href);
  }, []);

  // Check if the path starts with a specific route
  const pathStartsWith = (route: string): boolean => {
    // Normalize the path by removing duplicate slashes
    const normalizedPath = currentPath.replace(/\/+/g, '/');
    logger.debug('Checking path match:', { currentPath, normalizedPath, route, match: normalizedPath.startsWith(route) });
    return normalizedPath.startsWith(route);
  };

  // Check for auth callback directly from full URL
  const isAuthCallback = (): boolean => {
    const fullUrl = window.location.href;
    return fullUrl.includes('/auth/callback') || 
           (fullUrl.includes('token=') && fullUrl.includes('type=verification'));
  };

  // Render the appropriate component based on the current path
  // Using startsWith to match routes even with query parameters
  if (isAuthCallback()) {
    logger.info('Detected auth callback URL, rendering AuthCallback');
    return <AuthCallback />;
  } else if (pathStartsWith('/privacy-policy')) {
    return <PrivacyPolicy />;
  } else if (pathStartsWith('/terms-of-service')) {
    return <TermsOfService />;
  } else if (pathStartsWith('/reset-password')) {
    return <ResetPassword />;
  } else if (pathStartsWith('/verification-success')) {
    return (
      <Suspense fallback={<div className="p-4 text-center">Loading verification success page...</div>}>
        <EmailVerificationSuccess />
      </Suspense>
    );
  } else {
    return <App />;
  }

  useEffect(() => {
    // Log the complete URL for debugging
    const fullUrl = window.location.href;
    const urlParts = new URL(fullUrl);
    logger.info('Router loaded. Current URL:', fullUrl);
    logger.info('Path parts:', {
      pathname: urlParts.pathname,
      search: urlParts.search,
      hash: urlParts.hash
    });
    
    // Check if we're on a verification link
    if (urlParts.pathname.includes('/auth/callback') || 
        (urlParts.searchParams.get('type') === 'verification' && urlParts.searchParams.get('token'))) {
      logger.info('DETECTED VERIFICATION LINK - should render AuthCallback');
    }
  }, []);
  
  // Fallback error boundary for the router
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<any>(null);
  
  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      logger.error('Unhandled error in Router:', event.error);
      setHasError(true);
      setErrorInfo({
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // If we have an error, show a fallback UI
  if (hasError) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-zinc-900">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <p className="font-bold">Something went wrong</p>
          <p>{errorInfo?.message}</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 overflow-auto text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(errorInfo, null, 2)}
            </pre>
          )}
        </div>
        <a href="/" className="mt-4 text-blue-400 hover:underline">
          Return to Home
        </a>
      </div>
    );
  }
};

export default Router; 