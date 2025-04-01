import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import GoogleSignInButton from './GoogleSignInButton';
import { cn } from '../../lib/utils';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { checkPasswordStrength } from '../../utils/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot-password';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    error, 
    isLoading, 
    resetError,
    rememberMe,
    setRememberMe
  } = useAuthStore();
  
  // Reset password strength when changing modes
  useEffect(() => {
    setPasswordStrength({ score: 0, feedback: [] });
  }, [mode]);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'forgot-password') {
      await resetPassword(email);
      return;
    }
    
    if (mode === 'signin') {
      await signInWithEmail(email, password, rememberMe);
    } else {
      await signUpWithEmail(email, password);
    }
    
    // If no error, close the modal
    if (!useAuthStore.getState().error) {
      onClose();
    }
  };
  
  const toggleMode = (newMode: AuthMode) => {
    resetError();
    setMode(newMode);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Only check strength during sign up
    if (mode === 'signup' && newPassword) {
      setPasswordStrength(checkPasswordStrength(newPassword));
    }
  };
  
  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-orange-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-lime-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <p className="text-sm text-gray-500 mb-1">
              {mode === 'signup' ? 'Enter your email to create an account' : ''}
            </p>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                text-gray-900 placeholder-gray-400"
              placeholder="you@example.com"
              required
            />
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                    text-gray-900 placeholder-gray-400"
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
                <div className="mt-2">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-300", getPasswordStrengthColor())}
                      style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                    />
                  </div>
                  {passwordStrength.feedback.map((feedback, index) => (
                    <p key={index} className="text-xs text-gray-500 mt-1">{feedback}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {mode === 'signin' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => toggleMode('forgot-password')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </button>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white",
              "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition duration-150 ease-in-out"
            )}
          >
            {isLoading 
              ? 'Loading...' 
              : mode === 'signin' 
                ? 'Sign In' 
                : mode === 'signup'
                  ? 'Sign Up'
                  : 'Send Reset Link'
            }
          </button>
        </form>
        
        {mode !== 'forgot-password' && (
          <>
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-3">
                <GoogleSignInButton
                  onSuccess={onClose}
                  onError={(err) => console.error('Google Sign-In error:', err)}
                />
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => toggleMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal; 