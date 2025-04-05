import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import AuthModal from '../components/Auth/AuthModal';
import usePreferencesStore from '../store/usePreferencesStore';
import useAuthStore from '../store/useAuthStore';
import logger from '../lib/logger';
import { supabase } from '../lib/supabase';
import { checkEmailVerification, forceVerifyEmail, signInDirectlyAfterVerification } from '../components/Auth/AuthWrapper';

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
                  
                  // Final verification check
                  const finalCheck = await checkEmailVerification(emailToUse);
                  
                  if (finalCheck.verified) {
                    logger.info('Email verified after forced verification, showing password input');
                    setShowPasswordInput(true);
                    verificationSuccess = true;
                  } else {
                    logger.error('All verification attempts failed');
                    setVerificationError('Verification could not be completed. Please check your email for a verification link or request a new one.');
                    setNeedsReVerification(true);
                  }
                }
              } else {
                // No tokens and not verified - needs a new verification
                logger.warn('Email not verified and no tokens present');
                setVerificationError('Your email needs to be verified. Please check your email for a verification link or request a new one.');
                setNeedsReVerification(true);
              }
            }
          } catch (error) {
            logger.error('Error during verification check:', error);
            setDebugInfo(prev => ({ ...prev, verificationCheckError: error }));
            setVerificationError('Failed to check email verification status. Please try signing in directly.');
          }
        }
        
        // Final auth check
        await initialize();
        setDebugInfo(prev => ({ 
          ...prev, 
          finalAuthStatus: { 
            status, 
            isAuthenticated: isAuthenticated(),
            hasUser: !!user
          } 
        }));
        
        setIsVerifying(false);
        setCheckedAuth(true);
        setProcessingVerification(false);
      } catch (error) {
        if (!mounted) return;
        
        logger.error('Error checking authentication status:', error);
        setVerificationError('Failed to check authentication status');
        setDebugInfo(prev => ({ ...prev, checkAuthError: error }));
        setIsVerifying(false);
        setCheckedAuth(true);
        setProcessingVerification(false);
      }
    };
    
    checkAuth();
    return () => { mounted = false; };
  }, [initialize, setLastUsedEmail, isAuthenticated, status, user, lastUsedEmail]);
  
  // Handle auto-login with password
  const handleAutoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !lastUsedEmail) return;
    
    setIsVerifying(true);
    try {
      logger.info('Attempting auto-login with verified email:', lastUsedEmail);
      console.log('AUTO-LOGIN ATTEMPT', { email: lastUsedEmail });
      
      // Set remember me to true so the user stays logged in
      setRememberMe(true);
      
      // Use the direct sign-in function that checks verification first
      const result = await signInDirectlyAfterVerification(lastUsedEmail, password);
      console.log('AUTO-LOGIN RESULT:', result);
      
      if (result.success) {
        logger.info('Auto-login successful after verification');
        console.log('AUTO-LOGIN SUCCESSFUL');
        
        // Store the user's email in preferences
        setLastUsedEmail(lastUsedEmail);
        setRememberMe(true);
        
        // Reinitialize auth to make sure we have the latest state
        await initialize();
        
        // Add loading feedback for user
        setMessage('Login successful! Redirecting to home...');
        
        // Create a small delay to allow auth state to update and give user feedback
        setTimeout(() => {
          // Force redirect to home page
          window.location.href = '/';
        }, 1500);
      } else {
        logger.error('Auto-login failed:', result.error);
        console.log('AUTO-LOGIN FAILED:', result.error);
        
        // Clear any existing session to be safe
        await supabase.auth.signOut();
        
        // Check if we need to re-verify the email
        if (result.needsVerification) {
          setNeedsReVerification(true);
          setVerificationError('Your email needs to be verified. Please check your inbox for a verification link or request a new verification email.');
        } else {
          setVerificationError(`Sign-in failed: ${result.error}`);
        }
        
        // Keep the password input form visible with the error
        setShowPasswordInput(true);
      }
    } catch (error) {
      logger.error('Auto-login error:', error);
      console.error('AUTO-LOGIN EXCEPTION:', error);
      setVerificationError('Sign-in failed. Please try again or use the sign-in option below.');
      setShowPasswordInput(true); // Keep form visible with error
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handle resending verification email
  const handleResendVerification = async () => {
    if (!lastUsedEmail) return;
    
    setResendingVerification(true);
    setResendSuccess(false);
    
    try {
      logger.info('Requesting new verification email for:', lastUsedEmail);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: lastUsedEmail,
        options: {
          shouldCreateUser: false
        }
      });
      
      if (error) {
        logger.error('Error sending verification email:', error);
        
        // Handle rate limiting errors specifically
        if (error.message.includes('security purposes') || error.message.includes('rate limit')) {
          setVerificationError('Please wait a moment before requesting another verification email.');
        } else {
          setVerificationError(`Failed to send verification email: ${error.message}`);
        }
      } else {
        logger.info('Successfully sent new verification email');
        setResendSuccess(true);
        setVerificationError(null);
      }
    } catch (error) {
      logger.error('Exception sending verification email:', error);
      setVerificationError('Failed to send verification email. Please try again later.');
    } finally {
      setResendingVerification(false);
    }
  };
  
  // Auto-show the sign-in modal after a brief delay to allow the user to read the message
  // But only if they're not already authenticated and not showing the password input
  useEffect(() => {
    // Only show sign-in modal if:
    // 1. Auth check is complete
    // 2. User is not logged in
    // 3. No verification error is showing
    // 4. Not showing the password input form
    // 5. Not currently verifying
    // 6. Sign-in modal is not already showing
    // 7. Not still processing verification
    if (checkedAuth && 
        !isAuthenticated() && 
        !verificationError && 
        !showPasswordInput && 
        !isVerifying && 
        !showSignIn &&
        !processingVerification) {
      
      logger.info('User not authenticated, will show sign-in modal after delay');
      const timer = setTimeout(() => {
        handleSignIn();
      }, 5000); // Show sign-in modal after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [checkedAuth, isAuthenticated, verificationError, showPasswordInput, isVerifying, showSignIn, processingVerification]);
  
  const handleSignIn = () => {
    setShowSignIn(true);
    logger.info('Opening sign in modal after email verification');
  };
  
  const handleCloseModal = () => {
    setShowSignIn(false);
  };
  
  const handleContinue = () => {
    window.location.href = '/';
  };
  
  // Show a loading state while checking auth
  if (isVerifying || processingVerification) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-white">Verifying your account...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            {verificationError ? (
              <AlertCircle className="h-8 w-8 text-amber-600" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {verificationError ? 'Verification Notice' : 'Email Verified!'}
          </h1>
          <p className="mt-2 text-gray-600">
            {verificationError 
              ? 'There was an issue with your email verification.' 
              : 'Your account has been successfully activated.'}
          </p>
        </div>
        
        {resendSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Verification email sent!</p>
            <p className="mt-1">Please check your inbox and click the verification link.</p>
          </div>
        )}
        
        {verificationError ? (
          <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Verification issue</p>
            <p className="mt-1">{verificationError}</p>
            <p className="mt-1">If you've already verified your email, you can try signing in directly.</p>
            
            {needsReVerification && !resendSuccess && (
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="mt-3 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm 
                  font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
              >
                {resendingVerification ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⟳</span> Sending...
                  </span>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Account successfully created</p>
            {lastUsedEmail && (
              <p className="mt-1">Your account <strong>{lastUsedEmail}</strong> is ready to use!</p>
            )}
            {isAuthenticated() && (
              <p className="mt-2 font-medium">You are now signed in!</p>
            )}
          </div>
        )}
        
        {isAuthenticated() ? (
          <button
            onClick={handleContinue}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium 
              text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 
              hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
          >
            Continue to App
          </button>
        ) : showPasswordInput ? (
          <form onSubmit={handleAutoLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Enter your password to continue
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                  focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!password || isVerifying}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium 
                text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 
                hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                transition-all duration-200 ease-in-out transform hover:scale-[1.01] disabled:opacity-50"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⟳</span> Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordInput(false);
                  handleSignIn();
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Use a different account
              </button>
            </div>
          </form>
        ) : (
          <>
            <button
              onClick={handleSignIn}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium 
                text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 
                hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
            >
              Sign In Now
            </button>
            
            <div className="mt-4 text-center text-xs text-gray-400">
              <p>The sign-in form will open automatically in a few seconds...</p>
            </div>

            <div className="mt-4 text-center">
              <a 
                href="/debug-verification" 
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Debug Verification
              </a>
            </div>
          </>
        )}
        
        <p className="mt-4 text-center text-sm text-gray-500">
          Or return to the <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">home page</a>
        </p>
        
        {import.meta.env.VITE_APP_ENV !== 'production' && (
          <div className="mt-8 border-t border-gray-200 pt-4">
            <p className="text-xs font-medium text-gray-500">Debug Information:</p>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {showSignIn && !isAuthenticated() && (
        <AuthModal 
          isOpen={showSignIn} 
          onClose={handleCloseModal}
          initialMode="signin"
          prefillEmail={lastUsedEmail}
        />
      )}
    </div>
  );
};

export default EmailVerificationSuccess; 