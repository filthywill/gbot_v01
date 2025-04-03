import React, { useState, useCallback, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import AuthModal from './AuthModal';
import { cn } from '../../lib/utils';

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
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Create a memoized signOut handler
  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);
  
  // Handle opening the modal for sign in
  const handleOpenSignInModal = useCallback(() => {
    setAuthMode('signin');
    setShowAuthModal(true);
  }, []);
  
  // Handle opening the modal for sign up
  const handleOpenSignUpModal = useCallback(() => {
    setAuthMode('signup');
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
          <div className="w-16 h-5 rounded-md bg-zinc-800 animate-pulse"></div>
        </div>
      ) : isAuthenticated() && user ? (
        // User is authenticated, show profile and sign out button
        <div className="flex items-center space-x-3">
          <span className="text-sm text-zinc-400">
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md",
              "bg-zinc-800 text-zinc-300 border border-zinc-700",
              "hover:bg-zinc-700 hover:border-zinc-600",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            )}
          >
            Sign Out
          </button>
        </div>
      ) : hasInitialized() ? (
        // User is definitely not authenticated, show sign in button only
        <div className="flex space-x-2">
          <button
            onClick={handleOpenSignInModal}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md",
              "bg-indigo-600 text-white",
              "hover:bg-indigo-700",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            )}
          >
            Sign In
          </button>
        </div>
      ) : (
        // We're still waiting for initial auth check, show nothing
        <div className="px-4 py-1.5">
          <div className="w-16 h-5 rounded-md bg-zinc-800 animate-pulse"></div>
        </div>
      )}
      
      {/* Render the auth modal when needed with the appropriate initial mode */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={handleCloseModal}
          initialMode={authMode}
        />
      )}
    </div>
  );
};

export default AuthHeader; 