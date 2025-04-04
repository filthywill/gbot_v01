import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import logger from '../../lib/logger';
import useAuthStore from '../../store/useAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';
import { AlertCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const { initialize } = useAuthStore();
  const { setLastUsedEmail } = usePreferencesStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        logger.info('Processing auth callback');
        
        // Capture start time for debugging
        const startTime = new Date().toISOString();
        
        // Process URL parameters
        const url = new URL(window.location.href);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');
        const email = url.searchParams.get('email');
        
        // Process hash fragments (Supabase often puts tokens in hash for security)
        const hashFragment = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hashFragment);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        const hashEmail = hashParams.get('email');
        
        // Update debug info
        setDebugInfo({
          startTime,
          urlParams: { 
            token: token ? `${token.substring(0, 8)}...` : null, 
            type, 
            email 
          },
          hashParams: { 
            fragment: hashFragment ? 'present' : 'none',
            accessToken: accessToken ? 'present' : null,
            refreshToken: refreshToken ? 'present' : null,
            type: hashType,
            email: hashEmail
          },
          url: window.location.href,
          path: window.location.pathname
        });
        
        // Save email in preferences if available
        if (email || hashEmail) {
          const emailToUse = email || hashEmail;
          if (emailToUse) {
            logger.info('Found email in callback params:', emailToUse);
            setLastUsedEmail(emailToUse);
          }
        }
        
        // Handle OTP verification via token param (email verification)
        if (token && (type === 'signup' || type === 'verification' || type === 'recovery' || !type)) {
          logger.info('Processing OTP verification with token');
          
          try {
            // Determine the verification type
            const verifyType: 'signup' | 'recovery' = 
              type === 'recovery' ? 'recovery' : 'signup';
            
            // Verify the OTP token
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: verifyType,
              email: email || undefined
            });
            
            // Handle verification result
            if (error) {
              logger.error('Error verifying OTP:', error);
              setError(`Verification failed: ${error.message}`);
            } else {
              logger.info('Successfully verified with token');
              
              // Wait a moment for Supabase to update session
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Reinitialize auth state
              await initialize();
              
              // Redirect to verification success page
              window.location.replace(`/verification-success${email ? `?email=${encodeURIComponent(email)}` : ''}`);
              return;
            }
          } catch (err) {
            logger.error('Error processing token:', err);
            setError('Failed to verify your account. Please try again.');
          }
        }
        
        // Handle session via access token in hash (OAuth flows often use this)
        if (accessToken) {
          logger.info('Processing session from hash tokens');
          
          try {
            // Set the session with the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            // Handle session result
            if (error) {
              logger.error('Error setting session from tokens:', error);
              setError(`Authentication failed: ${error.message}`);
            } else {
              logger.info('Successfully set session from hash tokens');
              
              // Wait a moment for Supabase to update session
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Reinitialize auth state
              await initialize();
              
              // Redirect to verification success page
              const emailParam = hashEmail || email;
              window.location.replace(`/verification-success${emailParam ? `?email=${encodeURIComponent(emailParam)}` : ''}`);
              return;
            }
          } catch (err) {
            logger.error('Error processing hash tokens:', err);
            setError('Failed to authenticate with the provided tokens.');
          }
        }
        
        // Handle regular code exchange (used by Supabase Auth)
        const code = url.searchParams.get('code');
        if (code) {
          logger.info('Processing auth code exchange');
          
          try {
            // Exchange the code for a session
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              logger.error('Error exchanging code for session:', error);
              setError(`Authentication failed: ${error.message}`);
            } else {
              logger.info('Successfully exchanged code for session');
              
              // Wait a moment for Supabase to update session
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Reinitialize auth state
              await initialize();
              
              // Redirect to verification success page
              window.location.replace('/verification-success');
              return;
            }
          } catch (err) {
            logger.error('Error exchanging code:', err);
            setError('Failed to complete authentication.');
          }
        }
        
        // If we get here and haven't redirected, but also haven't set an error
        if (!error && !token && !accessToken && !code) {
          setError('No valid authentication tokens found. Please try the verification link again or request a new one.');
        }
        
        // Redirect to verification-success page with error info
        const emailToRedirect = email || hashEmail;
        const redirectUrl = `/verification-success${emailToRedirect ? `?email=${encodeURIComponent(emailToRedirect)}` : ''}${
          error ? `&error=${encodeURIComponent(error)}` : ''
        }`;
        
        setTimeout(() => {
          window.location.replace(redirectUrl);
        }, 2000);
      } catch (err) {
        logger.error('Error in auth callback:', err);
        setError('An unexpected error occurred during authentication.');
        setIsProcessing(false);
      }
    };
    
    handleCallback();
  }, [initialize, setLastUsedEmail]);
  
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <h1 className="text-xl font-bold text-center mb-4">Authentication</h1>
        
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-center">Processing authentication...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        
        <p className="text-center mt-4">
          Redirecting to verification page...
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-xs font-medium text-gray-500">Debug Information:</p>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 