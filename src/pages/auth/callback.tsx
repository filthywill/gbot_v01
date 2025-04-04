import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import logger from '../../lib/logger';
import { AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';

// This component handles all Supabase auth callbacks
const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string>('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        logger.info('AuthCallback: Processing verification');
        
        // Get URL parameters
        const url = new URL(window.location.href);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');
        const email = url.searchParams.get('email');
        
        // Log URL information for debugging
        logger.debug('AuthCallback URL info:', { 
          path: url.pathname,
          token: token ? `${token.substring(0, 8)}...` : null,
          type, 
          email
        });
        
        setDebugInfo({
          currentUrl: window.location.href,
          token: token ? 'present' : 'missing',
          type,
          email
        });
        
        // Handle verification token
        if (token) {
          logger.info('Found token in URL, attempting verification');
          
          try {
            setMessage('Verifying your email...');
            
            // Verify OTP token
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type === 'recovery' ? 'recovery' : 'signup',
              email: email || undefined
            });
            
            if (verifyError) {
              logger.error('Error verifying email:', verifyError);
              setError(`Verification failed: ${verifyError.message}`);
              
              // Redirect to home with error
              setTimeout(() => {
                window.location.replace(`/?verification=failed&error=${encodeURIComponent(verifyError.message)}`);
              }, 2000);
              return;
            }
            
            logger.info('Email verified successfully!');
            setMessage('Email verified! Signing you in...');
            
            // If we have a session from verification, we're already signed in
            if (data?.session) {
              logger.info('Session created during verification - user is authenticated');
              
              // Store the email in preferences if provided
              if (email) {
                const { setLastUsedEmail, setRememberMe } = usePreferencesStore.getState();
                setLastUsedEmail(email);
                setRememberMe(true);
                logger.info('Stored verified email in preferences');
              }
              
              // Redirect to home with success
              window.location.replace('/?verification=success');
              return;
            }
            
            // If no session yet, but we have the email, try to establish session
            if (email) {
              // Store the email in preferences for later use
              const { setLastUsedEmail, setRememberMe } = usePreferencesStore.getState();
              setLastUsedEmail(email);
              setRememberMe(true);
              
              // Redirect to home with pending status - user will need to sign in
              // but the app will know verification was successful
              window.location.replace('/?verification=success&needsLogin=true');
              return;
            }
            
            // Fallback - redirect to home with generic success
            window.location.replace('/?verification=success');
            return;
          } catch (err) {
            logger.error('Error processing verification:', err);
            setError('Verification failed. Please try again.');
            
            // Redirect to home with error
            setTimeout(() => {
              window.location.replace('/?verification=failed&error=processing_error');
            }, 2000);
            return;
          }
        }
        
        // Handle code exchange (OAuth and magic link flows)
        const code = url.searchParams.get('code');
        if (code) {
          logger.info('Found code in URL, exchanging for session');
          
          try {
            setMessage('Completing authentication...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              logger.error('Error exchanging code for session:', error);
              setError(`Authentication failed: ${error.message}`);
              
              // Redirect to home with error
              setTimeout(() => {
                window.location.replace(`/?auth=failed&error=${encodeURIComponent(error.message)}`);
              }, 2000);
            } else {
              logger.info('Successfully exchanged code for session');
              
              // Redirect to home page
              window.location.replace('/');
              return;
            }
          } catch (err) {
            logger.error('Error exchanging code:', err);
            setError('Failed to complete authentication');
            
            // Redirect to home with error
            setTimeout(() => {
              window.location.replace('/?auth=failed&error=processing_error');
            }, 2000);
          }
        }
        
        // Handle hash fragments (sometimes used by Supabase)
        const hashFragment = window.location.hash.substring(1);
        if (hashFragment && (hashFragment.includes('access_token=') || hashFragment.includes('type='))) {
          logger.info('Found hash fragment, processing');
          
          // Extract hash parameters
          const hashParams = new URLSearchParams(hashFragment);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            try {
              setMessage('Setting up your session...');
              // Set session from tokens
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              });
              
              if (error) {
                logger.error('Error setting session from tokens:', error);
                setError(`Authentication failed: ${error.message}`);
                
                // Redirect to home with error
                setTimeout(() => {
                  window.location.replace(`/?auth=failed&error=${encodeURIComponent(error.message)}`);
                }, 2000);
              } else {
                logger.info('Successfully set session from tokens');
                
                // Redirect to home page
                window.location.replace('/');
                return;
              }
            } catch (err) {
              logger.error('Error processing tokens:', err);
              setError('Failed to authenticate with provided tokens');
              
              // Redirect to home with error
              setTimeout(() => {
                window.location.replace('/?auth=failed&error=token_processing_error');
              }, 2000);
            }
          }
        }
        
        // If we get here, we didn't recognize the auth parameters
        if (!error) {
          setError('No valid authentication parameters found');
        }
        
        // Redirect to home page after delay
        setTimeout(() => {
          window.location.replace('/?auth=unknown');
        }, 3000);
      } catch (err) {
        logger.error('Unexpected error in auth callback:', err);
        setError('An unexpected error occurred');
        
        // Redirect to home page after delay
        setTimeout(() => {
          window.location.replace('/?auth=error');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };
    
    // Execute the callback handler
    handleCallback();
  }, []);
  
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <h1 className="text-xl font-bold text-center mb-4">Authentication</h1>
        
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-center">{message}</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        
        <p className="text-center mt-4">
          Redirecting you shortly...
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