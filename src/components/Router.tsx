import React, { useState, useEffect, lazy, Suspense } from 'react';
import App from '../App';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import ResetPasswordPage from '../pages/auth/reset-password';
import TokenDebugPage from '../pages/TokenDebugPage';
import VerificationDebug from '../pages/VerificationDebug';
import VerifyRedirect from '../pages/auth/verify-redirect';
import AccountSettings from '../pages/AccountSettings';
import { ProtectedRoute } from './Auth';
// Use dynamic imports instead of static imports to avoid build failures
const EmailVerificationSuccess = lazy(() => import('../pages/auth/verification-success').then(module => {
  return { default: module.default };
}));
// Import the auth callback from the correct location
import AuthCallback from '../pages/auth/callback';
import logger from '../lib/logger';

const Router: React.FC = () => {
  console.log('!!! ROUTER FUNCTION BODY START !!!', { timestamp: new Date().toISOString() });
  logger.info('!!! ROUTER FUNCTION BODY START !!!');

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
    const result = normalizedPath.startsWith(route);
    
    if (route === '/auth/reset-password') {
      logger.debug(`Path check for ${route}:`, { 
        currentPath, 
        normalizedPath, 
        result,
        url: window.location.href
      });
    }
    
    return result;
  };

  // Improved function to check for auth callback
  const isAuthCallback = (): boolean => {
    const fullUrl = window.location.href;
    const pathname = window.location.pathname;
    const currentPathNormalized = pathname.replace(/\/+/g, '/');
    const searchParams = new URLSearchParams(window.location.search);

    // Check 1: Is the path explicitly /auth/callback?
    const isPathCallback = currentPathNormalized.startsWith('/auth/callback');

    // Check 2: Does the URL have specific query params indicating an OAuth/MagicLink/etc callback?
    const hasCode = searchParams.has('code'); // Used by OAuth
    // Add other specific search param checks if needed for other flows handled by /auth/callback
    const hasSpecificSearchParams = hasCode; 

    // Check 3: Check for our special flag from the static HTML redirect (if used)
    const hasAuthCallbackFlag = searchParams.get('auth_callback') === 'true';

    // Determine if this is an auth callback based ONLY on path or specific search params
    const result = isPathCallback || hasSpecificSearchParams || hasAuthCallbackFlag;

    if (result) {
      console.log('AUTH CALLBACK DETECTED (ROUTER):', { 
        isPathCallback,
        hasSpecificSearchParams,
        hasAuthCallbackFlag,
        fullUrl,
        pathname
      });
      
      logger.debug('Auth callback detected (Router):', { 
        isPathCallback, 
        hasSpecificSearchParams, 
        hasAuthCallbackFlag,
        fullUrl
      });
    }
    
    return result;
  };

  console.log('!!! ROUTER BEFORE RENDER LOGIC !!!', { currentPath, timestamp: new Date().toISOString() });
  logger.info('!!! ROUTER BEFORE RENDER LOGIC !!!', { currentPath });

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
  } else if (pathStartsWith('/account-settings')) {
    logger.info('Rendering protected AccountSettings component');
    return (
      <ProtectedRoute redirectTo="/auth/login">
        <AccountSettings />
      </ProtectedRoute>
    );
  } else if (pathStartsWith('/auth/reset-password')) {
    // Direct link reset password route
    console.log('RENDERING RESET PASSWORD COMPONENT', {
      url: window.location.href,
      path: window.location.pathname, 
      search: window.location.search,
      hash: window.location.hash,
      timestamp: new Date().toISOString()
    });
    logger.info('Rendering ResetPasswordPage component with token params', {
      hasToken: new URLSearchParams(window.location.search).has('token'),
      tokenLength: new URLSearchParams(window.location.search).get('token')?.length,
      type: new URLSearchParams(window.location.search).get('type')
    });
    
    try {
      return <ResetPasswordPage />;
    } catch (error) {
      logger.error('Error rendering ResetPasswordPage:', error);
      return (
        <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-zinc-900">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full">
            <p className="font-bold">Error rendering Reset Password page</p>
            <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
          <a href="/" className="mt-4 text-blue-400 hover:underline">
            Return to Home
          </a>
        </div>
      );
    }
  } else if (pathStartsWith('/auth/verify-redirect')) {
    logger.info('Rendering VerifyRedirect component');
    return <VerifyRedirect />;
  } else if (pathStartsWith('/auth/verification-success')) {
    logger.info('Rendering EmailVerificationSuccess component');
    return (
      <Suspense fallback={<div>Loading verification page...</div>}>
        <EmailVerificationSuccess />
      </Suspense>
    );
  } else if (pathStartsWith('/verification-debug')) {
    logger.info('Rendering VerificationDebug component');
    return <VerificationDebug />;
  } else {
    // Default route
    return <App />;
  }
};

export default Router; 