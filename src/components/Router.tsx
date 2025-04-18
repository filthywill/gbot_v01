import React, { useState, useEffect, lazy, Suspense } from 'react';
import App from '../App';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import ResetPassword from '../pages/auth/reset-password';
import ConfirmResetPage from '../pages/ConfirmResetPage';
import TokenDebugPage from '../pages/TokenDebugPage';
import VerificationDebug from '../pages/VerificationDebug';
import ResetCodePage from '../pages/ResetCodePage';
// Use dynamic imports instead of static imports to avoid build failures
const EmailVerificationSuccess = lazy(() => import('../pages/auth/verification-success').then(module => {
  return { default: module.default };
}));
// Import the auth callback from the correct location
import AuthCallback from '../pages/auth/callback';
import logger from '../lib/logger';

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  // Log initial route - this is crucial for debugging
  useEffect(() => {
    console.log('ROUTER INITIAL LOAD', {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Router loaded at:', window.location.href);
    
    // Check for auth callback route immediately
    if (isAuthCallback()) {
      console.log('AUTH CALLBACK ROUTE DETECTED ON INITIAL LOAD');
      logger.info('Auth callback route detected on initial load');
    }
    
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

  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
      logger.debug('Path changed to:', window.location.pathname);
      
      // Check for auth callback on path change
      if (isAuthCallback()) {
        console.log('AUTH CALLBACK ROUTE DETECTED AFTER NAVIGATION');
        logger.info('Auth callback route detected after navigation');
      }
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
  useEffect(() => {
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

  // Check if the path starts with a specific route
  const pathStartsWith = (route: string): boolean => {
    // Normalize the path by removing duplicate slashes
    const normalizedPath = currentPath.replace(/\/+/g, '/');
    return normalizedPath.startsWith(route);
  };

  // Improved function to check for auth callback
  const isAuthCallback = (): boolean => {
    const fullUrl = window.location.href;
    const pathname = window.location.pathname;
    const currentPathNormalized = pathname.replace(/\/+/g, '/');
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for our special flag from the static HTML redirect
    const hasAuthCallbackFlag = searchParams.get('auth_callback') === 'true';
    
    // Check if path is /auth/callback
    const isPathCallback = currentPathNormalized.startsWith('/auth/callback');
    
    // Check URL for authentication query parameters
    const hasToken = searchParams.has('token');
    const hasType = searchParams.has('type') && ['signup', 'recovery', 'invite'].includes(searchParams.get('type') || '');
    const hasCode = searchParams.has('code');
    const hasAuthParams = hasToken || hasType || hasCode;
                         
    // Check hash for authentication data
    const urlHash = window.location.hash;
    const hasAuthHash = urlHash.length > 0 && 
                        (urlHash.includes('access_token=') || 
                         urlHash.includes('refresh_token=') || 
                         urlHash.includes('type=signup'));
    
    const result = hasAuthCallbackFlag || isPathCallback || hasAuthParams || hasAuthHash;
    
    if (result) {
      console.log('AUTH CALLBACK DETECTED:', { 
        hasAuthCallbackFlag,
        path: isPathCallback, 
        hasToken,
        hasType,
        hasCode,
        hasHash: hasAuthHash,
        fullUrl,
        pathname
      });
      
      logger.debug('Auth callback detected:', { 
        hasAuthCallbackFlag,
        path: isPathCallback, 
        hasAuthParams, 
        hasHash: hasAuthHash,
        fullUrl
      });
    }
    
    return result;
  };

  // If we have an error, show a fallback UI
  if (hasError) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-zinc-900">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <p className="font-bold">Something went wrong</p>
          <p>{errorInfo?.message}</p>
          {import.meta.env.VITE_APP_ENV !== 'production' && (
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

  // Render the appropriate component based on the current path
  if (isAuthCallback()) {
    console.log('RENDERING AUTH CALLBACK COMPONENT');
    logger.info('Rendering AuthCallback component');
    return <AuthCallback />;
  } else if (pathStartsWith('/privacy-policy')) {
    return <PrivacyPolicy />;
  } else if (pathStartsWith('/terms-of-service')) {
    return <TermsOfService />;
  } else if (pathStartsWith('/token-debug')) {
    logger.info('Rendering TokenDebugPage component');
    return <TokenDebugPage />;
  } else if (pathStartsWith('/confirm-reset')) {
    // New confirm-reset route that provides a button to complete the reset process
    console.log('RENDERING CONFIRM RESET COMPONENT', {
      url: window.location.href,
      path: window.location.pathname, 
      search: window.location.search,
      timestamp: new Date().toISOString()
    });
    logger.info('Rendering ConfirmReset component');
    return <ConfirmResetPage />;
  } else if (pathStartsWith('/reset-code')) {
    logger.info('Rendering ResetCodePage component');
    return <ResetCodePage />;
  } else if (pathStartsWith('/reset-password') || pathStartsWith('/auth/reset-password')) {
    console.log('RENDERING RESET PASSWORD COMPONENT', { 
      url: window.location.href,
      path: window.location.pathname,
      hasToken: window.location.search.includes('token='),
      timestamp: new Date().toISOString()
    });
    logger.info('Rendering ResetPassword component', { 
      path: window.location.pathname,
      hasToken: window.location.search.includes('token='),
      hasType: window.location.search.includes('type=recovery')
    });
    return <ResetPassword />;
  } else if (pathStartsWith('/verification-success')) {
    return (
      <Suspense fallback={<div className="p-4 text-center">Loading verification success page...</div>}>
        <EmailVerificationSuccess />
      </Suspense>
    );
  } else if (pathStartsWith('/debug-verification')) {
    return <VerificationDebug />;
  } else {
    return <App />;
  }
};

export default Router; 