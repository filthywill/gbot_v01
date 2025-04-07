import React, { useEffect, useState } from 'react';
import { X, Clock, Mail } from 'lucide-react';
import logger from '../../lib/logger';

interface VerificationBannerProps {
  onResumeVerification: () => void;
  forceShow?: boolean;
  email?: string; // Current verification email
  isAuthenticated?: boolean; // Whether the user is authenticated
}

interface VerificationState {
  email: string;
  startTime: number;
  attempted: boolean;
  resumed?: boolean;
  resumeTime?: number;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ 
  onResumeVerification,
  forceShow = false,
  email,
  isAuthenticated = false
}) => {
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);

  // Check for verification state on mount and when forceShow changes
  useEffect(() => {
    try {
      // If already dismissed by user, don't show again in this session
      if (dismissed) return;
      
      // If user is authenticated, don't show banner
      if (isAuthenticated) {
        localStorage.removeItem('verificationState');
        return;
      }

      // First check if we have an active verification email from props
      if (forceShow && email) {
        setStoredEmail(email);
        logger.debug('Banner showing due to active verification:', { email });
        return;
      }

      // Then check localStorage as fallback
      const storedState = localStorage.getItem('verificationState');
      if (storedState) {
        const parsedState = JSON.parse(storedState) as VerificationState;
        
        // Check if state is valid (less than 30 min old)
        const currentTime = Date.now();
        const expirationTime = parsedState.startTime + (30 * 60 * 1000); // 30 minutes
        
        if (currentTime < expirationTime) {
          setStoredEmail(parsedState.email);
          setTimeLeft(Math.floor((expirationTime - currentTime) / 1000)); // seconds left
          logger.debug('Banner showing due to stored state:', { email: parsedState.email });
        } else {
          // Clear expired state
          localStorage.removeItem('verificationState');
          setStoredEmail(null);
        }
      }
    } catch (error) {
      logger.error('Error processing verification state:', error);
    }
  }, [dismissed, isAuthenticated, forceShow, email]);

  // Update the countdown timer
  useEffect(() => {
    if (!timeLeft) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem('verificationState');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time remaining
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Main banner visibility logic - simplified
  if (dismissed || isAuthenticated || (!forceShow && !storedEmail)) {
    return null;
  }

  // Determine which email to display
  const displayEmail = email || storedEmail || '';
  if (!displayEmail) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between">
      <div className="flex items-center mb-2 sm:mb-0 w-full sm:w-auto">
        <Mail className="hidden sm:block h-5 w-5 mr-2 flex-shrink-0" />
        <div className="flex flex-wrap sm:flex-row sm:items-center">
          <span className="text-sm sm:text-base whitespace-nowrap">
            Verification pending for 
          </span>
          <span className="text-sm sm:text-base font-medium ml-1">
            <span className="truncate max-w-[150px] sm:max-w-none inline-block align-bottom">{displayEmail}</span>
          </span>
        </div>
        {timeLeft > 0 && (
          <span className="flex items-center text-xs bg-white bg-opacity-20 px-2 py-1 rounded ml-2 flex-shrink-0">
            <Clock className="h-3 w-3 mr-1" /> {formatTimeLeft()}
          </span>
        )}
      </div>
      
      <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end">
        <button
          onClick={onResumeVerification}
          className="bg-white text-indigo-600 px-3 py-1 rounded-md text-sm font-medium mr-3 hover:bg-opacity-90 transition-colors whitespace-nowrap"
        >
          Resume Verification
        </button>
        
        <button
          onClick={() => {
            setDismissed(true);
            logger.debug('Banner dismissed by user');
            // Don't remove the state from storage, just hide the banner
          }}
          className="text-white hover:text-gray-200"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default VerificationBanner; 