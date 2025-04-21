import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, CheckIcon, AlertTriangleIcon } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import PasswordStrengthMeter from '../../components/Auth/PasswordStrengthMeter';
import logger from '../../lib/logger';
import { supabase } from '../../lib/supabase';
import { validatePassword, checkPasswordStrength } from '../../utils/passwordUtils';

const ResetPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [passwordValid, setPasswordValid] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  const navigate = (path: string) => {
    logger.info('Custom navigation to:', path);
    window.history.pushState({}, '', path);
    if (typeof (window as any).navigateTo === 'function') {
      logger.info('Using global navigateTo function');
      (window as any).navigateTo(path);
    } else {
      logger.info('Fallback to window.location.href redirect');
      window.location.href = path;
    }
  };
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          logger.info('ResetPasswordPage: User is authenticated via session.');
          setIsAuthenticated(true);
        } else {
          logger.warn('ResetPasswordPage: User is not authenticated. Invalid or expired link?');
          setError('Invalid or expired reset link. Please request a new password reset.');
          setIsAuthenticated(false);
        }
      } catch (err) {
        logger.error('ResetPasswordPage: Error checking authentication:', err);
        setError('Could not verify authentication status. Please try again or request a new link.');
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);
  
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
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAuthenticated !== true) {
      setError('Cannot reset password. Please ensure you used a valid reset link.');
      return;
    }
    
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.message || 'Password is not strong enough');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Attempting to update password for authenticated user');
      
      const result = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (result.error) {
        logger.error('Supabase returned error during password update:', result.error);
        throw result.error;
      }
      
      if (!result.data?.user) {
        logger.warn('Password update succeeded but no user data returned');
      } else {
        logger.info('User data returned after password update:', { 
          id: result.data.user.id,
          email: result.data.user.email 
        });
      }
      
      setSuccess(true);
      logger.info('Password updated successfully');
      
      setTimeout(() => {
        navigate('/?passwordReset=success');
      }, 3000);
    } catch (err) {
      logger.error('Error updating password:', err);
      
      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();
        if (errorMsg.includes('expired')) {
          setError('Your reset link has expired. Please request a new one.');
        } else if (errorMsg.includes('invalid') || errorMsg.includes('not found')) {
          setError('Invalid reset link. Please request a new one.');
        } else if (errorMsg.includes('network')) {
          setError('Network error. Please check your connection and try again.');
        } else if (errorMsg.includes('same password')) {
          setError('The new password cannot be the same as your current password.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-neutral-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
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
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-neutral-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Set New Password</h1>
        
        {error && (
          <div className="flex items-start bg-status-error-light text-status-error border border-status-error-border p-4 rounded-md mb-6">
            <AlertTriangleIcon className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleResetPassword} className="space-y-6">
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
              <p className="text-status-error text-sm">Passwords do not match</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || !passwordValid || newPassword !== confirmPassword}
            className="w-full py-3 px-4 bg-brand-gradient text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-brand-primary-600 hover:text-brand-primary-500 text-sm"
            >
              Return to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 