import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, X } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import usePreferencesStore from '../../../store/usePreferencesStore';
import useGoogleAuthStore from '../../../store/useGoogleAuthStore';
import { AUTH_VIEWS } from '../../../lib/auth/constants';
import GoogleSignInButton from '../GoogleSignInButton';
import logger from '../../../lib/logger';

interface SignInProps {
  email: string;
  setEmail: (email: string) => void;
  onEmailValidation: (isValid: boolean) => void;
  onViewChange: (view: string) => void;
  onSuccess: () => void;
  onClose?: () => void;
}

/**
 * SignIn Component
 * Handles the sign-in flow in the authentication process
 */
const SignIn: React.FC<SignInProps> = ({
  email,
  setEmail,
  onEmailValidation,
  onViewChange,
  onSuccess,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMeChecked, setRememberMeChecked] = useState(false);
  
  const { signInWithEmail, resetError } = useAuthStore();
  const { setRememberMe, setLastUsedEmail, rememberMe } = usePreferencesStore();
  const { isSDKLoaded } = useGoogleAuthStore();
  
  // Initialize with stored preferences
  useEffect(() => {
    setRememberMeChecked(rememberMe);
  }, [rememberMe]);
  
  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    onEmailValidation(isValid);
  }, [email, onEmailValidation]);
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      resetError();
      const error = new Error('Please enter both email and password');
      logger.error('Sign in validation error:', error);
      useAuthStore.setState({ error: error.message });
      return;
    }
    
    try {
      setIsLoading(true);
      resetError();
      
      logger.info('Attempting sign in for user:', email);
      
      // Save preferences first
      setRememberMe(rememberMeChecked);
      if (rememberMeChecked) {
        setLastUsedEmail(email);
      }
      
      // Attempt sign in - errors will be handled by the store
      await signInWithEmail(email, password);
      
      // If we get here, authentication was successful
      logger.info('Sign in successful');
      onSuccess();
    } catch (err) {
      logger.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className="relative mb-4">
        <h2 className="text-2xl font-extrabold text-brand-primary-900 tracking-tight mb-1.5 text-center">
          Sign In
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
          New user?{' '}
          <button
            type="button"
            onClick={() => onViewChange(AUTH_VIEWS.SIGN_UP)}
            className="font-medium text-brand-primary-600 hover:text-brand-primary-500 hover:underline"
          >
            Create an account
          </button>
        </p>
      </div>
      
      <form onSubmit={handleSignIn} className="space-y-2">
        {/* Error is now handled at the modal level, so we remove the duplicate display here */}
        
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-brand-neutral-600">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500 text-brand-neutral-900 h-11"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-brand-neutral-600">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500 text-brand-neutral-900 h-11"
              placeholder="Enter your password"
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
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMeChecked}
              onChange={(e) => setRememberMeChecked(e.target.checked)}
              className="h-4 w-4 text-brand-primary-600 focus:ring-brand-primary-500 border-brand-neutral-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-brand-neutral-600">
              Remember me
            </label>
          </div>
          
          <button
            type="button"
            onClick={() => onViewChange(AUTH_VIEWS.FORGOT_PASSWORD)}
            className="text-sm font-medium text-brand-primary-600 hover:text-brand-primary-500 hover:underline"
          >
            Forgot password?
          </button>
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
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
        
        {isSDKLoaded && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-brand-neutral-500">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-4">
              <GoogleSignInButton onSuccess={onSuccess} />
            </div>
          </div>
        )}
      </form>
    </>
  );
};

export default SignIn; 