import React, { useState, useCallback, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import AuthModal from './AuthModal';
import { cn } from '../../lib/utils';
import { AUTH_VIEWS } from '../../lib/auth/constants';
import logger from '../../lib/logger';
import { clearAllVerificationState } from '../../lib/auth/utils';

/**
 * Authentication header component that displays the current authentication state
 * Uses non-blocking rendering to provide a smooth user experience
 */
const AuthHeader: React.FC = () => {
  const { 
    user, 
    status, 
    signOut,
    isAuthenticated,
    isLoading,
    hasInitialized
  } = useAuthStore();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<typeof AUTH_VIEWS[keyof typeof AUTH_VIEWS]>(AUTH_VIEWS.SIGN_IN);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  
  // Check for pending verification on mount
  useEffect(() => {
    try {
      // If user is already authenticated, clear any verification state
      if (isAuthenticated() && user) {
        clearAllVerificationState();
        setVerificationEmail(null);
        logger.debug('User already authenticated, cleared verification state');
        return;
      }
      
      const storedState = localStorage.getItem('verificationState');
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        const currentTime = Date.now();
        const expirationTime = parsedState.startTime + (30 * 60 * 1000); // 30 minutes
        
        if (currentTime < expirationTime && parsedState.email) {
          // Double-check user's auth status to prevent showing verification for authenticated users
          if (!isAuthenticated()) {
            setVerificationEmail(parsedState.email);
            logger.debug('Found pending verification in AuthHeader for:', parsedState.email);
          } else {
            // User is authenticated but verification state exists, clean it up
            clearAllVerificationState();
            logger.debug('Cleared stale verification state for authenticated user');
          }
        } else {
          // Verification state expired, clean it up
          clearAllVerificationState();
          logger.debug('Cleared expired verification state');
        }
      }
    } catch (error) {
      logger.error('Error checking pending verification in AuthHeader:', error);
      // In case of any error, clear the state to be safe
      clearAllVerificationState();
      setVerificationEmail(null);
    }
  }, [isAuthenticated, user]);
  
  // Create a memoized signOut handler
  const handleSignOut = useCallback(async () => {
    // Clear any verification state before signing out
    clearAllVerificationState();
    setVerificationEmail(null);
    
    await signOut();
  }, [signOut]);
  
  // Handle opening the modal for sign in
  const handleOpenSignInModal = useCallback(() => {
    // Don't show verification modal if user is already authenticated
    if (isAuthenticated() && user) {
      // Make sure any lingering verification state is cleared
      clearAllVerificationState();
      setVerificationEmail(null);
      logger.debug('Prevented showing verification modal for authenticated user');
      return;
    }
    
    // If there is a pending verification, show the verification view instead
    if (verificationEmail) {
      setAuthMode(AUTH_VIEWS.VERIFICATION);
      logger.info('Opening auth modal in verification mode due to pending verification');
    } else {
      setAuthMode(AUTH_VIEWS.SIGN_IN);
    }
    setShowAuthModal(true);
  }, [verificationEmail, isAuthenticated, user]);
  
  // Handle opening the modal for sign up
  const handleOpenSignUpModal = useCallback(() => {
    setAuthMode(AUTH_VIEWS.SIGN_UP);
    setShowAuthModal(true);
  }, []);
  
  // Handle closing the modal
  const handleCloseModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);
  
  // Close modal when authentication state changes to authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated]);
  
  // Render based on authentication status
  return (
    <div className="flex items-center">
      {isLoading() ? (
        // Show loading indicator until authentication is determined
        <div className="px-4 py-1.5">
          <div className="w-16 h-5 rounded-md bg-container animate-pulse"></div>
        </div>
      ) : isAuthenticated() && user ? (
        // User is authenticated, show profile and sign out button
        <div className="flex items-center space-x-3">
          <span className="text-sm text-tertiary">
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md",
              "bg-container text-secondary border border-app",
              "hover:bg-panel hover:border-app",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-brand-neutral-500 focus:ring-offset-2 focus:ring-offset-app"
            )}
          >
            Sign Out
          </button>
        </div>
      ) : hasInitialized() ? (
        // User is definitely not authenticated, show sign in button only
        <div className="flex space-x-2 bg-brand-gradient rounded-md">
          <button
            onClick={handleOpenSignInModal}
            className={cn( 
              "px-4 py-1.5 text-sm font-medium",
              "text-white",
              "hover:bg-brand-primary-600",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-2 focus:ring-offset-app"
            )}
          >
            Sign In
          </button>
        </div>
      ) : (
        // We're still waiting for initial auth check, show nothing
        <div className="px-4 py-1.5">
          <div className="w-16 h-5 rounded-md bg-container animate-pulse"></div>
        </div>
      )}
      
      {/* Render the auth modal when needed with the appropriate initial mode */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={handleCloseModal}
          initialView={authMode}
          verificationEmail={verificationEmail}
        />
      )}
    </div>
  );
};

export default AuthHeader; 