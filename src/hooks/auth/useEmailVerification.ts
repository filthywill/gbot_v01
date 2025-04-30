import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';
import logger from '../../lib/logger';
import { clearAllVerificationState } from '../../lib/auth/utils';
import { logStateTransition } from '../../lib/auth/stateSync';

/**
 * Custom hook for managing email verification flow
 * Handles verification state, modal visibility, and verification process.
 */
export interface UseEmailVerificationReturn {
  // State variables
  showVerificationModal: boolean;
  verificationEmail: string | null;
  verificationError: string | null;
  isVerifying: boolean;
  pendingVerification: boolean;
  
  // Actions
  setShowVerificationModal: (value: boolean) => void;
  setVerificationEmail: (value: string | null) => void;
  setVerificationError: (value: string | null) => void;
  setIsVerifying: (value: boolean) => void;
  setPendingVerification: (value: boolean) => void;
  
  // Functions
  checkForVerification: () => Promise<void>;
  handleResumeVerification: (email: string) => void;
}

/**
 * Hook for managing the email verification flow
 * Extracts email verification logic from App.tsx
 */
export function useEmailVerification(): UseEmailVerificationReturn {
  // Debug logging to confirm new implementation is used
  console.log('🔄 [NEW IMPLEMENTATION] Using new email verification hook');
  
  const { initialize, user } = useAuthStore();
  const { setLastUsedEmail, setRememberMe } = usePreferencesStore();
  
  // Modal state for verification success
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // State for resuming verification
  const [pendingVerification, setPendingVerification] = useState(false);

  // Handle email verification
  const checkForVerification = async () => {
    // First check for hash fragments in the URL (Supabase uses these for email verification)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    // Get URL parameters - from either query string or hash fragment
    const tokenFromSearch = new URLSearchParams(window.location.search).get('token');
    const typeFromSearch = new URLSearchParams(window.location.search).get('type');
    const emailFromSearch = new URLSearchParams(window.location.search).get('email');
    const tokenFromHash = hashParams.get('access_token');
    const typeFromHash = hashParams.get('type');

    // Combine parameters (prefer hash if available)
    const token = tokenFromHash || tokenFromSearch;
    const type = typeFromHash || typeFromSearch;
    const email = emailFromSearch; // Email usually comes in search params for our custom flows

    logger.info('Checking for verification params:', { 
      token: token?.substring(0, 8), 
      type, 
      email 
    });

    // Check if this is our custom verification request with token param (non-Supabase magic link)
    // This part handles flows where WE put the token/type/email in the SEARCH parameters
    if (tokenFromSearch && (typeFromSearch === 'verification' || typeFromSearch === 'signup') && emailFromSearch) {
      logger.info('Detected CUSTOM verification parameters in SEARCH URL:', { token: tokenFromSearch.substring(0, 8), type: typeFromSearch, email: emailFromSearch });
      setIsVerifying(true);
      setVerificationEmail(emailFromSearch);
      
      try {
        // Save email for login form in case they need to sign in manually later
        setLastUsedEmail(emailFromSearch);
        setRememberMe(true);
        
        // The correct way to handle email verification in Supabase v2
        logger.info('Verifying email with token');
        
        // First try exchangeCodeForSession which is the recommended method
        try {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(tokenFromSearch);
          if (sessionError) {
            logger.error('Error exchanging code for session, falling back to verifyOtp:', sessionError);
            
            // Fallback to verifyOtp if exchangeCodeForSession fails
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: tokenFromSearch,
              type: 'signup'
            });
            
            if (verifyError) {
              logger.error('Error verifying email with verifyOtp:', verifyError);
              setVerificationError(verifyError.message);
              throw verifyError;
            }
          }
          
          logger.info('Email verified successfully!');
          
          // Refresh auth state to confirm the user is logged in
          await initialize();
          
          // Check if the user is authenticated after initialization
          const { user, status } = useAuthStore.getState();
          logger.info('Auth state after verification:', { status, hasUser: !!user });
          
          // Clear verification state now that user is verified
          setVerificationEmail(null);
          setPendingVerification(false);
          clearAllVerificationState();
          
          // Show success modal - don't show sign-in modal
          setShowVerificationModal(true);
        } catch (exchangeError) {
          logger.error('Failed to exchange token:', exchangeError);
          throw exchangeError;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Exception during verification:', errorMessage);
        setVerificationError(errorMessage);
      } finally {
        setIsVerifying(false);
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, '/');
      }
    }
  };

  // Handle resuming verification from banner
  const handleResumeVerification = (email: string) => {
    console.log('Resuming verification for email:', email);
    
    // Log state transitions for debugging
      logStateTransition('useEmailVerification', 'resumeVerification', { verificationEmail, pendingVerification }, { email, pendingVerification: true });
    
    // Save the verification state in localStorage
    const verificationState = {
      email: email,
      startTime: Date.now(),
      resumed: true,
      resumeTime: Date.now()
    };
    
    // Store both in localStorage to ensure consistency
    localStorage.setItem('verificationState', JSON.stringify(verificationState));
    localStorage.setItem('verificationEmail', email);
    
    // Then set the state
    setVerificationEmail(email);
  };

  // Check for pending verification on component mount
  useEffect(() => {
    try {
      const storedState = localStorage.getItem('verificationState');
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        const currentTime = Date.now();
        const expirationTime = parsedState.startTime + (30 * 60 * 1000); // 30 minutes
        
        if (currentTime < expirationTime) {
          setPendingVerification(true);
        } else {
          // Clear expired state
          localStorage.removeItem('verificationState');
          setPendingVerification(false);
        }
      }
    } catch (error) {
      logger.error('Error checking pending verification:', error);
    }
  }, []);

  // Add an effect to show the banner whenever the verificationEmail is set
  useEffect(() => {
    if (verificationEmail) {
      setPendingVerification(true);
    } else {
      // Clear the pending verification state when email is null
      setPendingVerification(false);
    }
    
      logStateTransition('useEmailVerification', 'verificationEmail', null, verificationEmail);
  }, [verificationEmail]);

  // Add this effect to clear verificationEmail when user becomes authenticated
  useEffect(() => {
    if (user) {
      // User is authenticated, clear verification email state
      setVerificationEmail(null);
      setPendingVerification(false);
      clearAllVerificationState();
      logger.info('User authenticated, cleared verification email state');
    }
  }, [user]);

  // Also ensure verification state is cleared when the modal is shown
  useEffect(() => {
    if (showVerificationModal) {
      // Clear all verification state when the success modal is shown
      setVerificationEmail(null);
      setPendingVerification(false);
      clearAllVerificationState();
      logger.info('Cleared all verification state when success modal was shown');
    }
    
      logStateTransition('useEmailVerification', 'showVerificationModal', null, showVerificationModal);
  }, [showVerificationModal]);

  return {
    showVerificationModal,
    verificationEmail,
    verificationError,
    isVerifying,
    pendingVerification,
    
    setShowVerificationModal,
    setVerificationEmail,
    setVerificationError,
    setIsVerifying,
    setPendingVerification,
    
    checkForVerification,
    handleResumeVerification
  };
}

export default useEmailVerification; 