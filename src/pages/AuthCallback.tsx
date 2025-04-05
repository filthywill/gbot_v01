import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';
import usePreferencesStore from '../store/usePreferencesStore';
import logger from '../lib/logger';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [message, setMessage] = useState<string>('Processing authentication...');
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const { initialize } = useAuthStore();
  const { setLastUsedEmail, setRememberMe } = usePreferencesStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Log the full URL for debugging
        const fullUrl = window.location.href;
        logger.info('AuthCallback Page: Processing authentication, URL:', fullUrl);
        
        // Store the full URL for debugging
        setDebugInfo(prev => ({ ...prev, fullUrl }));
        
        // IMPORTANT: Check for hash fragment (used by Supabase for many auth flows)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        if (accessToken) {
          logger.debug('Found access_token in hash, processing authentication');
          setMessage('Setting up your session...');
          setDebugInfo(prev => ({ ...prev, flowType: 'hash-auth', tokenType: type }));
          
          try {
            // Set the session directly using the tokens from the hash
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              logger.error('Error setting session from hash:', error);
              throw error;
            }
            
            // Initialize auth state
            await initialize();
            logger.info('Successfully authenticated via hash parameters');
            
            // Redirect to home
            window.location.replace('/');
            return;
          } catch (tokenError) {
            logger.error('Error processing hash tokens:', tokenError);
            setDebugInfo(prev => ({ ...prev, hashTokenError: tokenError }));
            // Continue to try other auth methods
          }
        }
        
        // Check for code parameter (OAuth and some email flows)
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const queryParams: Record<string, string> = {};
        
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
        
        setDebugInfo(prev => ({ ...prev, queryParams }));
        logger.debug('URL query parameters:', queryParams);
        
        if (code) {
          logger.debug('Found auth code in URL, exchanging for session');
          setMessage('Authenticating your account...');
          setDebugInfo(prev => ({ ...prev, flowType: 'code-exchange' }));
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            logger.error('Error exchanging code for session:', error);
            setDebugInfo(prev => ({ ...prev, exchangeError: error }));
            throw error;
          }
          
          logger.info('Successfully exchanged code for session');
          
          // Initialize auth state
          await initialize();
          
          // Redirect to home or success page
          window.location.replace('/verification-success');
          return;
        }
        
        // Check for email verification tokens
        const token = url.searchParams.get('token');
        const urlType = url.searchParams.get('type');
        const email = url.searchParams.get('email');
        
        if (token) {
          logger.debug('Found token in URL, type:', urlType || 'unknown');
          setMessage('Processing your verification...');
          setDebugInfo(prev => ({ ...prev, flowType: 'token-verification', tokenType: urlType }));
          
          if (email) {
            // Store the verified email for login form
            setLastUsedEmail(email);
            setRememberMe(true); // Remember this user since they verified their email
            logger.debug('Saved email for future login:', email);
          }
          
          // For Supabase email verification
          if (urlType === 'signup' || urlType === 'verification') {
            logger.debug('Attempting email verification with token');
            
            try {
              // Attempt to verify the token and authenticate the user
              const { data, error } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'signup'
              });
              
              setDebugInfo(prev => ({ ...prev, verifyResult: { data, error } }));
              
              if (error) {
                logger.error('Error verifying email:', error);
              } else {
                logger.info('Email verified successfully!');
                // Initialize auth state with new session
                await initialize();
              }
              
              // Redirect to verification success page regardless of result
              window.location.replace('/verification-success');
              return;
            } catch (verifyError) {
              logger.error('Error in verification process:', verifyError);
              setDebugInfo(prev => ({ ...prev, verifyError }));
              // Continue to fallback approach
            }
          }
          
          // If we're still here, try a fallback approach
          try {
            // Try plain token exchange
            const { error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: urlType === 'recovery' ? 'recovery' : 'signup'
            });
            
            if (error) {
              logger.error('Fallback verification failed:', error);
            } else {
              logger.info('Fallback verification succeeded');
              await initialize();
            }
            
            // Redirect to verification success page
            window.location.replace('/verification-success');
            return;
          } catch (verifyError) {
            logger.error('Error in fallback verification:', verifyError);
            window.location.replace('/verification-success');
            return;
          }
        }
        
        // If we reach here, no valid auth parameters were found
        logger.warn('No authentication parameters found in URL');
        setError('No authentication parameters found');
        
        // Redirect to home after a delay
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete authentication';
        logger.error('Error during authentication callback', err);
        setError(errorMessage);
        
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