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

  // Check for reset token on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
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
      } catch (err) {
        logger.error('Error checking reset token:', err);
        setError('Unable to verify reset token. Please try again.');
        setIsTokenValid(false);
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
                  confirmPassword && confirmPassword !== newPassword
                    ? "border-status-error-border focus:border-status-error-border focus:ring-status-error-border"
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
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="mt-1 text-sm text-status-error">Passwords do not match</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 