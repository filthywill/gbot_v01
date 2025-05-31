import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import useAuthStore from '../../store/useAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';
import useGoogleAuthStore from '../../store/useGoogleAuthStore';
import logger from '../../lib/logger';
import { AUTH_VIEWS, AUTH_ERROR_MESSAGES } from '../../lib/auth/constants';
import { AuthModalProps } from '../../lib/auth/types';
import { cn } from '../../lib/utils';
import { checkAuthAndClose, clearAllVerificationState } from '../../lib/auth/utils';
import { SignIn, SignUp, ResetPassword } from './flows';
import VerificationCodeInput from './VerificationCodeInput';

// Use the type from AUTH_VIEWS
type AuthMode = typeof AUTH_VIEWS[keyof typeof AUTH_VIEWS];

export default function AuthModal({
  isOpen,
  onClose,
  initialView = AUTH_VIEWS.SIGN_IN,
  initialEmail = '',
  verificationEmail = null,
}: AuthModalProps) {
  // Get auth state to check if user is already authenticated
  const authStore = useAuthStore();
  const isUserAuthenticated = authStore.status === 'AUTHENTICATED' && authStore.user !== null;
  
  // Safety check: If user is already authenticated and the modal is in verification mode,
  // close the modal and clear verification state
  useEffect(() => {
    if (isOpen && initialView === AUTH_VIEWS.VERIFICATION && isUserAuthenticated) {
      logger.info('User already authenticated but verification modal was shown, closing modal');
      clearAllVerificationState();
      onClose();
    }
  }, [isOpen, initialView, isUserAuthenticated, onClose]);
  
  const [mode, setMode] = useState<AuthMode>(initialView);
  const [email, setEmail] = useState(initialEmail);
  const [hasPrefilledEmail, setHasPrefilledEmail] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  
  // For verification code flow - store the verification email
  // First check props, then localStorage
  const [localVerificationEmail, setLocalVerificationEmail] = useState<string | null>(
    verificationEmail || window.localStorage.getItem('verificationEmail')
  );

  // Combined verification email - prop takes precedence
  const effectiveVerificationEmail = verificationEmail || localVerificationEmail;
  
  // Log critical verification information for debugging
  useEffect(() => {
    if (isOpen && initialView === AUTH_VIEWS.VERIFICATION) {
      console.log('AuthModal opened in VERIFICATION mode:', {
        propVerificationEmail: verificationEmail,
        localStorageEmail: window.localStorage.getItem('verificationEmail'),
        localVerificationEmail,
        effectiveVerificationEmail
      });
    }
  }, [isOpen, initialView, verificationEmail, localVerificationEmail, effectiveVerificationEmail]);
  
  // Get stores
  const { resetError, error } = useAuthStore();
  const authStatus = authStore.status;
  const { lastUsedEmail } = usePreferencesStore();
  const { isSDKLoaded } = useGoogleAuthStore();
  
  // Ref for the modal content
  const modalRef = React.useRef<HTMLDivElement>(null);
  
  // When the modal opens, prefill email if needed
  useEffect(() => {
    if (isOpen) {
      // Reset errors when opening the modal
      resetError();
      
      // Different behavior based on mode
      if ((mode === AUTH_VIEWS.SIGN_IN || mode === AUTH_VIEWS.SIGN_UP) && !hasPrefilledEmail) {
        // For sign-in, restore remembered email
        const emailToUse = initialEmail || lastUsedEmail;
        
        // Only set the email field once on initial open
        if (emailToUse) {
          setEmail(emailToUse);
          setIsEmailValid(true); // Assume valid for prefilled email
          setHasPrefilledEmail(true); // Mark as prefilled to prevent overrides
        }
      }
      
      // Check for stored verification state if we don't already have a verificationEmail
      if (!verificationEmail) {
        try {
          const storedVerificationState = localStorage.getItem('verificationState');
          if (storedVerificationState) {
            const verificationState = JSON.parse(storedVerificationState);
            
            // Check if verification state is still valid (less than 30 minutes old)
            const isValid = verificationState.startTime && 
              (Date.now() - verificationState.startTime < 30 * 60 * 1000);
            
            if (isValid && verificationState.email) {
              logger.debug('Resuming verification from stored state', { email: verificationState.email });
              
              // Restore the verification email
              setLocalVerificationEmail(verificationState.email);
              
              // Switch to verification mode
              setMode(AUTH_VIEWS.VERIFICATION);
              
              // Update the verification timestamp
              const updatedState = {
                ...verificationState,
                resumed: true,
                resumeTime: Date.now()
              };
              localStorage.setItem('verificationState', JSON.stringify(updatedState));
              
              // Also store in verificationEmail for persistence
              window.localStorage.setItem('verificationEmail', verificationState.email);
            } else {
              // Verification state is too old or invalid, clear it
              logger.debug('Clearing expired verification state');
              localStorage.removeItem('verificationState');
              localStorage.removeItem('verificationEmail');
            }
          }
        } catch (error) {
          logger.error('Error processing stored verification state:', error);
          localStorage.removeItem('verificationState');
          localStorage.removeItem('verificationEmail');
        }
      }
    } else {
      // Reset the flag when modal closes
      setHasPrefilledEmail(false);
    }
  }, [isOpen, mode, initialEmail, lastUsedEmail, hasPrefilledEmail, resetError, verificationEmail]);
  
  // Update when initialView prop changes
  useEffect(() => {
    if (initialView) {
      setMode(initialView);
    }
  }, [initialView]);
  
  // Update verificationEmail when prop changes
  useEffect(() => {
    if (verificationEmail) {
      setLocalVerificationEmail(verificationEmail);
      // Store in localStorage for persistence 
      window.localStorage.setItem('verificationEmail', verificationEmail);
      // Automatically switch to verification mode when verification email is set
      setMode(AUTH_VIEWS.VERIFICATION);
      logger.debug('Switching to verification mode due to verificationEmail:', verificationEmail);
    }
  }, [verificationEmail]);
  
  // Add useEffect to check for authenticated user and close modal
  useEffect(() => {
    if (isOpen) {
      checkAuthAndClose(onClose);
    }
  }, [isOpen, authStatus, onClose]);
  
  // Handle view changes - changing to accept string instead of AuthMode
  const handleViewChange = (newMode: string) => {
    setMode(newMode as AuthMode);
    resetError();
  };
  
  // Handle email validation from child components
  const handleEmailValidation = (isValid: boolean) => {
    setIsEmailValid(isValid);
  };
  
  // Handle signup completion
  const handleSignUpComplete = () => {
    // Store the email for verification
    setLocalVerificationEmail(email);
    
    // Store verification state in localStorage for persistence
    const verificationState = {
      email: email,
      startTime: Date.now(),
      attempted: true
    };
    localStorage.setItem('verificationState', JSON.stringify(verificationState));
    localStorage.setItem('verificationEmail', email || '');
    
    // Switch to verification view instead of signup confirmation
    setMode(AUTH_VIEWS.VERIFICATION);
  };
  
  // Handle successful auth
  const handleAuthSuccess = useCallback(() => {
    // Clear any verification state
    clearAllVerificationState();
    
    logger.info('Authentication successful, closing modal');
    onClose();
  }, [onClose]);
  
  // Handle verification cancel
  const handleVerificationCancel = () => {
    // Store verification state in localStorage before switching to sign in
    if (effectiveVerificationEmail) {
      const verificationState = {
        email: effectiveVerificationEmail,
        startTime: Date.now(),
        attempted: true,
        canceled: true
      };
      localStorage.setItem('verificationState', JSON.stringify(verificationState));
      localStorage.setItem('verificationEmail', effectiveVerificationEmail);
      logger.info('Saved verification state on cancel', { email: effectiveVerificationEmail });
    }
    
    // Switch back to sign in
    setMode(AUTH_VIEWS.SIGN_IN);
  };
  
  // After mounting, check if we need to go to verification mode
  useEffect(() => {
    if (effectiveVerificationEmail && mode !== AUTH_VIEWS.VERIFICATION) {
      logger.info('Setting to verification mode based on email:', effectiveVerificationEmail);
      setMode(AUTH_VIEWS.VERIFICATION);
      
      // Store in localStorage for persistence
      if (!window.localStorage.getItem('verificationEmail') && effectiveVerificationEmail) {
        window.localStorage.setItem('verificationEmail', effectiveVerificationEmail);
      }
    }
  }, [effectiveVerificationEmail, mode]);

  // Clear the verification email when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setLocalVerificationEmail(null);
    }
  }, [isOpen]);
  
  // Render the content based on the current mode
  function renderContent() {
    // First check if we have a verification email, regardless of mode
    if (effectiveVerificationEmail) {
      logger.info('Rendering VerificationCodeInput with email:', effectiveVerificationEmail);
      return (
        <VerificationCodeInput
          email={effectiveVerificationEmail}
          onSuccess={handleAuthSuccess}
          onCancel={handleVerificationCancel}
          onClose={onClose}
        />
      );
    }
    
    // Add debugging for verification mode with no email
    if (mode === AUTH_VIEWS.VERIFICATION) {
      console.error('In VERIFICATION mode but no email is available:', {
        mode,
        verificationEmail,
        localVerificationEmail,
        effectiveVerificationEmail,
        localStorage: {
          verificationEmail: window.localStorage.getItem('verificationEmail'),
          verificationState: window.localStorage.getItem('verificationState')
        }
      });
    }
    
    if (mode === AUTH_VIEWS.SIGNUP_CONFIRMATION) {
      return (
        <>
          <h2 className="text-xl font-semibold text-brand-neutral-900 mb-4">
            Check Your Email
          </h2>
          
          <div className="space-y-5">
            <div className="bg-status-success-light border border-status-success-border text-status-success px-4 py-3 rounded-md text-sm">
              <strong>Account created!</strong> Please check your email for a verification link.
            </div>
            
            <p className="text-brand-neutral-600 text-sm">
              We've sent you an email with a link to verify your account. Once verified, you'll be able to sign in.
            </p>
            
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleViewChange(AUTH_VIEWS.SIGN_IN)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </>
      );
    }
    
    switch (mode) {
      case AUTH_VIEWS.SIGN_IN:
        return (
          <SignIn
            email={email || ''}
            setEmail={setEmail}
            onEmailValidation={handleEmailValidation}
            onViewChange={handleViewChange}
            onSuccess={handleAuthSuccess}
            onClose={onClose}
          />
        );
      case AUTH_VIEWS.SIGN_UP:
        return (
          <SignUp
            email={email || ''}
            setEmail={setEmail}
            onEmailValidation={handleEmailValidation}
            onViewChange={handleViewChange}
            onSignUpComplete={handleSignUpComplete}
            onClose={onClose}
          />
        );
      case AUTH_VIEWS.FORGOT_PASSWORD:
        return (
          <ResetPassword
            email={email || ''}
            setEmail={setEmail}
            onEmailValidation={handleEmailValidation}
            onViewChange={handleViewChange}
            onClose={onClose}
          />
        );
      case AUTH_VIEWS.VERIFICATION:
        // This case is handled at the top of the function when verificationEmail exists
        return (
          <div className="p-4 text-brand-neutral-500">
            Email verification error. Please try signing up again.
          </div>
        );
      default:
        return (
          <div className="p-4 text-brand-neutral-500">
            Unknown view: {mode}
          </div>
        );
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="p-6" ref={modalRef}>
          {error && (
            <div className="mb-4 bg-status-error-light border border-status-error-border text-status-error px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 