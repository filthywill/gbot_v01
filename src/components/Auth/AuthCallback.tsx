import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import logger from '../../lib/logger';

// This component is only needed for redirect-based authentication flows,
// not for the direct token approach with Google Sign-In Button
const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Get the auth code from the URL
    const handleAuthCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      
      if (!code) {
        const errorMsg = 'No authentication code found in URL';
        logger.error(errorMsg);
        setError(errorMsg);
        return;
      }

      try {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          logger.error('Error exchanging code for session', error);
          setError(error.message);
          return;
        }

        // Refresh our auth state
        await initialize();
        logger.info('Authentication callback completed successfully');
        
        // Redirect to homepage or original URL
        const redirectTo = url.searchParams.get('next') || '/';
        window.location.replace(redirectTo);
      } catch (err) {
        logger.error('Error during authentication callback', err);
        setError('Failed to complete authentication');
      }
    };

    handleAuthCallback();
  }, [initialize]);

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Authentication Error</p>
          <p>{error}</p>
        </div>
        <a href="/" className="mt-4 text-blue-600 hover:underline">
          Return to Home
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-700">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 