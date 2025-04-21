import React, { useState, useEffect, useRef } from 'react';
import { EyeIcon, EyeOffIcon, CheckIcon, AlertTriangleIcon, LockIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import PasswordStrengthMeter from '../../components/Auth/PasswordStrengthMeter';
import logger from '../../lib/logger';
import { validatePassword, checkPasswordStrength } from '../../utils/passwordUtils';

const ResetPasswordPage: React.FC = () => {
  // State for password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [passwordValid, setPasswordValid] = useState(false);
  
  // State for page flow
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Using ref to avoid hooks dependencies warnings
  const tokenChecked = useRef(false);
  
  const navigate = (path: string) => {
    window.location.href = path;
  };
  
  // Check if the hash fragment or URL parameters contain a token
  useEffect(() => {
    if (tokenChecked.current) return;
    
    const checkToken = async () => {
      try {
        logger.info('Verifying password reset token');
        setIsTokenChecking(true);
        
        // Check URL parameters
        const url = new URL(window.location.href);
        const fromCallback = url.searchParams.has('from_callback');
        const isVerified = url.searchParams.has('verified');
        
        // Log URL information for debugging
        logger.debug('Reset password URL info:', { 
          url: window.location.href,
          referrer: document.referrer,
          fromCallback,
          isVerified
        });
        
        // If we came from callback with verified flag, we can trust the session
        if (fromCallback && isVerified) {
          logger.info('Valid verification from callback detected');
          setIsTokenValid(true);
          setError(null);
          return;
        }
        
        // Otherwise, check for a valid session
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          logger.error('Error checking session:', authError);
          setError('There was a problem verifying your reset link. Please request a new one.');
          setIsTokenValid(false);
          return;
        }
        
        // If we have a session, we're good to go
        if (authData.session) {
          logger.info('Valid session found for password reset');
          setIsTokenValid(true);
          setError(null);
          return;
        }
        
        // If we don't have a session but came from the callback page, 
        // there might have been an issue with the token
        if (fromCallback) {
          logger.warn('Came from callback page but no session established');
          setError('Your password reset link may have expired. Please request a new one.');
          setIsTokenValid(false);
          return;
        }
        
        // If we got here directly without a session, something is wrong
        logger.warn('No active session found with reset token');
        setError('The reset link is invalid or has expired. Please request a new password reset link.');
        setIsTokenValid(false);
      } catch (err) {
        logger.error('Error during token verification:', err);
        setError('There was a problem verifying your reset link. Please try again or request a new one.');
        setIsTokenValid(false);
      } finally {
        setIsTokenChecking(false);
        tokenChecked.current = true;
      }
    };
    
    checkToken();
  }, []);
  
  // Update password strength when password changes
  useEffect(() => {
    if (newPassword) {
      const strength = checkPasswordStrength(newPassword);
      setPasswordStrength(strength);
      
      const validation = validatePassword(newPassword);
      setPasswordValid(validation.isValid);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
      setPasswordValid(false);
    }
  }, [newPassword]);
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTokenValid) {
      setError('Your password reset link is invalid or has expired. Please request a new one.');
      return;
    }
    
    // Validate the new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.message || 'Your password is not strong enough. Please choose a stronger password.');
      return;
    }
    
    // Check passwords match
    if (newPassword !== confirmPassword) {
      setError('Your passwords do not match. Please make sure both passwords are identical.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('Updating password');
      
      // Update user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // Success!
      setSuccess(true);
      logger.info('Password updated successfully');
      
      // Schedule a redirect back to the home page
      setTimeout(() => {
        navigate('/?passwordReset=success');
      }, 3000);
    } catch (err) {
      logger.error('Error updating password:', err);
      
      if (err instanceof Error) {
        // Provide friendly error messages
        const errorText = err.message.toLowerCase();
        if (errorText.includes('expired')) {
          setError('Your password reset link has expired. Please request a new one.');
        } else if (errorText.includes('weak')) {
          setError('Please choose a stronger password.');
        } else if (errorText.includes('same')) {
          setError('Your new password must be different from your old password.');
        } else {
          setError(err.message);
        }
      } else {
        setError('There was a problem updating your password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Loading state while we check the token
  if (isTokenChecking) {
    return (
      <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-brand-neutral-900 mb-2">Verifying Reset Link</h2>
          <p className="text-brand-neutral-600">Please wait while we verify your password reset link...</p>
        </div>
      </div>
    );
  }
  
  // Success state after password reset
  if (success) {
    return (
      <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-status-success-light rounded-full flex items-center justify-center mb-4">
              <CheckIcon className="h-8 w-8 text-status-success" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Password Updated!</h1>
            <p className="text-brand-neutral-600 text-center mb-6">
              Your password has been successfully updated. You will be redirected to the login page shortly.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-brand-gradient text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Invalid token state
  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-status-error-light rounded-full flex items-center justify-center mb-4">
              <AlertTriangleIcon className="h-8 w-8 text-status-error" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Invalid Reset Link</h1>
            <p className="text-brand-neutral-600 text-center mb-6">
              {error || 'Your password reset link is invalid or has expired. Please request a new password reset.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/?reset=true')}
              className="w-full py-3 px-4 bg-brand-gradient text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              Request New Reset Link
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Password reset form
  return (
    <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-brand-primary-50 rounded-full flex items-center justify-center mb-4">
            <LockIcon className="h-8 w-8 text-brand-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-center">Set New Password</h1>
          <p className="mt-2 text-brand-neutral-600 text-center">
            Please create a new password for your account
          </p>
        </div>
        
        {error && (
          <div className="flex items-start bg-status-error-light text-status-error border border-status-error-border p-4 rounded-md mb-6">
            <AlertTriangleIcon className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-sm font-medium text-brand-neutral-700">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500 text-brand-neutral-900"
                placeholder="••••••••"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-400 hover:text-brand-neutral-600"
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
          
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-neutral-700">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none 
                  focus:ring-brand-primary-500 focus:border-brand-primary-500 text-brand-neutral-900
                  ${confirmPassword && newPassword && confirmPassword !== newPassword
                    ? 'border-status-error-border' 
                    : 'border-brand-neutral-300'}`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-400 hover:text-brand-neutral-600"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="text-status-error text-sm mt-1">Passwords do not match</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !passwordValid || newPassword !== confirmPassword}
            className="w-full py-3 px-4 bg-brand-gradient text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Password...
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 