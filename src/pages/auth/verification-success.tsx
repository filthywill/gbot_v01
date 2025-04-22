import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import AuthModal from '../../components/Auth/AuthModal';
import usePreferencesStore from '../../store/usePreferencesStore';
import useAuthStore from '../../store/useAuthStore';
import logger from '../../lib/logger';
import { supabase } from '../../lib/supabase';
import { 
  checkEmailVerification, 
  forceVerifyEmail, 
  signInDirectlyAfterVerification,
  extractAuthParams
} from '../../lib/auth/utils';

const EmailVerificationSuccess: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const { lastUsedEmail, setLastUsedEmail, setRememberMe } = usePreferencesStore();
  const { isAuthenticated, status, initialize, user, signInWithEmail } = useAuthStore();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [isVerifying, setIsVerifying] = useState(true);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [processingVerification, setProcessingVerification] = useState(true);
  const [needsReVerification, setNeedsReVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [message, setMessage] = useState('');
  
  // Make sure we have the latest auth status
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      if (!mounted) return;
      
      try {
        logger.info('Checking authentication status on verification success page');
        setDebugInfo(prev => ({ ...prev, startTime: new Date().toISOString() }));
        
        // Try to detect the email from the URL if available
        const url = new URL(window.location.href);
        const email = url.searchParams.get('email');
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');
        
        // Check for hash fragments which might contain tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');
        const hashEmail = hashParams.get('email');
        
        setDebugInfo(prev => ({ 
          ...prev, 
          urlParams: { 
            email: email || 'none', 
            token: token ? `${token.substring(0, 8)}...` : 'none', 
            type: type || 'none'
          },
          hashParams: { 
            hasAccessToken: !!accessToken,
            type: hashType || 'none',
            email: hashEmail || 'none'
          }
        }));
        
        const emailToUse = email || hashEmail || lastUsedEmail;
        if (emailToUse) {
          logger.info('Found email in URL or hash:', emailToUse);
          setLastUsedEmail(emailToUse);
        }
        
        // Check if user is already authenticated
        await initialize();
        const isAuth = isAuthenticated();
        setDebugInfo(prev => ({ 
          ...prev, 
          initialAuthCheck: {
            status,
            isAuthenticated: isAuth,
            hasUser: !!user
          } 
        }));
        
        if (isAuth && user) {
          logger.info('User is already authenticated:', user.email);
          setIsVerifying(false);
          setCheckedAuth(true);
          setProcessingVerification(false);
          return;
        }
        
        // Process verification token if present
        let verificationSuccess = false;
        
        // Direct token verification logic
        if (token && (type === 'verification' || type === 'signup' || type === 'recovery' || !type)) {
          logger.info('Found verification token in URL, processing directly');
          
          try {
            // Try to complete verification using the token
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup'
            });
            
            setDebugInfo(prev => ({ ...prev, verifyResult: { success: !error, hasData: !!data } }));
            
            if (error) {
              logger.error('Error verifying email with token:', error);
              setVerificationError(`Verification failed: ${error.message}`);
            } else {
              logger.info('Successfully verified email with token');
              verificationSuccess = true;
              
              // Wait a moment for Supabase to update verification status
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Check if we're authenticated after verification
              await initialize();
              if (isAuthenticated()) {
                logger.info('User is now authenticated after token verification');
                setIsVerifying(false);
                setCheckedAuth(true);
                setProcessingVerification(false);
                return;
              }
            }
          } catch (verifyError) {
            logger.error('Error processing verification token:', verifyError);
            setVerificationError('Failed to process verification token');
            setDebugInfo(prev => ({ ...prev, verifyError }));
          }
        }
        
        // Process access token from hash if present
        if (accessToken && !verificationSuccess) {
          logger.info('Found access token in hash, attempting to set session');
          
          try {
            const refreshToken = hashParams.get('refresh_token') || '';
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) {
              logger.error('Error setting session from hash:', error);
              setDebugInfo(prev => ({ ...prev, sessionError: error }));
            } else {
              logger.info('Successfully set session from hash');
              verificationSuccess = true;
              
              // Check auth status again after setting session
              await initialize();
              
              // If successfully authenticated, we can return early
              if (isAuthenticated()) {
                logger.info('User is now authenticated after setting session from hash');
                setIsVerifying(false);
                setCheckedAuth(true);
                setProcessingVerification(false);
                return;
              }
            }
          } catch (tokenError) {
            logger.error('Error processing hash tokens:', tokenError);
            setDebugInfo(prev => ({ ...prev, hashTokenError: tokenError }));
          }
        }
        
        // If email is present but verification wasn't successful with tokens,
        // check if the email is already verified
        if (emailToUse && !verificationSuccess) {
          try {
            // Check if the email is verified
            logger.info('Checking verification status for email:', emailToUse);
            const verificationResult = await checkEmailVerification(emailToUse);
            setDebugInfo(prev => ({ ...prev, verificationCheck: verificationResult }));
            
            if (verificationResult.verified) {
              logger.info('Email appears to be verified, showing password input');
              setShowPasswordInput(true);
              verificationSuccess = true;
            } else {
              // If email verification check says not verified but we have tokens,
              // it might be a timing issue - let's try one more direct verification attempt
              if (token || accessToken) {
                logger.warn('Email verification check says not verified despite tokens, retrying verification');
                
                // Wait a moment and try direct verification
                await new Promise(resolve => setTimeout(resolve, 2000));
                const retryResult = await checkEmailVerification(emailToUse);
                
                if (retryResult.verified) {
                  logger.info('Email verified on retry check, showing password input');
                  setShowPasswordInput(true);
                  verificationSuccess = true;
                } else {
                  // Still not verified, attempt direct verification process
                  logger.warn('Email still not verified on retry, attempting direct verification');
                  await forceVerifyEmail(emailToUse);
                  
                  // Wait for verification process
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  
                  // Final check
                  const finalResult = await checkEmailVerification(emailToUse);
                  if (finalResult.verified) {
                    logger.info('Email verified after forced verification');
                    setShowPasswordInput(true);
                    verificationSuccess = true;
                  } else {
                    logger.warn('Email still not verified after all attempts');
                    setNeedsReVerification(true);
                  }
                }
              } else {
                logger.warn('Email verification check says not verified, user may need to verify');
                setNeedsReVerification(true);
              }
            }
          } catch (checkError) {
            logger.error('Error checking email verification status:', checkError);
            setDebugInfo(prev => ({ ...prev, checkError }));
            setVerificationError('Unable to determine verification status');
          }
        }
        
        // Handle verification result
        if (verificationSuccess) {
          logger.info('Verification successful');
          
          // If we have an email but no user yet, show password input
          if (emailToUse && showPasswordInput) {
            logger.info('Ready for user to sign in with password');
            setMessage('Your email has been verified! Please sign in.');
            setProcessingVerification(false);
            return;
          }
          
          // If authenticated, we're done
          if (isAuthenticated()) {
            logger.info('User is now authenticated');
            setProcessingVerification(false);
            return;
          }
          
          // If we have an email but verification required password, show modal
          if (emailToUse) {
            logger.info('Email is verified, prompting for login');
            setMessage('Your email has been verified! Please sign in.');
            setShowSignIn(true);
            setProcessingVerification(false);
            return;
          }
        } else {
          // If no success and no need for re-verification, show generic message
          if (!needsReVerification) {
            logger.info('No verification tokens present, showing generic success');
            setMessage('Please check your email inbox to verify your account.');
          }
        }
        
        setProcessingVerification(false);
      } catch (err) {
        logger.error('Error in verification success page:', err);
        setVerificationError(err instanceof Error ? err.message : 'An error occurred during verification');
        setDebugInfo(prev => ({ ...prev, finalError: err }));
        setProcessingVerification(false);
      }
    };
    
    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, [initialize, isAuthenticated, lastUsedEmail, setLastUsedEmail, status, user]);
  
  // Handle auto-login with password for verified emails
  const handleAutoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lastUsedEmail || !password) {
      setVerificationError('Email and password are required');
      return;
    }
    
    try {
      setIsVerifying(true);
      setVerificationError(null);
      
      logger.info('Attempting to sign in user after verification');
      
      // Try direct sign-in with the provided password
      const result = await signInDirectlyAfterVerification(lastUsedEmail, password);
      
      if (result.success) {
        logger.info('Sign-in successful after verification');
        window.location.href = '/'; // Redirect to home page
        return;
      }
      
      // If direct sign-in failed, try regular sign-in
      try {
        await signInWithEmail(lastUsedEmail, password);
        logger.info('Regular sign-in successful after verification');
        window.location.href = '/'; // Redirect to home page
      } catch (signInError) {
        logger.error('Failed to sign in after verification:', signInError);
        setVerificationError('Invalid email or password. Please try again.');
        setIsVerifying(false);
      }
    } catch (err) {
      logger.error('Error in auto-login:', err);
      setVerificationError('Failed to sign in. Please try again.');
      setIsVerifying(false);
    }
  };
  
  // Handle resending verification email
  const handleResendVerification = async () => {
    if (!lastUsedEmail) {
      setVerificationError('No email address found to resend verification');
      return;
    }
    
    try {
      setResendingVerification(true);
      setVerificationError(null);
      
      logger.info('Resending verification email to:', lastUsedEmail);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: lastUsedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/verification-success`
        }
      });
      
      if (error) {
        throw error;
      }
      
      setResendSuccess(true);
      logger.info('Verification email resent successfully');
    } catch (err) {
      logger.error('Error resending verification:', err);
      setVerificationError('Failed to resend verification email. Please try again later.');
    } finally {
      setResendingVerification(false);
    }
  };
  
  // Handle opening sign-in modal
  const handleSignIn = () => {
    setShowSignIn(true);
  };
  
  // Handle closing modal
  const handleCloseModal = () => {
    setShowSignIn(false);
  };
  
  const handleContinue = () => {
    window.location.href = '/';
  };
  
  // Render verification success page
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          {verificationError ? (
            <div className="flex justify-center mb-4">
              <AlertCircle className="text-status-error h-14 w-14" />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-status-success h-14 w-14" />
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-brand-neutral-900 mb-2">
            {verificationError ? 'Verification Issue' : 'Email Verification'}
          </h1>
          
          {processingVerification ? (
            <p className="text-brand-neutral-600">Processing your verification...</p>
          ) : verificationError ? (
            <p className="text-status-error">{verificationError}</p>
          ) : needsReVerification ? (
            <p className="text-brand-neutral-600">Your email needs to be verified before continuing.</p>
          ) : showPasswordInput ? (
            <p className="text-brand-neutral-600">Your email has been verified! You can now sign in.</p>
          ) : (
            <p className="text-brand-neutral-600">{message || 'Your email has been verified! You can now use your account.'}</p>
          )}
        </div>
        
        {processingVerification ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary-500"></div>
          </div>
        ) : verificationError ? (
          <div className="mt-6">
            <button
              onClick={handleContinue}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              Return to Home
            </button>
          </div>
        ) : needsReVerification ? (
          <div className="space-y-4 mt-6">
            <p className="text-sm text-brand-neutral-500">
              We've sent a verification email to <span className="font-medium">{lastUsedEmail}</span>.
              Please check your inbox and follow the instructions to verify your account.
            </p>
            
            {resendSuccess ? (
              <div className="bg-status-success-light border border-status-success-border text-status-success px-4 py-3 rounded text-sm">
                Verification email resent successfully. Please check your inbox.
              </div>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 disabled:opacity-50"
              >
                {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
            
            <p className="text-xs text-brand-neutral-500 text-center">
              Already verified? <button onClick={handleSignIn} className="text-brand-primary-500 hover:text-brand-primary-600">Sign in</button>
            </p>
          </div>
        ) : showPasswordInput ? (
          <form onSubmit={handleAutoLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-neutral-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={lastUsedEmail || ''}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm bg-brand-neutral-100 text-brand-neutral-900"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-neutral-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 disabled:opacity-50"
              >
                {isVerifying ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6">
            <button
              onClick={handleContinue}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              Continue to App
            </button>
          </div>
        )}
      </div>
      
      {/* Display debug info in development */}
      {import.meta.env.VITE_APP_ENV !== 'production' && (
        <div className="mt-8 max-w-md w-full">
          <p className="text-white text-xs mb-2">Debug Information:</p>
          <pre className="overflow-auto text-xs bg-white p-2 rounded text-brand-neutral-800 max-h-48">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Auth modal for sign in */}
      {showSignIn && (
        <AuthModal
          isOpen={showSignIn}
          onClose={handleCloseModal}
          initialView="signin"
          initialEmail={lastUsedEmail}
        />
      )}
    </div>
  );
};

export default EmailVerificationSuccess; 