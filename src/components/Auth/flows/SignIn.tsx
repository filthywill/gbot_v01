import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, X } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import usePreferencesStore from '../../../store/usePreferencesStore';
import useGoogleAuthStore from '../../../store/useGoogleAuthStore';
import { AUTH_VIEWS } from '../../../lib/auth/constants';
import GoogleSignInButton from '../GoogleSignInButton';
import MagicLinkForm from '../MagicLinkForm';
import logger from '../../../lib/logger';

interface SignInProps {
  email: string;
  setEmail: (email: string) => void;
  onEmailValidation: (isValid: boolean) => void;
  onViewChange: (view: string) => void;
  onSuccess: () => void;
  onClose?: () => void;
  showGoogleSignIn?: boolean;
  autoFocusPassword?: boolean;
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
  showGoogleSignIn = true,
  autoFocusPassword = false
}) => {
  const [formEmail, setFormEmail] = useState(email);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMeChecked, setRememberMeChecked] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'magic-link'>('password');
  
  const { signInWithEmail, resetError } = useAuthStore();
  const { setRememberMe, setLastUsedEmail, rememberMe } = usePreferencesStore();
  const { isSDKLoaded } = useGoogleAuthStore();
  
  // Initialize with stored preferences
  useEffect(() => {
    setRememberMeChecked(rememberMe);
  }, [rememberMe]);
  
  // Reset error when unmounting
  useEffect(() => {
    return () => {
      resetError();
    };
  }, [resetError]);
  
  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    onEmailValidation(isValid);
  }, [email, onEmailValidation]);
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formEmail || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      logger.info('Attempting email sign in', { email: formEmail });
      const success = await signInWithEmail(formEmail, password);
      
      if (success) {
        // Store preferences if remember me is checked
        if (rememberMeChecked) {
          setRememberMe(true);
          setLastUsedEmail(formEmail);
        } else {
          setRememberMe(false);
          setLastUsedEmail(null);
        }
      } else {
        setErrorMessage('Invalid email or password');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      setErrorMessage(message);
      logger.error('Sign in error', { error: message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMeChecked(e.target.checked);
  };
  
  const toggleAuthMethod = () => {
    setAuthMethod(authMethod === 'password' ? 'magic-link' : 'password');
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-md px-4 py-8 mx-auto">
      <div className="flex justify-end">
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <div className="flex justify-center space-x-4 mb-6">
        <button
          className={`py-2 px-4 text-sm font-medium rounded-md ${
            authMethod === 'password'
              ? 'bg-brand-primary-100 text-brand-primary-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setAuthMethod('password')}
        >
          Password
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium rounded-md ${
            authMethod === 'magic-link'
              ? 'bg-brand-primary-100 text-brand-primary-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setAuthMethod('magic-link')}
        >
          Magic Link
        </button>
      </div>

      {authMethod === 'password' ? (
        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500"
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => onViewChange(AUTH_VIEWS.RESET_PASSWORD)}
                className="text-sm text-brand-primary-600 hover:text-brand-primary-800"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                autoFocus={autoFocusPassword}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center mb-6">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMeChecked}
              onChange={handleRememberMeChange}
              className="h-4 w-4 text-brand-primary-600 focus:ring-brand-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-brand-primary-600 hover:bg-brand-primary-700'
            }`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      ) : (
        <MagicLinkForm />
      )}
      
      {showGoogleSignIn && isSDKLoaded && (
        <>
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">Or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          <GoogleSignInButton />
        </>
      )}
      
      <div className="mt-6 text-center">
        <span className="text-sm text-gray-600">Don't have an account?</span>{' '}
        <button
          onClick={() => onViewChange(AUTH_VIEWS.SIGN_UP)}
          className="text-sm text-brand-primary-600 hover:text-brand-primary-800 font-medium"
        >
          Sign up
        </button>
      </div>
    </div>
  );
};

export default SignIn; 