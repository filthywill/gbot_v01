import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EyeIcon, EyeOffIcon, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import PasswordStrengthMeter from '../components/Auth/PasswordStrengthMeter';
import { checkPasswordStrength, validatePassword } from '../utils/passwordUtils';
import logger from '../lib/logger';

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
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // Check if we have a valid session from a password recovery flow
        if (session) {
          logger.info('Valid session found for password reset');
          setIsTokenValid(true);
          setIsCheckingToken(false);
          return;
        }
        
        // If no session yet, check URL for recovery token
        const url = new URL(window.location.href);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');
        
        logger.info('Checking reset parameters:', { hasToken: !!token, type });
        
        if (token && type === 'recovery') {
          logger.info('Recovery token found in URL, attempting to verify');
          
          try {
            // Verify the recovery token
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery'
            });
            
            if (verifyError) {
              logger.error('Error verifying recovery token:', verifyError);
              setError('Invalid or expired reset link. Please request a new password reset.');
              setIsTokenValid(false);
              setIsCheckingToken(false);
              return;
            }
            
            // Token verified successfully
            logger.info('Recovery token verified successfully');
            setIsTokenValid(true);
            setIsCheckingToken(false);
            return;
          } catch (verifyErr) {
            logger.error('Exception verifying recovery token:', verifyErr);
            setError('Error processing reset link. Please try again or request a new password reset.');
            setIsTokenValid(false);
            setIsCheckingToken(false);
            return;
          }
        }
        
        // No session and no valid token in URL
        logger.warn('No valid reset parameters found');
        setError('Invalid or expired reset link. Please request a new password reset.');
        setIsTokenValid(false);
        setIsCheckingToken(false);
      } catch (err) {
        logger.error('Error checking reset token:', err);
        setError('Unable to verify reset token. Please try again.');
        setIsTokenValid(false);
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

  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-brand-neutral-900 mb-2">Verifying Reset Link</h2>
          <p className="text-brand-neutral-600">Please wait while we verify your password reset link...</p>
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
            <h2 className="text-2xl font-bold text-brand-neutral-900">Password Updated!</h2>
            <p className="mt-2 text-brand-neutral-600">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
          </div>
          
          <button
            onClick={handleSignIn}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
          >
            Sign In
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
            Please enter a new password for your account
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-status-error-light border border-status-error-border text-status-error px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-brand-neutral-700">
              New Password
            </label>
            <div className="relative mt-1">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-brand-neutral-900 placeholder-brand-neutral-400 border-brand-neutral-300 focus:border-brand-primary-500 focus:ring-brand-primary-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-400 hover:text-brand-neutral-500"
              >
                {showNewPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {newPassword && (
              <PasswordStrengthMeter strength={passwordStrength} />
            )}
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-neutral-700">
              Confirm Password
            </label>
            <div className="relative mt-1">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-brand-neutral-900 placeholder-brand-neutral-400",
                  confirmPassword && newPassword !== confirmPassword
                    ? "border-status-error focus:border-status-error focus:ring-status-error-light"
                    : "border-brand-neutral-300 focus:border-brand-primary-500 focus:ring-brand-primary-500"
                )}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-400 hover:text-brand-neutral-500"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-sm text-status-error">Passwords do not match</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="text-sm font-medium text-brand-primary-600 hover:text-brand-primary-500"
            >
              Back to Sign In
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white",
              "bg-brand-gradient hover:bg-brand-gradient",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500",
              isLoading ? "opacity-75 cursor-not-allowed" : ""
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Save className="h-4 w-4 mr-2" />
                Update Password
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 