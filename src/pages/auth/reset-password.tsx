import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { EyeIcon, EyeOffIcon, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import PasswordStrengthMeter from '../../components/Auth/PasswordStrengthMeter';
import { checkPasswordStrength, validatePassword } from '../../utils/passwordUtils';
import logger from '../../lib/logger';
import useAuthStore from '../../store/useAuthStore';
import { AuthError, Session, User } from '@supabase/supabase-js';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any> | null>(null);
  
  // Get the signOut function from auth store
  const { signOut } = useAuthStore();

  // Log component mount for debugging
  useEffect(() => {
    logger.info('ResetPassword component mounted', {
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    });
    
    // Capture and display debug info
    const urlInfo = {
      fullUrl: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      token: new URLSearchParams(window.location.search).get('token'),
      type: new URLSearchParams(window.location.search).get('type'),
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(urlInfo);
    logger.debug('Reset password URL info:', urlInfo);
    
    return () => {
      logger.info('ResetPassword component unmounted');
    };
  }, []);

  // Check for reset token on mount
  useEffect(() => {
    const checkRecoveryToken = async () => {
      try {
        setIsCheckingToken(true);
        logger.info('Checking for recovery hash fragment in URL:', window.location.hash);
        
        // Check if we're in a recovery flow based on hash fragment
        const isRecoveryFlow = window.location.hash === '#recovery';
        
        if (isRecoveryFlow) {
          logger.info('Recovery hash fragment found, checking for token in URL');
          
          // Get token from URL
          const url = new URL(window.location.href);
          const urlToken = url.searchParams.get('token');
          const tokenType = url.searchParams.get('type') || 'recovery';
          
          if (urlToken) {
            setToken(urlToken);
            setIsTokenValid(true); // Assume token is valid to show form immediately
            
            // Verify the token in background
            try {
              // Log token verification attempt
              logger.debug('Verifying token', { tokenType, tokenLength: urlToken.length });
              
              const verifyResult = await supabase.auth.verifyOtp({
                token_hash: urlToken,
                type: tokenType
              });
              
              const { data, error: verifyError } = verifyResult;
              
              if (verifyError) {
                logger.error('Invalid recovery token:', verifyError);
                setError(`Password reset failed: ${verifyError.message}`);
                setIsTokenValid(false);
              } else {
                logger.info('Token verified successfully, ready for password reset', { 
                  hasUser: !!data?.user,
                  hasSession: !!data?.session
                });
              }
            } catch (err) {
              logger.error('Error verifying token:', err);
              setError('Error verifying reset token: ' + (err instanceof Error ? err.message : String(err)));
              setIsTokenValid(false);
            } finally {
              setIsCheckingToken(false);
            }
            
            // Don't wait for verification to complete, show the form immediately
            setIsCheckingToken(false);
            return;
          } else {
            logger.warn('Recovery hash fragment found but no token in URL');
          }
          
          // If no token in URL, check for active session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setIsTokenValid(true);
            logger.info('Session is valid for password reset');
          } else {
            setError('Invalid or expired reset link. Please request a new password reset.');
            setIsTokenValid(false);
            logger.warn('No token in URL and no active session');
          }
        } else {
          // No recovery hash found, user might have navigated here directly
          logger.info('No recovery hash fragment found, user may have navigated directly');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // User is already authenticated
            setIsTokenValid(true);
            logger.info('User is authenticated, allowing password reset');
          } else {
            setError('Please use the password reset link from your email.');
            setIsTokenValid(false);
            logger.warn('User is not authenticated and no recovery flow detected');
          }
        }
      } catch (err) {
        logger.error('Error checking reset token:', err);
        setError('Unable to verify reset token. Please try again. Error: ' + (err instanceof Error ? err.message : String(err)));
        setIsTokenValid(false);
      } finally {
        setIsCheckingToken(false);
      }
    };
    
    checkRecoveryToken();
  }, []);

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(checkPasswordStrength(newPassword));
    }
  }, [newPassword]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      // Clear hash fragment when component unmounts after success
      if (isSuccess && window.history && window.history.replaceState) {
        window.history.replaceState(null, document.title, window.location.pathname);
      }
    };
  }, [isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTokenValid) {
      setError('Invalid or expired reset link. Please request a new password reset.');
      return;
    }
    
    // Reset error state
    setError(null);
    
    // Validate the new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.message || 'Password is not strong enough');
      return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // Comprehensive sign out to clear the temporary auth session
      try {
        // Sign out from Supabase
        await supabase.auth.signOut();
        
        // Also clear the session from auth store
        signOut();
        
        // Clear any localStorage items related to auth
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('gbot_supabase_auth');
        
        logger.info('Successfully signed out after password reset');
      } catch (signOutError) {
        logger.error('Error signing out after password reset:', signOutError);
        // Continue to success state even if sign out has issues
      }
      
      // Show success state
      setIsSuccess(true);
      logger.info('Password updated successfully');
    } catch (err) {
      logger.error('Error updating password:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    // Redirect to the home page with a success parameter
    window.location.href = '/?passwordReset=success';
  };

  const handleRequestNewReset = () => {
    window.location.href = '/?reset=true';
  };

  // Show loading state while checking the token
  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-neutral-900">Verifying Reset Link</h2>
            <p className="mt-2 text-brand-neutral-600">
              Please wait while we verify your password reset link...
            </p>
          </div>
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-brand-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          {debugInfo && import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-48">
              <p className="font-semibold mb-1">Debug Info:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-neutral-900">Invalid Reset Link</h2>
            <p className="mt-2 text-brand-neutral-600">
              This password reset link is invalid or has expired. Please request a new password reset or try entering the token manually below.
            </p>
          </div>
          
          <div className="mt-4 mb-6">
            <label htmlFor="manual-token" className="block text-sm font-medium text-brand-neutral-600 mb-1">
              Enter Reset Token Manually
            </label>
            <p className="text-xs text-brand-neutral-500 mb-2">
              If you have a valid token from your email, you can enter it here
            </p>
            <div className="flex gap-2">
              <input
                id="manual-token"
                type="text"
                placeholder="Enter token from email"
                className="block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
                value={token || ''}
                onChange={(e) => setToken(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (token) {
                    setIsCheckingToken(true);
                    supabase.auth.verifyOtp({
                      token_hash: token,
                      type: 'recovery'
                    }).then(({ data, error: verifyError }: { 
                      data: { user: User | null; session: Session | null }; 
                      error: AuthError | null 
                    }) => {
                      if (verifyError) {
                        setError(`Manual token verification failed: ${verifyError.message}`);
                        setIsTokenValid(false);
                        logger.error('Manual token verification failed:', verifyError);
                      } else {
                        setIsTokenValid(true);
                        setError(null);
                        logger.info('Manual token verification succeeded');
                      }
                    }).catch((err: unknown) => {
                      setError('Error verifying token manually: ' + (err instanceof Error ? err.message : String(err)));
                      setIsTokenValid(false);
                      logger.error('Error in manual token verification:', err);
                    }).finally(() => {
                      setIsCheckingToken(false);
                    });
                  } else {
                    setError('Please enter a token');
                  }
                }}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
              >
                Verify
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
          
          {debugInfo && import.meta.env.DEV && (
            <div className="mt-4 mb-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-48">
              <p className="font-semibold mb-1">Debug Info:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          
          <button
            onClick={handleRequestNewReset}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-neutral-900">Password Updated</h2>
            <p className="mt-2 text-brand-neutral-600">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
          </div>
          
          <button
            onClick={handleSignIn}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-brand-neutral-900">Reset Your Password</h2>
          <p className="mt-2 text-brand-neutral-600">
            Please create a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-brand-neutral-900">
              New Password
            </label>
            <div className="mt-1 relative">
              <input
                id="new-password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-500"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="mt-2">
                <PasswordStrengthMeter
                  strength={{
                    score: passwordStrength.score,
                    feedback: passwordStrength.feedback
                  }}
                />
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-neutral-900">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500",
                  confirmPassword && newPassword !== confirmPassword
                    ? "border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    : "border-brand-neutral-300"
                )}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-2 text-sm text-red-600">
                Passwords do not match
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 