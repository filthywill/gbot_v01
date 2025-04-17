import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { EyeIcon, EyeOffIcon, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import PasswordStrengthMeter from '../../components/Auth/PasswordStrengthMeter';
import { checkPasswordStrength, validatePassword } from '../../utils/passwordUtils';
import logger from '../../lib/logger';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Check for reset token on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsCheckingToken(true);
        logger.info('Checking for recovery hash fragment in URL:', window.location.hash);
        
        // Check if we're in a recovery flow based on hash fragment
        const isRecoveryFlow = window.location.hash === '#recovery';
        
        if (isRecoveryFlow) {
          logger.info('Recovery hash fragment found, validating session');
          // Get the current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (!session) {
            setError('Invalid or expired reset link. Please request a new password reset.');
            setIsTokenValid(false);
            return;
          }
          
          setIsTokenValid(true);
          logger.info('Session is valid for password reset');
        } else {
          // No recovery hash found, user might have navigated here directly
          logger.info('No recovery hash fragment found, user may have navigated directly');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // User is already authenticated
            setIsTokenValid(true);
            logger.info('User is authenticated, allowing password reset');
          } else {
            setError('Please use the password reset link from your email.');
            setIsTokenValid(false);
            logger.warn('User is not authenticated and no recovery flow detected');
          }
        }
      } catch (err) {
        logger.error('Error checking reset token:', err);
        setError('Unable to verify reset token. Please try again.');
        setIsTokenValid(false);
      } finally {
        setIsCheckingToken(false);
      }
    };
    
    checkSession();
  }, []);

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(checkPasswordStrength(newPassword));
    }
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTokenValid) {
      setError('Invalid or expired reset link. Please request a new password reset.');
      return;
    }
    
    // Reset error state
    setError(null);
    
    // Validate the new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.message || 'Password is not strong enough');
      return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // Show success state
      setIsSuccess(true);
      logger.info('Password updated successfully');
    } catch (err) {
      logger.error('Error updating password:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    window.location.href = '/';
  };

  const handleRequestNewReset = () => {
    window.location.href = '/?reset=true';
  };

  // Show loading state while checking the token
  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-neutral-900">Verifying Reset Link</h2>
            <p className="mt-2 text-brand-neutral-600">
              Please wait while we verify your password reset link...
            </p>
          </div>
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-brand-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-neutral-900">Invalid Reset Link</h2>
            <p className="mt-2 text-brand-neutral-600">
              This password reset link is invalid or has expired. Please request a new password reset.
            </p>
          </div>
          
          <button
            onClick={handleRequestNewReset}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-neutral-900">Password Updated</h2>
            <p className="mt-2 text-brand-neutral-600">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
          </div>
          
          <button
            onClick={handleSignIn}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-brand-neutral-900">Reset Your Password</h2>
          <p className="mt-2 text-brand-neutral-600">
            Please create a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-brand-neutral-900">
              New Password
            </label>
            <div className="mt-1 relative">
              <input
                id="new-password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-500"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="mt-2">
                <PasswordStrengthMeter
                  strength={{
                    score: passwordStrength.score,
                    feedback: passwordStrength.feedback
                  }}
                />
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-neutral-900">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500",
                  confirmPassword && newPassword !== confirmPassword
                    ? "border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    : "border-brand-neutral-300"
                )}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-2 text-sm text-red-600">
                Passwords do not match
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 