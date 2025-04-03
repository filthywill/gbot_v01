import React, { useState, useCallback, useEffect, useRef } from 'react';
import useAuthStore from '../../store/useAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';
import useGoogleAuthStore from '../../store/useGoogleAuthStore';
import GoogleSignInButton from './GoogleSignInButton';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { cn } from '../../lib/utils';
import { EyeIcon, EyeOffIcon, CheckCircle, AlertCircle, ArrowLeft, Mail, Save, X } from 'lucide-react';
import logger from '../../lib/logger';
import { checkPasswordStrength, validatePassword } from '../../utils/passwordUtils';
import { supabase } from '../../lib/supabase';

// Define validation types
type ValidationStatus = 'idle' | 'valid' | 'invalid';

interface FieldValidation {
  status: ValidationStatus;
  message: string;
}

interface ValidationState {
  email: FieldValidation;
  password: FieldValidation;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'reset-confirmation' | 'signup-confirmation' | 'update-password';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [validationState, setValidationState] = useState<ValidationState>({
    email: { status: 'idle', message: '' },
    password: { status: 'idle', message: '' }
  });
  const [isDirty, setIsDirty] = useState({
    email: false,
    password: false
  });
  const [lastTypedField, setLastTypedField] = useState<'email' | 'password' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordStrength, setNewPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rememberMeChecked, setRememberMeChecked] = useState(false);
  const [hasPrefilledEmail, setHasPrefilledEmail] = useState(false);
  
  // Ref to track mouse down state
  const mouseDownOnBackdrop = useRef(false);
  
  // Get stores with the new approach
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword, 
    error, 
    resetError 
  } = useAuthStore();
  const { rememberMe, setRememberMe, lastUsedEmail, setLastUsedEmail } = usePreferencesStore();
  const { isSDKLoaded, initializeSDK } = useGoogleAuthStore();
  
  // Ref for the modal content
  const modalRef = React.useRef<HTMLDivElement>(null);
  // Refs for validation timers
  const emailValidationTimer = React.useRef<NodeJS.Timeout | null>(null);
  const passwordValidationTimer = React.useRef<NodeJS.Timeout | null>(null);
  
  const { setLastUsedEmail: setPreferencesLastUsedEmail } = usePreferencesStore();
  
  // Check the loading state directly for non-blocking auth
  const isAuthLoading = useAuthStore.getState().status === 'LOADING';
  
  // Email validation - MOVED UP before useEffect usage
  const validateEmail = useCallback((value: string, immediate = false) => {
    const validate = () => {
      // Simple email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(value);
      
      setValidationState(prev => ({
        ...prev,
        email: {
          status: isValid ? 'valid' : value === '' ? 'idle' : 'invalid',
          message: isValid ? '' : 'Please enter a valid email address'
        }
      }));
    };
    
    // Clear existing timer
    if (emailValidationTimer.current) {
      clearTimeout(emailValidationTimer.current);
    }
    
    if (immediate) {
      validate();
    } else {
      // Set a new timer to validate after delay
      emailValidationTimer.current = setTimeout(validate, 500);
    }
  }, []);
  
  // Reset validation and password strength when changing modes
  useEffect(() => {
    setPasswordStrength({ score: 0, feedback: [] });
    setValidationState({
      email: { status: 'idle', message: '' },
      password: { status: 'idle', message: '' }
    });
    setIsDirty({
      email: false,
      password: false
    });
    setAuthError(null);
    resetError();
    setResetSent(false);
    
    // Don't reset signup completion when specifically in signup-confirmation mode
    if (mode !== 'signup-confirmation') {
      setSignupComplete(false);
    }
  }, [mode, resetError]);
  
  // Update the useEffect for validating pre-filled email
  useEffect(() => {
    if (isOpen) {
      // Different behavior based on mode
      if ((mode === 'signin' || mode === 'signup') && !hasPrefilledEmail) {
        // For sign-in, restore remembered email and preferences
        const { rememberMe, lastUsedEmail } = usePreferencesStore.getState();
        setRememberMeChecked(rememberMe);
        
        // Only set the email field once on initial open
        if (lastUsedEmail) {
          setEmail(lastUsedEmail);
          validateEmail(lastUsedEmail, true); // Validate immediately
          setHasPrefilledEmail(true); // Mark as prefilled to prevent overrides
          
          // If we just verified the email, we should remember this user
          if (window.location.pathname === '/verification-success') {
            setRememberMeChecked(true);
          }
        }
      } 
      else if (mode === 'forgot-password' && email) {
        // For forgot password, validate any existing email immediately
        validateEmail(email, true);
      }
    } else {
      // Reset the flag when modal closes
      setHasPrefilledEmail(false);
    }
  }, [isOpen, mode, validateEmail, hasPrefilledEmail]);
  
  // When the modal opens, ensure Google SDK is initialized
  useEffect(() => {
    if (isOpen && window.isSecureContext) {
      initializeSDK();
    }
  }, [isOpen, initializeSDK]);
  
  // Add useEffect to check for reset parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('reset') === 'true') {
      setMode('forgot-password');
      // Remove the reset parameter from URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);
  
  // Add a useEffect to validate the email when switching to forgot-password mode
  useEffect(() => {
    // When switching to forgot-password mode with an existing email, validate it
    if (mode === 'forgot-password' && email) {
      // Validate the email immediately
      validateEmail(email, true);
    }
  }, [mode, email, validateEmail]);
  
  // Update useEffect to handle initial mode changes
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);
  
  // Handle mouse events for backdrop
  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the click is directly on the backdrop (not on the modal content)
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      // Mark that the mouse down happened on the backdrop
      mouseDownOnBackdrop.current = true;
    } else {
      mouseDownOnBackdrop.current = false;
    }
  };
  
  const handleBackdropMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if both mouse down and mouse up happened on the backdrop
    if (mouseDownOnBackdrop.current && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
    
    // Reset the flag
    mouseDownOnBackdrop.current = false;
  };
  
  // Password validation
  const validatePasswordField = useCallback((value: string, immediate = false) => {
    const validate = () => {
      // Different validation based on mode
      if (mode === 'signin') {
        // In signin mode, just check if password is not empty
        const isValid = value.length > 0;
        setValidationState(prev => ({
          ...prev,
          password: {
            status: isValid ? 'valid' : 'idle',
            message: ''
          }
        }));
      } else if (mode === 'signup') {
        // In signup mode, check password strength
        const strength = checkPasswordStrength(value);
        const result = validatePassword(value);
        const isValid = strength.score >= 2 && result.isValid;
        
        setValidationState(prev => ({
          ...prev,
          password: {
            status: isValid ? 'valid' : value === '' ? 'idle' : 'invalid',
            message: isValid ? '' : result.message || 'Please use a stronger password'
          }
        }));
        
        setPasswordStrength(strength);
      }
    };
    
    // Clear existing timer
    if (passwordValidationTimer.current) {
      clearTimeout(passwordValidationTimer.current);
    }
    
    if (immediate) {
      validate();
    } else {
      // Set a new timer to validate after delay
      passwordValidationTimer.current = setTimeout(validate, 500);
    }
  }, [mode]);
  
  // When password changes, update strength meter
  useEffect(() => {
    if (mode === 'signup' && password) {
      setPasswordStrength(checkPasswordStrength(password));
    }
    
    if (mode === 'update-password' && newPassword) {
      setNewPasswordStrength(checkPasswordStrength(newPassword));
    }
  }, [password, newPassword, mode]);
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setAuthError(null);
    
    // Validate fields for all flows
    if (!email) {
      setAuthError("Email is required");
      return;
    }
    
    if (validationState.email.status === 'invalid') {
      setAuthError(validationState.email.message);
      return;
    }
    
    // Additional validation for sign-in and sign-up
    if (mode !== 'forgot-password' && !password) {
      setAuthError("Password is required");
      return;
    }
    
    // Handle the auth based on current mode
    switch (mode) {
      case 'signin':
        try {
      await signInWithEmail(email, password);
          
          // Set last used email if "Remember me" is checked
          if (rememberMeChecked) {
            setLastUsedEmail(email);
          } else {
            setLastUsedEmail('');
          }
          
          setRememberMe(rememberMeChecked);
          onClose();
        } catch (error) {
          // Error is already handled by the store
        }
        break;
        
      case 'signup':
        try {
          // For sign-up, add password validation
          if (validationState.password.status === 'invalid') {
            setAuthError(validationState.password.message);
            return;
          }
          
          const result = await signUpWithEmail(email, password);
          if (result?.user) {
            setSignupComplete(true);
            setMode('signup-confirmation');
          }
        } catch (error) {
          // Error is already handled by the store
        }
        break;
        
      case 'forgot-password':
        try {
          await resetPassword(email);
          setResetEmailSent(true);
        } catch (error) {
          // Error is already handled by the store
        }
        break;
    }
  };
  
  const toggleMode = (newMode: AuthMode) => {
    setMode(newMode);
    setAuthError(null);
    resetError();
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setLastTypedField('email');
    
    if (!isDirty.email) {
      setIsDirty(prev => ({ ...prev, email: true }));
    } else {
      validateEmail(newEmail);
    }
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setLastTypedField('password');
    
    if (!isDirty.password) {
      setIsDirty(prev => ({ ...prev, password: true }));
    } else {
      validatePasswordField(newPassword);
    }
  };
  
  const handleEmailBlur = () => {
    if (email) {
      validateEmail(email, true);
    }
  };
  
  const handlePasswordBlur = () => {
    if (password) {
      validatePasswordField(password, true);
    }
  };
  
  const getInputClasses = (status: ValidationStatus) => {
    return cn(
      "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-gray-900 placeholder-gray-400",
      status === 'valid' ? "border-green-500 focus:border-green-500 focus:ring-green-500" : 
      status === 'invalid' ? "border-red-500 focus:border-red-500 focus:ring-red-500" : 
      "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
    );
  };
  
  // Show signup confirmation screen
  if (mode === 'signup-confirmation') {
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
      >
        <div 
          ref={modalRef}
          className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Verify Your Email</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 h-8 w-8 rounded-full flex items-center justify-center 
                hover:bg-gray-100 transition-colors duration-150 text-xl"
              aria-label="Close"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-3">
              <Mail className="h-8 w-8 text-indigo-600" />
            </div>
          <div>
            <h2 className="text-2xl font-extrabold text-indigo-900 tracking-tight">
          Check your inbox!</h2>
          </div>
          </div>
          
          <div className="text-center bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          
            <p className="mt-1">We've sent a confirmation email to <strong>{email}</strong></p>
          </div>
          
          <p className="text-gray-600 mb-6 text-sm text-center">
            Please click the verification link in the email to complete your account setup. 
            If you don't see the email within a few minutes, check your spam folder.
          </p>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => toggleMode('signin')}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in
            </button>
            
            <button
              type="button"
              onClick={() => {
                // Reset the form and go back to signup mode
                toggleMode('signup');
                setEmail('');
                setPassword('');
              }}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Use different email
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show reset confirmation screen
  if (mode === 'reset-confirmation') {
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
      >
        <div 
          ref={modalRef}
          className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Password Reset</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 h-8 w-8 rounded-full flex items-center justify-center 
                hover:bg-gray-100 transition-colors duration-150 text-xl"
              aria-label="Close"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>
          
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Password reset email sent!</p>
            <p className="mt-1">Check your inbox for instructions to reset your password.</p>
          </div>
          
          <p className="text-gray-600 mb-4">
            If you don't see the email within a few minutes, check your spam folder or try again.
          </p>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => toggleMode('signin')}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in
            </button>
            
            <button
              type="button"
              onClick={() => toggleMode('forgot-password')}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Resend email
            </button>
          </div>
            
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600 mb-2">Already clicked the reset link?</p>
            <button
              type="button"
              onClick={() => toggleMode('update-password')}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-indigo-500"
            >
              Set New Password
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Add the handle update password function here inside the component
  // to have access to component state and props
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    resetError();
    setAuthError(null);
    
    // Validate the new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setAuthError(validation.message || 'Password is not strong enough');
      return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    
    try {
      // Get the Supabase client
      const { supabase } = await import('../../lib/supabase');
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // Close modal on success
      logger.info('Password updated successfully');
      onClose();
    } catch (err) {
      logger.error('Error updating password:', err);
      setAuthError(err instanceof Error ? err.message : 'Failed to update password');
    }
  };
  
  // Add the update password UI
  if (mode === 'update-password') {
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
      >
        <div 
          ref={modalRef}
          className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Update Your Password</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 h-8 w-8 rounded-full flex items-center justify-center 
                hover:bg-gray-100 transition-colors duration-150 text-xl"
              aria-label="Close"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>
          
          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{authError}</span>
            </div>
          )}
          
          {error && !authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}
          
          {isAuthLoading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing authentication...</span>
            </div>
          )}
          
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Create a new password for your account</p>
            <p className="mt-1">Please choose a strong, unique password</p>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-gray-900 placeholder-gray-400 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showNewPassword ? (
                    <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              
              {newPassword && (
                <PasswordStrengthMeter strength={newPasswordStrength} />
              )}
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-gray-900 placeholder-gray-400",
                    confirmPassword && newPassword !== confirmPassword
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  )}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isAuthLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className={cn(
                "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white",
                "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                (isAuthLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword) 
                  ? "opacity-75 cursor-not-allowed" 
                  : ""
              )}
            >
              {isAuthLoading ? (
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
            
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => toggleMode('signin')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Return to sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  // Check if we need to close the modal based on authentication status
  const checkAuthAndClose = () => {
    // Check if the user is authenticated by accessing the store state directly
    const user = useAuthStore.getState().user;
    if (user) {
      // We're authenticated - close the modal
      onClose();
    }
  };
  
  // Return statement with main component structure
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-xl p-8 shadow-2xl border border-gray-100"
      >
        <div className="relative mb-6">
          <div className="text-center w-full">
            <h2 className="text-2xl font-extrabold text-indigo-900 tracking-tight -mb-2">
              {!signupComplete && mode === 'signin' && 'Sign In'}
              {!signupComplete && mode === 'signup' && 'Create An Account'}
              {!signupComplete && mode === 'forgot-password' && 'Reset Your Password'}
              {signupComplete && 'Check Your Email'}
          </h2>
            <p className="mt-3 text-sm text-gray-500">
              {mode === 'signin' && (
                <>
                  New User?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode('signup')}
                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Create an account
                  </button>
                </>
              )}
              {mode === 'signup' && ''}
              {mode === 'forgot-password' && "We'll send you a link to reset your password"}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="absolute -top-2 -right-2 text-gray-400 hover:text-indigo-500 transition-colors p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Auth state indicators */}
        {isAuthLoading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing authentication...</span>
          </div>
        )}
        
        {error && !authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{authError}</span>
          </div>
        )}
        
        {/* Main content with form-specific UI */}
        {renderFormContent()}
        
      </div>
    </div>
  );
  
  // Internal function to render the appropriate form content based on mode
  function renderFormContent() {
    if (String(mode) === 'forgot-password') {
      return (
        <div className="space-y-4">
          {resetEmailSent ? (
            <div className="p-4 mb-4 border border-green-300 bg-green-50 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-green-700">
                  Password reset link sent! Check your email to complete the process.
                </p>
              </div>
              <button
                type="button"
                className="mt-4 w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white
                  bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label htmlFor="reset-email" className="-mb-1 block text-sm font-semibold text-gray-700">
                  Email address
                </label>
                <p className="text-sm text-gray-500 mb-1">
                  Enter your email to receive a password reset link
                </p>
                <div className="relative mt-1">
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={getInputClasses(validationState.email.status)}
                    placeholder="you@example.com"
                    required
                  />
                  {validationState.email.status === 'valid' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                  )}
                  {validationState.email.status === 'invalid' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {validationState.email.status === 'invalid' && (
                  <p className="mt-1 text-sm text-red-600">{validationState.email.message}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={validationState.email.status !== 'valid' || isAuthLoading}
                className={cn(
                  "mt-2 w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white",
                  "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                  "transition-all duration-200 ease-in-out transform hover:scale-[1.01]",
                                    (validationState.email.status !== 'valid' || isAuthLoading) ? "opacity-75 cursor-not-allowed" : ""
                )}
              >
                {isAuthLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "Send Reset Link"}
              </button>
              
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailSent(false);
                    setMode('signin');
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      );
    }
    
    // Normal signin/signup modes
    return (
      <>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="-mb-1 block text-sm font-semibold text-gray-700">
              Email address
            </label>
            <p className="text-sm text-gray-500 mb-1">
              {mode === 'signup' ? 'Enter your email to create an account' : 
               mode === 'signin' ? '' :
               'Enter your email to receive a password reset link'}
            </p>
            <div className="relative mt-1">
            <input
              id="email"
              type="email"
              value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={getInputClasses(validationState.email.status)}
                placeholder="you@example.com"
              required
            />
              {validationState.email.status === 'valid' && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                </div>
              )}
              {validationState.email.status === 'invalid' && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {validationState.email.status === 'invalid' && (
              <p className="mt-1 text-sm text-red-600">{validationState.email.message}</p>
            )}
          </div>
          
          {mode !== 'forgot-password' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
              <p className="text-sm text-gray-500 mb-1">
                {mode === 'signup' 
                  ? 'Create a strong password with at least 8 characters'
                  : ''}
              </p>
              <div className="relative mt-1">
            <input
              id="password"
                  type={showPassword ? 'text' : 'password'}
              value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  className={getInputClasses(validationState.password.status)}
                  placeholder={mode === 'signup' ? '••••••••' : 'Enter your password'}
              required
            />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator (only show during sign up) */}
              {mode === 'signup' && password && (
                <PasswordStrengthMeter strength={passwordStrength} />
              )}
              
              {validationState.password.status === 'invalid' && (
                <p className="mt-1 text-sm text-red-600">{validationState.password.message}</p>
              )}
            </div>
          )}
          
          {mode === 'signin' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMeChecked}
                  onChange={(e) => setRememberMeChecked(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => toggleMode('forgot-password')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}
          
          {mode === 'signup' && (
            <div className="text-sm text-gray-500">
              By creating an account, you agree to our <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>.
          </div>
          )}
          
            <button
              type="submit"
            disabled={isAuthLoading}
            className={cn(
              "w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              "transition-all duration-200 ease-in-out transform hover:scale-[1.01]",
              isAuthLoading ? "opacity-75 cursor-not-allowed" : ""
            )}
          >
            {isAuthLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              mode === 'signin' 
                ? 'Continue' 
                : mode === 'signup'
                  ? 'Sign Up'
                  : 'Send Reset Link'
            )}
            </button>
        </form>
        
        {/* Google Sign-In section */}
        {isSDKLoaded && mode === 'signin' && (
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
          </div>
          
            <div className="mt-4 stable-height-container">
            <GoogleSignInButton
                className="w-full"
                onSuccess={() => {
                  // Log the event
                  logger.info("Google sign-in callback triggered, closing modal");
                  
                  // Force close the modal immediately
                  onClose();
                  
                  // We don't need the progressive approach since we're forcing close
                  // If there are any auth state issues, they'll be handled by the main app
                }}
                onError={(error) => {
                  setAuthError("Google Sign-In failed. Please try again or use email login.");
                  logger.error("Google Sign-In error:", error);
                }}
            />
          </div>
        </div>
        )}
        
       
        
        {mode === 'signup' && (
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
          <button
            type="button"
                onClick={() => toggleMode('signin')}
                className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
          >
                Sign In
          </button>
            </p>
        </div>
        )}
      </>
  );
  }
};

export default AuthModal; 