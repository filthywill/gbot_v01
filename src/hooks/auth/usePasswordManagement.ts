import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { validatePassword, checkPasswordStrength, verifyCurrentPassword } from '../../utils/passwordUtils';
import { PasswordStrength } from '../../components/Auth/PasswordStrengthMeter';
import { refreshSessionAfterSensitiveOperation } from '../../lib/auth/sessionUtils';
import { checkRateLimit } from '../../lib/rateLimit';

export interface UsePasswordManagementProps {
  userEmail?: string;
}

export interface UsePasswordManagementReturn {
  // State
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  passwordError: string;
  passwordChangeMessage: string;
  isChangingPassword: boolean;
  passwordStrength: PasswordStrength;
  passwordValid: boolean;
  confirmValid: boolean;
  
  // Password visibility
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  toggleCurrentPasswordVisibility: () => void;
  toggleNewPasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  
  // Password requirements 
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
  
  // Methods
  updatePasswordStrength: (password: string) => void;
  changePassword: () => Promise<boolean>;
  resetForm: () => void;
}

/**
 * Custom hook for password management functionality
 * Provides state and methods for handling password changes, validation, and feedback
 */
export const usePasswordManagement = ({ userEmail }: UsePasswordManagementProps = {}): UsePasswordManagementReturn => {
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Feedback state
  const [passwordError, setPasswordError] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [] });
  
  // Validation state
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmValid, setConfirmValid] = useState(true);
  
  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password requirements state
  const [requirements, setRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });
  
  // Toggle password visibility
  const toggleCurrentPasswordVisibility = useCallback(() => {
    setShowCurrentPassword(prev => !prev);
  }, []);
  
  const toggleNewPasswordVisibility = useCallback(() => {
    setShowNewPassword(prev => !prev);
  }, []);
  
  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);
  
  // Update password strength whenever new password changes
  useEffect(() => {
    if (newPassword) {
      const strength = checkPasswordStrength(newPassword);
      setPasswordStrength(strength);
      
      // Check password validation
      const validation = validatePassword(newPassword);
      setPasswordValid(validation.isValid);
      
      // Update detailed requirements
      setRequirements({
        minLength: newPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[^A-Za-z0-9]/.test(newPassword)
      });
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
      setPasswordValid(false);
      setRequirements({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false
      });
    }
  }, [newPassword]);
  
  // Check if passwords match whenever confirmPassword or newPassword changes
  useEffect(() => {
    if (confirmPassword) {
      setConfirmValid(newPassword === confirmPassword);
    } else {
      setConfirmValid(true); // Don't show error when field is empty
    }
  }, [newPassword, confirmPassword]);
  
  // Manual update of password strength (for when needed outside of internal effects)
  const updatePasswordStrength = useCallback((password: string) => {
    const strength = checkPasswordStrength(password);
    setPasswordStrength(strength);
  }, []);
  
  // Form validation
  const validateForm = useCallback(() => {
    // Reset messages
    setPasswordError('');
    setPasswordChangeMessage('');
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return false;
    }
    
    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPasswordError(validation.message || 'Password is not strong enough');
      return false;
    }
    
    return true;
  }, [newPassword, confirmPassword]);
  
  // Change password function
  const changePassword = useCallback(async () => {
    if (!validateForm()) {
      return false;
    }

    // Check rate limit for password changes
    if (!checkRateLimit(userEmail || 'unknown', 'password')) {
      setPasswordError('Too many password change attempts. Please wait before trying again.');
      return false;
    }
    
    setIsChangingPassword(true);
    setPasswordError('');
    
    try {
      // Verify current password
      if (!userEmail) {
        throw new Error('User email not available');
      }
      
      const isCurrentPasswordValid = await verifyCurrentPassword(userEmail, currentPassword);
      
      if (!isCurrentPasswordValid) {
        setPasswordError('Current password is incorrect');
        setIsChangingPassword(false);
        return false;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      // Refresh session after password change for enhanced security
      await refreshSessionAfterSensitiveOperation();
      
      // Clear form
      resetForm();
      
      setPasswordChangeMessage('Password updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordChangeMessage('');
      }, 3000);
      
      return true;
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Error changing password');
      return false;
    } finally {
      setIsChangingPassword(false);
    }
  }, [validateForm, userEmail, currentPassword, newPassword]);
  
  // Reset form state
  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordChangeMessage('');
    setPasswordStrength({ score: 0, feedback: [] });
    setPasswordValid(false);
    setConfirmValid(true);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, []);
  
  return {
    // State
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    passwordChangeMessage,
    isChangingPassword,
    passwordStrength,
    passwordValid,
    confirmValid,
    
    // Password visibility
    showCurrentPassword,
    showNewPassword, 
    showConfirmPassword,
    toggleCurrentPasswordVisibility,
    toggleNewPasswordVisibility,
    toggleConfirmPasswordVisibility,
    
    // Password requirements
    requirements,
    
    // Methods
    updatePasswordStrength,
    changePassword,
    resetForm
  };
}; 