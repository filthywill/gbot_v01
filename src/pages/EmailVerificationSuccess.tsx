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
  const { lastUsedEmail, setLastUsedEmail } = usePreferencesStore();
  const { isAuthenticated, status, initialize, user, signInWithEmail } = useAuthStore();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [isVerifying, setIsVerifying] = useState(true);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  
  // Make sure we have the latest auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        logger.info('Checking authentication status on verification success page');
        setDebugInfo(prev => ({ ...prev, startTime: new Date().toISOString() }));
        
        // Try to detect the email from the URL if available
        const url = new URL(window.location.href);
        const email = url.searchParams.get('email');
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');
        
        setDebugInfo(prev => ({ 
          ...prev, 
          urlParams: { 
            email: email || 'none', 
            token: token ? `${token.substring(0, 8)}...` : 'none', 
            type: type || 'none'
          } 
        }));
        
        if (email) {
          logger.info('Found email in URL:', email);
          setLastUsedEmail(email);
        }
        
        // Handle direct access with token in URL (fallback mechanism)
        if (token && (type === 'verification' || type === 'signup')) {
          logger.info('Found verification token in URL on success page, processing directly');
          
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup'
            });
            
            setDebugInfo(prev => ({ ...prev, verifyResult: { success: !error, hasData: !!data } }));
            
            if (error) {
              logger.error('Error verifying email on success page:', error);
              setVerificationError(`Verification error: ${error.message}`);
            } else {
              logger.info('Successfully verified email on success page');
            }
          } catch (verifyError) {
            logger.error('Error processing verification token on success page:', verifyError);
            setVerificationError('Failed to process verification token');
            setDebugInfo(prev => ({ ...prev, verifyError }));
          }
        }
        
        // Check for hash fragments which might contain tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');
        const hashEmail = hashParams.get('email');
        
        setDebugInfo(prev => ({ 
          ...prev, 
          hashParams: { 
            hasAccessToken: !!accessToken,
            type: hashType || 'none',
            email: hashEmail || 'none'
          } 
        }));
        
        if (hashEmail) {
          logger.info('Found email in hash:', hashEmail);
          setLastUsedEmail(hashEmail);
        }
        
        if (accessToken && hashType === 'signup') {
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
            }
          } catch (tokenError) {
            logger.error('Error processing hash tokens:', tokenError);
            setDebugInfo(prev => ({ ...prev, hashTokenError: tokenError }));
          }
        }
        
        // Try to auto-login the user if we have their email
        const emailToUse = email || hashEmail || lastUsedEmail;
        if (emailToUse) {
          try {
            // Check if the email is verified using our direct verification check
            logger.info('Checking verification status for email:', emailToUse);
            const verificationResult = await checkEmailVerification(emailToUse);
            setDebugInfo(prev => ({ ...prev, verificationCheck: verificationResult }));
            
            if (verificationResult.verified) {
              logger.info('Email is verified, proceeding with auto-login flow');
              setShowPasswordInput(true);
            } else {
              logger.warn('Email not verified, attempting to force verify:', emailToUse);
              
              // Try to force-verify the email
              const forceResult = await forceVerifyEmail(emailToUse);
              setDebugInfo(prev => ({ ...prev, forceVerifyResult: forceResult }));
              
              if (forceResult.success) {
                logger.info('Successfully initiated force verification, now user can sign in');
                // Even if forcing verification succeeded, we'll show the password input
                // since they still need to sign in
                setShowPasswordInput(true);
              } else {
                logger.error('Failed to force verify email:', forceResult.error);
              }
            }
          } catch (error) {
            logger.error('Error during verification check:', error);
            setDebugInfo(prev => ({ ...prev, verificationCheckError: error }));
          }
        }
        
        // Initialize auth status to get the latest user state
        await initialize();
        setDebugInfo(prev => ({ 
          ...prev, 
          authStatus: { 
            status, 
            isAuthenticated: isAuthenticated(),
            hasUser: !!user
          } 
        }));
        
        setIsVerifying(false);
        setCheckedAuth(true);
      } catch (error) {
        logger.error('Error checking authentication status:', error);
        setVerificationError('Failed to check authentication status');
        setDebugInfo(prev => ({ ...prev, checkAuthError: error }));
        setIsVerifying(false);
        setCheckedAuth(true);
      }
    };
    
    checkAuth();
  }, [initialize, setLastUsedEmail, status, user, isAuthenticated, lastUsedEmail]);
  
  // Handle auto-login with password
  const handleAutoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !lastUsedEmail) return;
    
    setIsVerifying(true);
    try {
      logger.info('Attempting auto-login with verified email');
      
      // Use the direct sign-in function that checks verification first
      const result = await signInDirectlyAfterVerification(lastUsedEmail, password);
      
      if (result.success) {
        logger.info('Auto-login successful after verification');
        // Redirect to home page on success
        window.location.href = '/';
      } else {
        logger.error('Auto-login failed:', result.error);
        setVerificationError(`Auto-login failed: ${result.error}`);
        setShowPasswordInput(false);
        setShowSignIn(true);
      }
    } catch (error) {
      logger.error('Auto-login error:', error);
      setVerificationError('Auto-login failed. Please try signing in manually.');
      setShowPasswordInput(false);
      setShowSignIn(true);
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Check if user is already authenticated
  const userIsLoggedIn = isAuthenticated();
  
  // Auto-show the sign-in modal after a brief delay to allow the user to read the message
  // But only if they're not already authenticated
  useEffect(() => {
    if (checkedAuth && !userIsLoggedIn && !verificationError && !showPasswordInput && !isVerifying) {
      logger.info('User not authenticated, will show sign-in modal after delay');
      const timer = setTimeout(() => {
        if (!showSignIn) {
          handleSignIn();
        }
      }, 5000); // Show sign-in modal after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showSignIn, userIsLoggedIn, checkedAuth, verificationError, showPasswordInput, isVerifying]);
  
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
  if (isVerifying) {
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
              ? 'Your email verification was already processed or has expired.' 
              : 'Your account has been successfully activated.'}
          </p>
        </div>
        
        {verificationError ? (
          <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Verification already processed</p>
            <p className="mt-1">If you've already verified your email, you can sign in directly.</p>
          </div>
        ) : (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Account successfully created</p>
            {lastUsedEmail && (
              <p className="mt-1">Your account <strong>{lastUsedEmail}</strong> is ready to use!</p>
            )}
            {userIsLoggedIn && (
              <p className="mt-2 font-medium">You are now signed in!</p>
            )}
          </div>
        )}
        
        {userIsLoggedIn ? (
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
              disabled={!password}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium 
                text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 
                hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                transition-all duration-200 ease-in-out transform hover:scale-[1.01] disabled:opacity-50"
            >
              Sign In
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
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 border-t border-gray-200 pt-4">
            <p className="text-xs font-medium text-gray-500">Debug Information:</p>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {showSignIn && !userIsLoggedIn && (
        <AuthModal 
          isOpen={showSignIn} 
          onClose={handleCloseModal}
          initialMode="signin"
        />
      )}
    </div>
  );
};

export default EmailVerificationSuccess; 