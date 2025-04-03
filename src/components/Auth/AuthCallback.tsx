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
  const { initialize } = useAuthStore();
  const { setLastUsedEmail } = usePreferencesStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        logger.info('Processing authentication callback');
        
        // First, check hash fragments for access tokens (OAuth flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          logger.debug('Found access token in hash, setting session');
          
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
        
        if (code) {
          logger.debug('Found auth code in URL, exchanging for session');
          
          // Exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            throw error;
          }
          
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
        
        if (token && type === 'signup') {
          logger.debug('Found email verification token');
          
          if (email) {
            // Store the verified email for login form
            setLastUsedEmail(email);
          }
          
          // Redirect to verification success page
          window.location.replace('/verification-success');
          return;
        }
        
        // If we reach here, no valid auth parameters were found
        logger.warn('No authentication parameters found in URL');
        setError('No authentication parameters found');
        
        // Redirect to home after a delay
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } catch (err) {
        logger.error('Error during authentication callback', err);
        setError(err instanceof Error ? err.message : 'Failed to complete authentication');
        
        // Redirect to home after a delay
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [initialize, setLastUsedEmail]);

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-zinc-900">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <p className="font-bold">Authentication Error</p>
          <p>{error}</p>
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
        <p className="mt-4 text-white">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 