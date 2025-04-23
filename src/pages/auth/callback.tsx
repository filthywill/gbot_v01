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
  const { setUser, setSession } = useAuthStore();
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
        const code = url.searchParams.get('code');
        
        // Set debug info early to capture all details
        setDebugInfo({
          componentLoaded: new Date().toISOString(),
          handlerStarted: new Date().toISOString(),
          currentUrl: window.location.href,
          hasCode: !!code,
          searchParams: Object.fromEntries([...url.searchParams.entries()]),
          referrer: document.referrer || 'none'
        });
        
        // Log URL information for debugging
        console.log('AUTH CALLBACK PARAMETERS', { 
          fullUrl: window.location.href,
          hasCode: !!code,
          searchParams: Object.fromEntries([...url.searchParams.entries()]),
          timestamp: new Date().toISOString()
        });

        // FOCUS ON CODE EXCHANGE FIRST - Most important for PKCE flow
        if (code) {
          logger.info('Found code in URL, exchanging for session', { code_length: code.length });
          console.log('CODE EXCHANGE FLOW DETECTED', { hasCode: true, code_length: code.length });
          
          try {
            setMessage('Completing authentication...');
            
            // Clear any prior auth data that might interfere
            const currentSession = await supabase.auth.getSession();
            if (currentSession.data.session) {
              console.log('Found existing session, clearing before code exchange');
              // Only in extreme cases - usually not needed
              // await supabase.auth.signOut({ scope: 'local' });
            }
            
            // PRIMARY EXCHANGE METHOD - Use Supabase's provided method
            console.log('Calling exchangeCodeForSession with code', { code_preview: code.substring(0, 5) + '...' });
            
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              logger.error('Error exchanging code for session:', error);
              setError(`Authentication failed: ${error.message}`);
              
              // Update debug info with error
              setDebugInfo(prev => ({
                ...prev,
                error: error.message,
                errorCode: error.status || 'unknown',
                timestamp: new Date().toISOString(),
                errorDetails: JSON.stringify(error)
              }));
              
              // Redirect to home with error
              setTimeout(() => {
                window.location.replace(`/?auth=failed&error=${encodeURIComponent(error.message)}`);
              }, 1500);
            } else if (data?.session) {
              logger.info('Successfully exchanged code for session');
              console.log('CODE EXCHANGE SUCCESSFUL', { 
                hasSession: true,
                user_id: data.user?.id,
                session_expires_at: data.session?.expires_at
              });
              
              // Update auth store
              setSession(data.session);
              if (data.user) {
                setUser(data.user);
                
                // If we have a verified email, store it
                if (data.user.email) {
                  setLastUsedEmail(data.user.email);
                  setRememberMe(true);
                }
              }
              
              // Update debug info with success
              setDebugInfo(prev => ({
                ...prev,
                success: true,
                user_id: data.user?.id,
                session_expires_at: data.session?.expires_at,
                timestamp: new Date().toISOString()
              }));
              
              // Short delay to ensure state is updated before redirect
              setTimeout(() => {
                // Redirect to home page
                window.location.replace('/');
              }, 1000);
              return;
            } else {
              logger.warn('Code exchange succeeded but no session returned');
              console.log('CODE EXCHANGE NO SESSION', { success: true, hasSession: false });
              
              setError('Authentication succeeded but no session was created');
              
              // Redirect to home with partial auth indication
              setTimeout(() => {
                window.location.replace('/?auth=partial');
              }, 1500);
            }
          } catch (err) {
            // Handle unexpected errors in the code exchange
            logger.error('Error exchanging code:', err);
            console.error('CODE EXCHANGE ERROR', err);
            setError('Failed to complete authentication');
            
            // Update debug info with error
            setDebugInfo(prev => ({
              ...prev,
              error: err instanceof Error ? err.message : 'Unknown error',
              errorStack: err instanceof Error ? err.stack : null,
              timestamp: new Date().toISOString()
            }));
            
            // Redirect to home with error
            setTimeout(() => {
              window.location.replace('/?auth=failed&error=processing_error');
            }, 1500);
          }
        } else {
          // If we get here, we didn't recognize the auth parameters
          setError('No valid authentication parameters found');
          logger.warn('No valid auth parameters found in URL');
          console.log('NO VALID AUTH PARAMETERS FOUND');
          
          // Redirect to home page after delay
          setTimeout(() => {
            window.location.replace('/?auth=unknown');
          }, 2000);
        }
      } catch (err) {
        logger.error('Unexpected error in auth callback:', err);
        console.error('UNEXPECTED AUTH CALLBACK ERROR', err);
        setError('An unexpected error occurred');
        
        // Update debug info with error
        setDebugInfo(prev => ({
          ...prev,
          unexpectedError: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : null,
          timestamp: new Date().toISOString()
        }));
        
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