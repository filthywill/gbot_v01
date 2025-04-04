import React, { useState, useEffect } from 'react';
import App from '../App';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import ResetPassword from '../pages/ResetPassword';
import EmailVerificationSuccess from '../pages/EmailVerificationSuccess';
import { AuthCallback } from '../components/Auth';
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
    return currentPath.startsWith(route);
  };

  // Render the appropriate component based on the current path
  // Using startsWith to match routes even with query parameters
  if (pathStartsWith('/privacy-policy')) {
    return <PrivacyPolicy />;
  } else if (pathStartsWith('/terms-of-service')) {
    return <TermsOfService />;
  } else if (pathStartsWith('/reset-password')) {
    return <ResetPassword />;
  } else if (pathStartsWith('/verification-success')) {
    return <EmailVerificationSuccess />;
  } else if (pathStartsWith('/auth/callback')) {
    logger.info('Rendering AuthCallback for path:', currentPath);
    return <AuthCallback />;
  } else {
    return <App />;
  }
};

export default Router; 