import React, { useState, useCallback, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import AuthModal from './AuthModal';
import { cn } from '../../lib/utils';
import { AUTH_VIEWS, AuthView } from '../../lib/auth/constants';
import ProfileMenu from './ProfileMenu';

/**
 * Authentication header component that displays the current authentication state
 * Uses non-blocking rendering with fixed dimensions to prevent layout shifts
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
  const [authView, setAuthView] = useState<AuthView>(AUTH_VIEWS.SIGN_IN);
  
  // Create a memoized signOut handler
  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);
  
  // Handle opening the modal for sign in
  const handleOpenSignInModal = useCallback(() => {
    setAuthView(AUTH_VIEWS.SIGN_IN);
    setShowAuthModal(true);
  }, []);
  
  // Handle opening the modal for sign up
  const handleOpenSignUpModal = useCallback(() => {
    setAuthView(AUTH_VIEWS.SIGN_UP);
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
  
  // Fixed container dimensions to prevent layout shifts
  const containerClasses = cn(
    "flex items-center justify-end", // Consistent alignment
    "min-h-[40px]", // Minimum height to prevent collapse
    "min-w-[120px]" // Minimum width to prevent horizontal shifting
  );
  
  // Render based on authentication status
  return (
    <div className={containerClasses}>
      {isLoading() ? (
        // Show loading indicator with fixed dimensions matching final content
        <div className="flex items-center space-x-3">
          {/* Email placeholder */}
          <div className="w-20 h-4 rounded-md bg-zinc-800 animate-pulse"></div>
          {/* Avatar placeholder - matches Avatar component dimensions */}
          <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 animate-pulse flex-shrink-0"></div>
        </div>
      ) : isAuthenticated() && user ? (
        // User is authenticated, show profile menu dropdown
        <ProfileMenu user={user} onSignOut={handleSignOut} />
      ) : hasInitialized() ? (
        // User is definitely not authenticated, show sign in button with fixed dimensions
        <div className="flex justify-end">
          <button
            onClick={handleOpenSignInModal}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md",
              "bg-indigo-600 text-white",
              "hover:bg-indigo-700",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900",
              "min-w-[70px] h-[32px]", // Fixed dimensions to match loading state
              "flex items-center justify-center" // Center content
            )}
          >
            Sign In
          </button>
        </div>
      ) : (
        // We're still waiting for initial auth check, show loading with same dimensions
        <div className="flex items-center space-x-3">
          {/* Email placeholder */}
          <div className="w-20 h-4 rounded-md bg-zinc-800 animate-pulse"></div>
          {/* Avatar placeholder - matches Avatar component dimensions */}
          <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 animate-pulse flex-shrink-0"></div>
        </div>
      )}
      
      {/* Render the auth modal when needed with the appropriate initial mode */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={handleCloseModal}
          initialView={authView}
        />
      )}
    </div>
  );
};

export default AuthHeader; 