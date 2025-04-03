import React, { useState, useEffect } from 'react';
import App from '../App';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import ResetPassword from '../pages/ResetPassword';
import EmailVerificationSuccess from '../pages/EmailVerificationSuccess';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';
import usePreferencesStore from '../store/usePreferencesStore';
import logger from '../lib/logger';

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isProcessingVerification, setIsProcessingVerification] = useState(false);
  const { initialize, verifyEmail } = useAuthStore();
  const { setLastUsedEmail } = usePreferencesStore();

  // Check for email verification token on initial load
  useEffect(() => {
    const checkForVerification = async () => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      const type = url.searchParams.get('type');
      const email = url.searchParams.get('email');
      
      // Only handle signup verification
      if (token && type === 'signup') {
        try {
          setIsProcessingVerification(true);
          logger.info('Detected email verification token');

          // Store email for login form if available
          if (email) {
            logger.debug('Storing verified email for login form', { email });
            setLastUsedEmail(email);
          }
          
          // Try to verify the email - our function will handle updating auth state
          await verifyEmail(token);
          
          // Clean the URL by removing the verification parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Navigate to verification success page
          navigate('/verification-success');
        } catch (error) {
          logger.error('Error processing verification token:', error);
          // Fallback to home page on error
          navigate('/');
        } finally {
          setIsProcessingVerification(false);
        }
      }
    };
    
    checkForVerification();
  }, [initialize, setLastUsedEmail, verifyEmail]);

  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
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

  // If we're processing a verification token, show loading
  if (isProcessingVerification) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-white">Verifying your email...</p>
      </div>
    );
  }

  // Render the appropriate component based on the current path
  switch (currentPath) {
    case '/privacy-policy':
      return <PrivacyPolicy />;
    case '/terms-of-service':
      return <TermsOfService />;
    case '/reset-password':
      return <ResetPassword />;
    case '/verification-success':
      return <EmailVerificationSuccess />;
    default:
      return <App />;
  }
};

export default Router; 