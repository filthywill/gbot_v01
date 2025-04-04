import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import logger from '../../lib/logger';
import { AlertCircle } from 'lucide-react';

// This component handles all Supabase auth callbacks
const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

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
            // Verify OTP token
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type === 'recovery' ? 'recovery' : 'signup',
              email: email || undefined
            });
            
            if (error) {
              logger.error('Error verifying email:', error);
              setError(`Verification failed: ${error.message}`);
            } else {
              logger.info('Email verified successfully!');
            }
            
            // Always redirect to success page, even on error
            // This helps if user has already verified (clicked link twice)
            window.location.replace(`/verification-success${email ? `?email=${encodeURIComponent(email)}` : ''}`);
            return;
          } catch (err) {
            logger.error('Error processing verification:', err);
            setError('Verification failed. Please try again.');
            
            // Redirect to success page with error
            window.location.replace(`/verification-success?error=${encodeURIComponent('Verification failed')}`);
            return;
          }
        }
        
        // Handle code exchange (OAuth and magic link flows)
        const code = url.searchParams.get('code');
        if (code) {
          logger.info('Found code in URL, exchanging for session');
          
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              logger.error('Error exchanging code for session:', error);
              setError(`Authentication failed: ${error.message}`);
            } else {
              logger.info('Successfully exchanged code for session');
              
              // Redirect to home page
              window.location.replace('/');
              return;
            }
          } catch (err) {
            logger.error('Error exchanging code:', err);
            setError('Failed to complete authentication');
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
              // Set session from tokens
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              });
              
              if (error) {
                logger.error('Error setting session from tokens:', error);
                setError(`Authentication failed: ${error.message}`);
              } else {
                logger.info('Successfully set session from tokens');
                
                // Redirect to home page
                window.location.replace('/');
                return;
              }
            } catch (err) {
              logger.error('Error processing tokens:', err);
              setError('Failed to authenticate with provided tokens');
            }
          }
        }
        
        // If we get here, we didn't recognize the auth parameters
        if (!error) {
          setError('No valid authentication parameters found');
        }
        
        // Redirect to home page after delay
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } catch (err) {
        logger.error('Unexpected error in auth callback:', err);
        setError('An unexpected error occurred');
        
        // Redirect to home page after delay
        setTimeout(() => {
          window.location.replace('/');
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
        <h1 className="text-xl font-bold text-center mb-4">Verification</h1>
        
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-center">Processing verification...</p>
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