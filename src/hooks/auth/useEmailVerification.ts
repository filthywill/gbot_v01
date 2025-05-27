import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';
import logger from '../../lib/logger';
import { clearAllVerificationState } from '../../lib/auth/utils';
import { logStateTransition } from '../../lib/auth/stateSync';
import AUTH_CONFIG from '../../lib/auth/config';
import { AUTH_VIEWS } from '../../lib/auth/constants';

/**
 * Creates a safe verification link that protects against email scanners
 * Email scanners can click verification links, invalidating them before users open the email
 * This creates an intermediary step to protect the actual token
 */
export const createSafeVerificationLink = (originalLink: string): string => {
  // Instead of directly using the token in the URL, create a redirect
  const encodedLink = encodeURIComponent(originalLink);
  return `${window.location.origin}/auth/verify-redirect?link=${encodedLink}`;
};

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

// Add optional parameters for modal control
export interface UseEmailVerificationOptions {
  setShowAuthModal?: (show: boolean) => void;
  setAuthModalMode?: (mode: typeof AUTH_VIEWS[keyof typeof AUTH_VIEWS]) => void;
}

/**
 * Hook for managing the email verification flow
 * Extracts email verification logic from App.tsx
 */
export function useEmailVerification(options: UseEmailVerificationOptions = {}): UseEmailVerificationReturn {
  // Extract optional modal control functions
  const { setShowAuthModal, setAuthModalMode } = options;
  
  // Using new email verification hook implementation
  
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
      setVerificationError(null); // Reset any previous errors
      
      try {
        // Save email for login form in case they need to sign in manually later
        setLastUsedEmail(emailFromSearch);
        setRememberMe(true);
        
        // Enhanced error handling with retries for token exchange
        let success = false;
        let attempts = 0;
        const maxAttempts = AUTH_CONFIG.maxTokenExchangeRetries;
        
        while (!success && attempts < maxAttempts) {
          attempts++;
          try {
            const { error: sessionError } = await supabase.auth.exchangeCodeForSession(tokenFromSearch);
            
            if (sessionError) {
              logger.warn(`Token exchange attempt ${attempts} failed:`, sessionError);
              
              if (attempts < maxAttempts) {
                // Wait before retry using configured timeout
                await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.tokenExchangeRetryDelay));
                continue;
              }
              
              // If all attempts fail, try fallback method
              logger.error('Error exchanging code for session, falling back to verifyOtp:', sessionError);
              
              const { error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: tokenFromSearch,
                type: 'signup'
              });
              
              if (verifyError) {
                logger.error('Error verifying email with verifyOtp:', verifyError);
                throw verifyError;
              }
            }
            
            success = true;
            logger.info('Email verified successfully!');
          } catch (exchangeError) {
            if (attempts >= maxAttempts) {
              logger.error('Failed to exchange token after multiple attempts:', exchangeError);
              throw exchangeError;
            }
            // Continue to next attempt
          }
        }
        
        // Use a more robust approach to refresh the auth state
        const authStore = useAuthStore.getState();
        
        // Clear auth state first to ensure a clean reload
        authStore.setUser(null);
        
        // Wait a moment for auth state to clear - use configured delay
        await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.stateTransitionDelay));
        
        // Then reinitialize auth
        await authStore.initialize();
        
        // Check if the user is authenticated after initialization
        const { user, status } = useAuthStore.getState();
        logger.info('Auth state after verification:', { status, hasUser: !!user });
        
        // Clear verification state now that user is verified
        setVerificationEmail(null);
        setPendingVerification(false);

        // Store a completed verification state to prevent banner reappearance
        try {
          const completedState = {
            email: emailFromSearch,
            startTime: Date.now(),
            verificationCompleted: true,
            completedAt: Date.now()
          };
          localStorage.setItem('verificationState', JSON.stringify(completedState));
          localStorage.setItem('verificationEmail', emailFromSearch);
          logger.debug('Stored completed verification state');
          
          // Clear it after a delay to ensure processing
          setTimeout(() => {
            clearAllVerificationState();
            logger.debug('Cleared verification state after successful verification');
          }, 500);
        } catch (error) {
          logger.error('Error storing verification completion state:', error);
          clearAllVerificationState();
        }
        
        // Show success modal - don't show sign-in modal
        setShowVerificationModal(true);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Exception during verification:', errorMessage);
        setVerificationError(errorMessage);
        
        // Reset verification state on error
        setPendingVerification(false);
      } finally {
        setIsVerifying(false);
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, '/');
      }
    }
  };

  // Handle resuming verification from banner
  const handleResumeVerification = (email: string) => {
    logger.debug('Resuming verification for email:', email);
    
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
    
    // Open the auth modal in verification mode if the modal control functions are provided
    if (setShowAuthModal && setAuthModalMode) {
      logger.info('Opening auth modal in verification mode for email:', email);
      setAuthModalMode(AUTH_VIEWS.VERIFICATION);
      setShowAuthModal(true);
    } else {
      logger.warn('Modal control functions not provided to useEmailVerification, cannot open verification modal');
    }
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