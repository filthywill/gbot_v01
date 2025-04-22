import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, CheckIcon, AlertTriangleIcon } from 'lucide-react';
// import useAuthStore from '../../store/useAuthStore'; // Temporarily unused
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
  const [isSessionSet, setIsSessionSet] = useState(false);
  
  // Extract token from URL hash fragment and set up session
  useEffect(() => {
    const setupSession = async () => {
      try {
        logger.info('ResetPasswordPage: Initializing and extracting tokens from hash');
        
        // Extract tokens from hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get('access_token');
        
        if (!token) {
          logger.error('ResetPasswordPage: No access token found in URL hash');
          setError('Invalid or missing reset token. Please request a new password reset.');
          return;
        }
        
        // Set up session with token
        const refreshToken = hashParams.get('refresh_token') || '';
        const { data, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: refreshToken
        });
        
        if (error) {
          logger.error('ResetPasswordPage: Error setting session:', error);
          setError('Invalid reset link or link has expired. Please request a new password reset.');
          return;
        }
        
        if (!data.session) {
          logger.error('ResetPasswordPage: No session created after setting token');
          setError('Failed to authenticate reset token. Please request a new password reset.');
          return;
        }
        
        logger.info('ResetPasswordPage: Session set successfully for password reset');
        setIsSessionSet(true);
      } catch (err) {
        logger.error('ResetPasswordPage: Error setting up reset session:', err);
        setError('Could not process reset token. Please request a new password reset.');
      }
    };
    
    setupSession();
  }, []);
  
  // Handle password strength calculation
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
    
    if (!isSessionSet) {
      setError('Cannot reset password. Please ensure you used a valid reset link.');
      return;
    }
    
    // Validate password
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
      
      logger.info('ResetPasswordPage: Attempting to update password');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setSuccess(true);
      logger.info('ResetPasswordPage: Password updated successfully');
      
      // Redirect to home page after delay
      setTimeout(() => {
        window.location.href = '/?passwordReset=success';
      }, 3000);
    } catch (err) {
      logger.error('ResetPasswordPage: Error updating password:', err);
      
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
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Password Reset Successful</h1>
          <p className="text-gray-600 mb-4">Your password has been updated successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-neutral-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Your Password</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {!isSessionSet && !error ? (
          <div className="flex justify-center my-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-brand-primary-100 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-brand-primary-100 rounded mb-2"></div>
              <div className="h-3 w-24 bg-brand-primary-50 rounded"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-2.5 text-gray-500 focus:outline-none"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <PasswordStrengthMeter 
                strength={passwordStrength}
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-2.5 text-gray-500 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || !passwordValid}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                loading || !passwordValid 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-brand-primary-600 hover:bg-brand-primary-700'
              }`}
            >
              {loading ? 'Setting New Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 