import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';
import logger from '../../lib/logger';

// This component handles all authentication callbacks:
// - OAuth redirects
// - Email verification
// - Password reset
const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [message, setMessage] = useState<string>('Processing authentication...');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { initialize } = useAuthStore();
  const { setLastUsedEmail, setRememberMe } = usePreferencesStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Log the full URL for debugging
        const fullUrl = window.location.href;
        logger.info('Processing authentication callback, URL:', fullUrl);
        
        // Detect and log double slash issues
        if (fullUrl.includes('//auth')) {
          logger.warn('Detected double slash in URL that may cause routing issues');
        }
        
        setDebugInfo(prev => ({ ...prev, fullUrl }));
        
        // First, check hash fragments for access tokens (OAuth flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          logger.debug('Found access token in hash, setting session');
          setMessage('Setting up your session...');
          setDebugInfo(prev => ({ ...prev, flowType: 'oauth-hash' }));
          
          // Set the session directly
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          // Initialize auth state
          await initialize();
          
          // Clean URL and redirect to home
          window.location.replace('/');
          return;
        }
        
        // Next, check for code parameter (OAuth and some email flows)
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const queryParams = {};
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
        setDebugInfo(prev => ({ ...prev, queryParams }));
        logger.debug('URL query parameters:', queryParams);
        
        if (code) {
          logger.debug('Found auth code in URL, exchanging for session:', code);
          setMessage('Authenticating your account...');
          setDebugInfo(prev => ({ ...prev, flowType: 'code-exchange' }));
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            logger.error('Error exchanging code for session:', error);
            setDebugInfo(prev => ({ ...prev, exchangeError: error }));
            throw error;
          }
          
          logger.info('Successfully exchanged code for session:', data);
          setDebugInfo(prev => ({ ...prev, sessionData: data }));
          
          // Initialize auth state
          await initialize();
          logger.info('Successfully exchanged code for session');
          
          // Redirect to home
          window.location.replace('/');
          return;
        }
        
        // Check for email verification tokens
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');
        const email = url.searchParams.get('email');
        
        if (token) {
          logger.debug('Found token in URL, type:', type, 'token:', token.substring(0, 8) + '...');
          setMessage('Processing your verification...');
          setDebugInfo(prev => ({ ...prev, flowType: 'token-verification', tokenType: type }));
          
          if (email) {
            // Store the verified email for login form
            setLastUsedEmail(email);
            setRememberMe(true); // Remember this user since they verified their email
            logger.debug('Saved email for future login:', email);
          }
          
          // For Supabase email verification
          if (type === 'signup' || type === 'verification') {
            logger.debug('Attempting email verification with token');
            
            // Attempt to verify the token and authenticate the user
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup'
            });
            
            setDebugInfo(prev => ({ ...prev, verifyResult: { data, error } }));
            
            if (error) {
              logger.error('Error verifying email:', error);
              // Even if verification failed, still redirect to verification success
              // This handles cases where the user clicks the link twice
              window.location.replace('/verification-success');
              return;
            }
            
            // If we got a session back, the user is now authenticated!
            if (data?.session) {
              logger.info('Email verified and user authenticated!');
              
              // Initialize auth state with new session
              await initialize();
              
              // Redirect to verification success page
              window.location.replace('/verification-success');
              return;
            } else {
              // Token was valid but no session was created
              logger.warn('Email verified but no session created');
              window.location.replace('/verification-success');
              return;
            }
          }
          
          // If we have a token but didn't handle it above, try a generic approach
          logger.debug('Attempting generic token verification');
          try {
            // Try to process the token directly via Supabase
            const result = await fetch(`${supabase.auth.api.url}/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabase.auth.api.key
              },
              body: JSON.stringify({ token, type: type || 'signup' })
            });
            
            const resultData = await result.json();
            logger.debug('Generic verification result:', resultData);
            setDebugInfo(prev => ({ ...prev, genericVerifyResult: resultData }));
            
            // Redirect to success page regardless of result
            // The verification status will be checked there
            window.location.replace('/verification-success');
            return;
          } catch (verifyError) {
            logger.error('Error in generic verification:', verifyError);
            setDebugInfo(prev => ({ ...prev, genericVerifyError: verifyError }));
            window.location.replace('/verification-success');
            return;
          }
        }
        
        // If we reach here, no valid auth parameters were found
        logger.warn('No authentication parameters found in URL');
        setError('No authentication parameters found');
        setDebugInfo(prev => ({ ...prev, flowType: 'no-params-found' }));
        
        // Redirect to home after a delay
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } catch (err) {
        logger.error('Error during authentication callback', err);
        setError(err instanceof Error ? err.message : 'Failed to complete authentication');
        setDebugInfo(prev => ({ ...prev, finalError: err }));
        
        // Redirect to home after a delay
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [initialize, setLastUsedEmail, setRememberMe]);

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-zinc-900">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <p className="font-bold">Authentication Error</p>
          <p>{error}</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 overflow-auto text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </div>
        <a href="/" className="mt-4 text-blue-400 hover:underline">
          Return to Home
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center justify-center min-h-screen bg-zinc-900">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-white">{message}</p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 max-w-md w-full">
            <p className="text-white text-xs mb-2">Debug Information:</p>
            <pre className="overflow-auto text-xs bg-gray-100 p-2 rounded text-gray-800">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 