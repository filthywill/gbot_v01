import React, { useState, useEffect } from 'react';
import { SendIcon, X } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import usePreferencesStore from '../../../store/usePreferencesStore';
import { AUTH_VIEWS } from '../../../lib/auth/constants';
import logger from '../../../lib/logger';

interface ResetPasswordProps {
  email: string;
  setEmail: (email: string) => void;
  onEmailValidation: (isValid: boolean) => void;
  onViewChange: (view: string) => void;
  onClose?: () => void;
}

/**
 * ResetPassword Component
 * Handles the password reset flow in the authentication process
 */
const ResetPassword: React.FC<ResetPasswordProps> = ({
  email,
  setEmail,
  onEmailValidation,
  onViewChange,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  
  const { sendResetOtp } = useAuthStore();
  const { setLastUsedEmail } = usePreferencesStore();
  
  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    onEmailValidation(isValid);
  }, [email, onEmailValidation]);
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('Sending password reset code to:', email);
      
      // Remember this email
      setLastUsedEmail(email);
      
      // Send reset password OTP
      const success = await sendResetOtp(email);
      
      if (!success) {
        throw new Error('Failed to send password reset code. Please try again.');
      }
      
      // If we get here, the reset code was sent successfully
      setResetSent(true);
      logger.info('Password reset code sent successfully');
    } catch (err) {
      logger.error('Password reset code error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className="relative mb-4">
        <h2 className="text-xl font-semibold text-brand-neutral-900 mb-2">
          Reset Password
        </h2>
        
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="absolute -top-2 -right-2 text-brand-neutral-400 hover:text-brand-primary-500 transition-colors p-1 hover:bg-brand-neutral-100 rounded-full"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      {resetSent ? (
        <div className="space-y-5">
          <div className="bg-status-success-light border border-status-success-border text-status-success px-4 py-3 rounded-md text-sm">
            <strong>Reset code sent!</strong> Check your inbox for a code to reset your password.
          </div>
          
          <p className="text-brand-neutral-600 text-sm">
            If you don't see the email, please check your spam folder or request another reset code.
          </p>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => window.location.href = '/reset-code'}
              className="flex-1 bg-brand-gradient text-white rounded-md py-2.5 px-4 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              Enter Reset Code
            </button>
            
            <button
              type="button"
              onClick={() => {
                setResetSent(false);
                setError(null);
              }}
              className="flex-1 bg-white border border-brand-neutral-300 text-brand-neutral-700 rounded-md py-2.5 px-4 text-center text-sm font-medium hover:bg-brand-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              Try Again
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => onViewChange(AUTH_VIEWS.SIGN_IN)}
              className="text-brand-primary-600 hover:text-brand-primary-500 text-sm"
            >
              Back to sign in
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          {error && (
            <div className="bg-status-error-light border border-status-error-border text-status-error px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label htmlFor="reset-email" className="block text-sm font-medium text-brand-neutral-600">
              Email
            </label>
            <p className="text-sm text-brand-neutral-400 mb-1">
              Enter your email to receive a password reset code
            </p>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500 text-brand-neutral-900 h-11"
              placeholder="Your email address"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center bg-brand-gradient text-white rounded-md py-2.5 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                <span className="flex items-center">
                  <SendIcon className="h-4 w-4 mr-2" />
                  Send Reset Code
                </span>
              )}
            </button>
          </div>
          
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => onViewChange(AUTH_VIEWS.SIGN_IN)}
              className="text-brand-primary-600 hover:text-brand-primary-500 text-sm"
            >
              Back to sign in
            </button>
          </div>
        </form>
      )}
    </>
  );
};

export default ResetPassword; 