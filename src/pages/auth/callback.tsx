import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import logger from '../../lib/logger';
import { AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';

// This component handles all Supabase auth callbacks
const AuthCallback: React.FC = () => {
  // Immediate logging to confirm component is loaded and rendered
  console.log('AUTH CALLBACK LOADED', { timestamp: new Date().toISOString(), location: window.location.href });
  logger.info('AUTH CALLBACK COMPONENT LOADED', { timestamp: new Date().toISOString(), url: window.location.href });
  
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({
    componentLoaded: new Date().toISOString(),
    initialUrl: window.location.href
  });
  const [message, setMessage] = useState<string>('Processing authentication...');
  const { setUser, setSession, initialize } = useAuthStore();
  const { setLastUsedEmail, setRememberMe } = usePreferencesStore();

  useEffect(() => {
    // Log immediately when the effect runs
    console.log('AUTH CALLBACK EFFECT RUNNING', { timestamp: new Date().toISOString() });
    logger.info('AUTH CALLBACK EFFECT TRIGGERED', { timestamp: new Date().toISOString() });
    
    const handleCallback = async () => {
      console.log('HANDLE CALLBACK STARTED', { timestamp: new Date().toISOString() });
      
      try {
        logger.info('AuthCallback: Processing verification');
        
        // Get URL parameters
        const url = new URL(window.location.href);
        const token_hash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type');
        const email = url.searchParams.get('email');
        const code = url.searchParams.get('code');
        const redirect_to = url.searchParams.get('redirect_to') || '/';
        
        // Log URL information for debugging
        console.log('AUTH CALLBACK PARAMETERS', { 
          fullUrl: window.location.href,
          token: token_hash ? `${token_hash.substring(0, 8)}...` : null,
          type, 
          email,
          hasCode: !!code,
          timestamp: new Date().toISOString()
        });
        
        logger.debug('AuthCallback URL info:', { 
          path: url.pathname,
          token: token_hash ? `${token_hash.substring(0, 8)}...` : null,
          type, 
          email,
          hasCode: !!code
        });
        
        setDebugInfo({
          componentLoaded: new Date().toISOString(),
          handlerStarted: new Date().toISOString(),
          currentUrl: window.location.href,
          token: token_hash ? 'present' : 'missing',
          type,
          email,
          hasCode: !!code
        });
        
        // Store the email for future use if provided
        if (email) {
          setLastUsedEmail(email);
          setRememberMe(true);
          console.log('STORED EMAIL IN PREFERENCES', { email });
        }
        
        // Handle PKCE magic-link token
        if (token_hash && type) {
          try {
            setMessage('Verifying your email...');
            const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
            if (error) throw error;
            // Persist session in storage by opting into rememberMe
            setRememberMe(true);
            // Update store
            if (data.session) setSession(data.session);
            if (data.user)    setUser(data.user);
            setIsProcessing(false);
            setMessage('Authentication successful! You should be logged in.');
            return;
          } catch (err) {
            console.error('Error verifying OTP:', err);
            setError(err instanceof Error ? err.message : 'OTP verification failed');
            setIsProcessing(false);
            return;
          }
        }
        // Handle OAuth code exchange
        if (code) {
          try {
            setMessage('Exchanging OAuth code...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
            // Session is now set in store
            setIsProcessing(false);
            setMessage('Authentication successful! You should be logged in.');
            return;
          } catch (err) {
            console.error('Error exchanging code:', err);
            setError(err instanceof Error ? err.message : 'Code exchange failed');
            setIsProcessing(false);
            return;
          }
        }
        // Handle hash fragments (implicit flow)
        if (window.location.hash) {
          try {
            setMessage('Processing session from URL...');
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token) {
              const { data, error } = await supabase.auth.setSession({ access_token, refresh_token: refresh_token ?? '' });
              if (error) throw error;
              // Session is now set in store
              setIsProcessing(false);
              setMessage('Authentication successful! You should be logged in.');
              return;
            }
          } catch (err) {
            console.error('Error processing hash fragment:', err);
            setError(err instanceof Error ? err.message : 'Fragment processing failed');
            setIsProcessing(false);
            return;
          }
        }
        
        // Remove fallback redirect so we stay on this page and can inspect store state
        // if (!error) { setError('No valid authentication parameters found'); /* ... */ }
      } catch (err) {
        logger.error('Unexpected error in auth callback:', err);
        console.error('UNEXPECTED AUTH CALLBACK ERROR', err);
        setError('An unexpected error occurred');
        
        // Redirect to home page after delay
        setTimeout(() => {
          window.location.replace('/?auth=error');
        }, 2000);
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleCallback();
  }, []);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Verifying your account</h2>
        <p className="mb-4">{message}</p>
        <p className="text-sm text-gray-400">You'll be redirected automatically when complete.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full mb-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="font-bold">Verification Error</p>
          </div>
          <p>{error}</p>
        </div>
        
        <p className="text-white mb-4">You'll be redirected in a moment...</p>
        
        <a href="/" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
          Return to Home
        </a>
        
        {import.meta.env.VITE_APP_ENV !== 'production' && (
          <div className="mt-8 max-w-md w-full bg-gray-800 p-4 rounded">
            <p className="text-gray-300 mb-2 text-sm">Debug Information:</p>
            <pre className="text-xs bg-gray-900 p-2 rounded text-gray-300 overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
      <h2 className="text-xl font-semibold mb-2">Processing authentication</h2>
      <p className="mb-4">{message}</p>
      <p className="text-sm text-gray-400">You'll be redirected automatically when complete.</p>
      
      {import.meta.env.VITE_APP_ENV !== 'production' && (
        <div className="mt-8 max-w-md w-full bg-gray-800 p-4 rounded">
          <p className="text-gray-300 mb-2 text-sm">Debug Information:</p>
          <pre className="text-xs bg-gray-900 p-2 rounded text-gray-300 overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthCallback; 