import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, CheckIcon, AlertTriangleIcon } from 'lucide-react';
// import useAuthStore from '../../store/useAuthStore'; // Temporarily unused
import PasswordStrengthMeter from '../../components/Auth/PasswordStrengthMeter';
import logger from '../../lib/logger';
import { supabase } from '../../lib/supabase';
import { validatePassword, checkPasswordStrength } from '../../utils/passwordUtils';
import { refreshSessionAfterSensitiveOperation } from '../../lib/auth/sessionUtils';

const ResetPasswordPage: React.FC = () => {
  // Temporarily comment out state and effects for debugging
  /*
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
      
      // Refresh session after password reset for enhanced security
      await refreshSessionAfterSensitiveOperation();
      
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
  
  // Conditional rendering commented out for debugging
  // if (success) { ... }
  // if (isAuthenticated === false) { ... }
  */
  
  // Basic render test
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-neutral-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password Page Render Test</h1>
        {/* Form and other elements commented out for debugging */}
        {/* {error && ... } */}
        {/* <form onSubmit={handleResetPassword} ...> ... </form> */}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 