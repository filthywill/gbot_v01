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
        
        // Detect and log double slash issues
        if (fullUrl.includes('//auth')) {
          logger.warn('Detected double slash in URL that may cause routing issues');
        }
        
        setDebugInfo({ ...debugInfo, fullUrl });
        
        // Check for code parameter (OAuth and some email flows)
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const queryParams: Record<string, string> = {};
        
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
        
        setDebugInfo({ ...debugInfo, queryParams });
        logger.debug('URL query parameters:', queryParams);
        
        if (code) {
          logger.debug('Found auth code in URL, exchanging for session:', code);
          setMessage('Authenticating your account...');
          setDebugInfo({ ...debugInfo, flowType: 'code-exchange' });
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            logger.error('Error exchanging code for session:', error);
            setDebugInfo({ ...debugInfo, exchangeError: error });
            throw error;
          }
          
          logger.info('Successfully exchanged code for session');
          
          // Initialize auth state
          await initialize();
          
          // Redirect to home or success page
          window.location.replace('/');
          return;
        }
        
        // Check for email verification tokens
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');
        const email = url.searchParams.get('email');
        
        if (token) {
          logger.debug('Found token in URL, type:', type || 'unknown');
          setMessage('Processing your verification...');
          setDebugInfo({ ...debugInfo, flowType: 'token-verification', tokenType: type });
          
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
            
            setDebugInfo({ ...debugInfo, verifyResult: { data, error } });
            
            if (error) {
              logger.error('Error verifying email:', error);
            } else {
              logger.info('Email verified successfully!');
              // Initialize auth state with new session
              await initialize();
            }
            
            // Redirect to verification success page
            window.location.replace('/verification-success');
            return;
          }
          
          // If we're still here, try a fallback approach
          try {
            // Try plain token exchange
            const { error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type === 'recovery' ? 'recovery' : 'signup'
            });
            
            if (error) {
              logger.error('Fallback verification failed:', error);
            } else {
              logger.info('Fallback verification succeeded');
              await initialize();
            }
            
            // Redirect to verification success regardless
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
  }, [initialize, setLastUsedEmail, setRememberMe, debugInfo]);

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