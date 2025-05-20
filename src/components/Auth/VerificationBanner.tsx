import React, { useEffect, useState } from 'react';
import { X, Clock, Mail } from 'lucide-react';
import logger from '../../lib/logger';
import { useTheme } from '../../hooks/useTheme';
import BrandButton from '../ui/brand-button';

interface VerificationBannerProps {
  onResumeVerification: (email: string) => void;
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
  verificationCompleted?: boolean;
}

interface PasswordRecoveryState {
  active: boolean;
  startTime: number;
  email: string | null;
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
  const [isPasswordRecoveryActive, setIsPasswordRecoveryActive] = useState(false);
  const { getGradientClass } = useTheme();

  // Check for verification state on mount and when forceShow changes
  useEffect(() => {
    try {
      // If already dismissed by user, don't show again in this session
      if (dismissed) return;
      
      // If user is authenticated, don't show banner and clear verification state
      if (isAuthenticated) {
        localStorage.removeItem('verificationState');
        localStorage.removeItem('verificationEmail');
        setStoredEmail(null);
        return;
      }
      
      // Check if password recovery is active - if so, don't show the verification banner
      const passwordRecoveryState = localStorage.getItem('passwordRecoveryState');
      if (passwordRecoveryState) {
        try {
          const recoveryState = JSON.parse(passwordRecoveryState) as PasswordRecoveryState;
          // Check if recovery state is valid (less than 30 min old)
          const currentTime = Date.now();
          const expirationTime = recoveryState.startTime + (30 * 60 * 1000); // 30 minutes
          
          if (currentTime < expirationTime && recoveryState.active) {
            logger.debug('Password recovery is active, not showing verification banner');
            setIsPasswordRecoveryActive(true);
            setStoredEmail(null);
            return;
          } else {
            // Clear expired recovery state
            localStorage.removeItem('passwordRecoveryState');
            setIsPasswordRecoveryActive(false);
          }
        } catch (error) {
          logger.error('Invalid password recovery state found in localStorage', error);
          localStorage.removeItem('passwordRecoveryState');
        }
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
        try {
          const parsedState = JSON.parse(storedState) as VerificationState;
          
          // Check for completed verification flag
          if (parsedState.verificationCompleted === true) {
            logger.debug('Verification was previously completed, not showing banner');
            localStorage.removeItem('verificationState');
            localStorage.removeItem('verificationEmail');
            setStoredEmail(null);
            return;
          }
          
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
            localStorage.removeItem('verificationEmail');
            setStoredEmail(null);
          }
        } catch (error) {
          // Invalid JSON, remove the corrupted state
          logger.error('Invalid verification state found in localStorage', error);
          localStorage.removeItem('verificationState');
          localStorage.removeItem('verificationEmail');
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
  if (dismissed || isAuthenticated || isPasswordRecoveryActive || (!forceShow && !storedEmail)) {
    return null;
  }

  // Determine which email to display
  const displayEmail = email || storedEmail || '';
  if (!displayEmail) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-brand-gradient text-white p-3 shadow-md">
      <div className="max-w-[800px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center mb-2 sm:mb-0">
          <Mail className="hidden sm:block h-5 w-5 mr-2 flex-shrink-0" />
          <div className="flex flex-wrap sm:flex-row sm:items-center">
            <span className="text-sm sm:text-base whitespace-nowrap">
              Verification pending for 
            </span>
            <span className="text-sm sm:text-base font-medium ml-1">
              <span className="truncate max-w-[150px] sm:max-w-none inline-block align-bottom">{displayEmail}</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center">
            <BrandButton
              variant="white"
              size="sm"
              onClick={() => onResumeVerification(displayEmail)}
              className="whitespace-nowrap"
            >
              Resume Verification
            </BrandButton>
            
            {timeLeft > 0 && (
              <span className="flex items-center text-xs bg-white bg-opacity-20 px-2 py-1 rounded ml-2 flex-shrink-0">
                <Clock className="h-3 w-3 mr-1" /> {formatTimeLeft()}
              </span>
            )}
          </div>
          
          <button
            onClick={() => {
              setDismissed(true);
              logger.debug('Banner dismissed by user');
              // Don't remove the state from storage, just hide the banner
            }}
            className="text-white hover:text-gray-200 ml-3"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationBanner; 