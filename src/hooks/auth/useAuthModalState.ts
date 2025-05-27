import { useState, useEffect } from 'react';
import { showSuccess, showError } from '../../lib/toast';
import logger from '../../lib/logger';
import { AUTH_VIEWS } from '../../lib/auth/constants';
import { logStateTransition } from '../../lib/auth/stateSync';

/**
 * Interface for the return value of useAuthModalState hook
 */
export interface UseAuthModalStateReturn {
  // State
  showAuthModal: boolean;
  authModalMode: typeof AUTH_VIEWS[keyof typeof AUTH_VIEWS];
  
  // Actions
  setShowAuthModal: (show: boolean) => void;
  setAuthModalMode: (mode: typeof AUTH_VIEWS[keyof typeof AUTH_VIEWS]) => void;
  
  // URL parameter handling
  checkUrlParams: () => void;
}

/**
 * Custom hook for managing authentication modal state
 * Extracted from App.tsx to allow for better separation of concerns
 */
export function useAuthModalState(): UseAuthModalStateReturn {
  // Using new auth modal state hook implementation
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<typeof AUTH_VIEWS[keyof typeof AUTH_VIEWS]>(AUTH_VIEWS.SIGN_IN);

  // Function to check URL parameters and set modal state accordingly
  const checkUrlParams = () => {
    // Log debugging information
      logger.debug('Checking URL parameters for auth modal state');
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for verification status from callback
    const verificationStatus = urlParams.get('verification');
    const needsLogin = urlParams.get('needsLogin');
    const authStatus = urlParams.get('auth');
    const errorMessage = urlParams.get('error');
    
    // Clear the URL parameters without reloading the page
    const cleanUrl = () => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('verification');
      newUrl.searchParams.delete('needsLogin');
      newUrl.searchParams.delete('auth');
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, document.title, newUrl.toString());
    };
    
    if (verificationStatus === 'success') {
      logger.info('Email verification successful, showing confirmation');
      
      if (needsLogin === 'true') {
        // Email verified but user needs to sign in
        showSuccess('Your email has been verified. Please sign in to continue.');
        
        // Open the auth modal in sign-in mode
        setAuthModalMode(AUTH_VIEWS.SIGN_IN);
        setShowAuthModal(true);
      } else {
        // Email verified and user already signed in
        showSuccess('Your email has been verified and you are now signed in.');
      }
      
      cleanUrl();
    } else if (verificationStatus === 'failed') {
      // Verification failed
      showError(errorMessage || 'There was a problem verifying your email. Please try again.');
      
      cleanUrl();
    } else if (authStatus && authStatus !== 'success') {
      // Handle other auth issues
      showError(errorMessage || 'There was a problem with authentication.');
      
      cleanUrl();
    }
    
    // Check for reset=true to trigger reset password flow
    if (urlParams.has('reset')) {
      setAuthModalMode(AUTH_VIEWS.FORGOT_PASSWORD);
      setShowAuthModal(true);
    }
    
    // Check for successful password reset
    if (urlParams.has('passwordReset') && urlParams.get('passwordReset') === 'success') {
      showSuccess("Password updated successfully! You can now sign in with your new password.", 5000);
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/');
    }
  };
  
  // Process URL parameters on initial load
  useEffect(() => {
    checkUrlParams();
  }, []);
  
  // Log state changes when debug flag is enabled
  useEffect(() => {
      logStateTransition('useAuthModalState', 'showAuthModal', null, showAuthModal);
  }, [showAuthModal]);
  
  useEffect(() => {
      logStateTransition('useAuthModalState', 'authModalMode', null, authModalMode);
  }, [authModalMode]);

  return {
    showAuthModal,
    authModalMode,
    setShowAuthModal,
    setAuthModalMode,
    checkUrlParams
  };
}

export default useAuthModalState; 