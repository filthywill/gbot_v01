import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import AuthModal from '../components/Auth/AuthModal';
import usePreferencesStore from '../store/usePreferencesStore';
import useAuthStore from '../store/useAuthStore';
import logger from '../lib/logger';

const EmailVerificationSuccess: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const { lastUsedEmail } = usePreferencesStore();
  const { user, isAuthenticated } = useAuthStore();
  
  // Check if user is already authenticated (via the callback verification)
  const isAlreadyLoggedIn = isAuthenticated();
  
  // Auto-show the sign-in modal after a brief delay to allow the user to read the message
  // But only if they're not already authenticated
  useEffect(() => {
    if (!isAlreadyLoggedIn) {
      const timer = setTimeout(() => {
        if (!showSignIn) {
          handleSignIn();
        }
      }, 3000); // Show sign-in modal after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showSignIn, isAlreadyLoggedIn]);
  
  const handleSignIn = () => {
    setShowSignIn(true);
    logger.info('Opening sign in modal after email verification');
  };
  
  const handleCloseModal = () => {
    setShowSignIn(false);
  };
  
  const handleContinue = () => {
    window.location.href = '/';
  };
  
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Email Verified!</h1>
          <p className="mt-2 text-gray-600">
            Your account has been successfully activated.
          </p>
        </div>
        
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Account successfully created</p>
          {lastUsedEmail && (
            <p className="mt-1">Your account <strong>{lastUsedEmail}</strong> is ready to use!</p>
          )}
          {isAlreadyLoggedIn && (
            <p className="mt-2 font-medium">You are now signed in!</p>
          )}
        </div>
        
        {isAlreadyLoggedIn ? (
          <button
            onClick={handleContinue}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium 
              text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 
              hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
          >
            Continue to App
          </button>
        ) : (
          <>
            <button
              onClick={handleSignIn}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium 
                text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 
                hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
            >
              Sign In Now
            </button>
            
            <div className="mt-4 text-center text-xs text-gray-400">
              <p>The sign-in form will open automatically in a few seconds...</p>
            </div>
          </>
        )}
        
        <p className="mt-4 text-center text-sm text-gray-500">
          Or return to the <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">home page</a>
        </p>
      </div>
      
      {showSignIn && !isAlreadyLoggedIn && (
        <AuthModal 
          isOpen={showSignIn} 
          onClose={handleCloseModal}
          initialMode="signin"
        />
      )}
    </div>
  );
};

export default EmailVerificationSuccess; 