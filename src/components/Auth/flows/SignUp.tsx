import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, X } from 'lucide-react';
import useAuthStore, { checkEmailVerificationStatus, checkUserExists } from '../../../store/useAuthStore';
import usePreferencesStore from '../../../store/usePreferencesStore';
import { AUTH_VIEWS } from '../../../lib/auth/constants';
import PasswordStrengthMeter from '../PasswordStrengthMeter';
import { checkPasswordStrength, validatePassword } from '../../../utils/passwordUtils';
import logger from '../../../lib/logger';
import { supabase } from '../../../lib/supabase';

interface SignUpProps {
  email: string;
  setEmail: (email: string) => void;
  onEmailValidation: (isValid: boolean) => void;
  onViewChange: (view: string) => void;
  onSignUpComplete: () => void;
  onClose?: () => void;
}

/**
 * SignUp Component
 * Handles the sign-up flow in the authentication process
 */
const SignUp: React.FC<SignUpProps> = ({
  email,
  setEmail,
  onEmailValidation,
  onViewChange,
  onSignUpComplete,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [passwordValid, setPasswordValid] = useState(false);
  
  const { signUpWithEmail, setError, resetError } = useAuthStore();
  const { setLastUsedEmail, setRememberMe } = usePreferencesStore();
  
  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    onEmailValidation(isValid);
  }, [email, onEmailValidation]);
  
  // Password strength checking
  useEffect(() => {
    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
      
      // Validate password
      const validation = validatePassword(password);
      setPasswordValid(validation.isValid);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
      setPasswordValid(false);
    }
  }, [password]);
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!password) {
      setError('Please create a password');
      return;
    }
    
    // Check password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.message || 'Please use a stronger password');
      return;
    }
    
    try {
      setIsLoading(true);
      resetError();
      
      logger.info('Checking if email already exists:', email);
      
      // Direct check for user existence - most reliable method
      const userExists = await checkUserExists(email);
      
      if (userExists) {
        logger.warn('Attempted to sign up with existing email:', email);
        setError('This email is already registered or was previously used. Please use a different email address or sign in instead.');
        return;
      }
      
      // Backup checks
      const { data, error: signInOtpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create a new user, just check if it exists
        }
      });

      // The Supabase signInWithOtp doesn't reliably return a user to indicate email existence
      // Instead, we need to check specific error patterns in the response
      if (signInOtpError) {
        logger.warn('OTP check error:', signInOtpError);
      }

      // More comprehensive check for existing email
      const { verified, error: verificationError } = await checkEmailVerificationStatus(email);

      // If verified is not null or we get an indication of existing credentials, the email exists
      if (verified !== null || 
          (verificationError && verificationError.includes('Invalid login credentials')) ||
          (signInOtpError && signInOtpError.message.toLowerCase().includes('already registered'))) {
        logger.info('Email already exists check result:', { verified, verificationError });
        setError('This email is already registered or was previously used. Please use a different email address or sign in instead.');
        return;
      }
      
      logger.info('Email appears to be new, attempting sign up for:', email);
      
      // Remember this email
      setLastUsedEmail(email);
      setRememberMe(true);
      
      // Attempt sign up with OTP option rather than redirect
      const result = await signUpWithEmail(email, password);
      
      if (!result) {
        throw new Error('Failed to create account');
      }
      
      // If we get here, sign up was successful - move to verification flow
      logger.info('Sign up successful, email confirmation status:', 
        result.session ? 'Automatic' : 'Confirmation email sent with OTP code');
      
      // Call completion handler - transitions to verification code input
      onSignUpComplete();
    } catch (err) {
      logger.error('Sign up error:', err);
      
      // Check if the error is related to a duplicate email
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      if (errorMessage.toLowerCase().includes('email already registered') || 
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('already in use')) {
        setError('This email is already registered or was previously used. Please use a different email address or sign in instead.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className="relative mb-4">
        <h2 className="text-2xl font-extrabold text-brand-primary-900 tracking-tight mb-1.5 text-center">
          Create An Account
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
      
      <div className="text-center mb-6">
        <p className="text-sm text-brand-neutral-700">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onViewChange(AUTH_VIEWS.SIGN_IN)}
            className="font-medium text-brand-primary-600 hover:text-brand-primary-500 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
      
      <form onSubmit={handleSignUp} className="space-y-2">
        <div className="space-y-1">
          <label htmlFor="signup-email" className="block text-sm font-medium text-brand-neutral-600">
            Email
          </label>
          <p className="text-sm text-brand-neutral-400 mb-1">
            Enter your email to create an account
          </p>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500 text-brand-neutral-900 h-11"
            placeholder="Your email address"
            required
          />
        </div>
        
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="block text-sm font-medium text-brand-neutral-600">
            Password
          </label>
          <p className="text-sm text-brand-neutral-400 mb-1">
            Create a strong password with at least 8 characters
          </p>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500 text-brand-neutral-900 h-11"
              placeholder="Create a password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-400 hover:text-brand-neutral-500"
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          
          {password && (
            <PasswordStrengthMeter strength={passwordStrength} />
          )}
        </div>
        
        <div className="text-sm text-brand-neutral-600 pt-2">
          By creating an account, you agree to our <a href="/terms-of-service" className="text-brand-primary-600 hover:text-brand-primary-500">Terms of Service</a> and <a href="/privacy-policy" className="text-brand-primary-600 hover:text-brand-primary-500">Privacy Policy</a>.
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
                Creating Account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default SignUp; 