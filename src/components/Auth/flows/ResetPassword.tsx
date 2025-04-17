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
  
  const { resetPassword } = useAuthStore();
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
      
      logger.info('Sending password reset email to:', email);
      
      // Remember this email
      setLastUsedEmail(email);
      
      // Send reset password email
      await resetPassword(email);
      
      // If we get here, the reset email was sent successfully
      setResetSent(true);
      logger.info('Password reset email sent successfully');
    } catch (err) {
      logger.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
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
            <strong>Email sent!</strong> Check your inbox for a link to reset your password.
          </div>
          
          <p className="text-brand-neutral-600 text-sm">
            If you don't see the email, please check your spam folder or request another reset link.
          </p>
          
          <div className="flex gap-3 mt-6 pt-2">
            <button
              type="button"
              onClick={() => setResetSent(false)}
              className="flex-1 py-2 px-4 border border-brand-neutral-300 rounded-md shadow-sm text-sm font-medium text-brand-neutral-700 bg-white hover:bg-brand-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => onViewChange(AUTH_VIEWS.SIGN_IN)}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              Back to Sign In
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
              Enter your email to receive a password reset link
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
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 disabled:opacity-50 transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                <span className="flex items-center">
                  <SendIcon className="h-4 w-4 mr-2" />
                  Send Reset Link
                </span>
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => onViewChange(AUTH_VIEWS.SIGN_IN)}
              className="text-sm font-medium text-brand-primary-600 hover:text-brand-primary-500 hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      )}
    </>
  );
};

export default ResetPassword; 