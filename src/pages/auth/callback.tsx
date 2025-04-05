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
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');
        const email = url.searchParams.get('email');
        const code = url.searchParams.get('code');
        
        // Log URL information for debugging
        console.log('AUTH CALLBACK PARAMETERS', { 
          fullUrl: window.location.href,
          token: token ? `${token.substring(0, 8)}...` : null,
          type, 
          email,
          hasCode: !!code,
          timestamp: new Date().toISOString()
        });
        
        logger.debug('AuthCallback URL info:', { 
          path: url.pathname,
          token: token ? `${token.substring(0, 8)}...` : null,
          type, 
          email,
          hasCode: !!code
        });
        
        setDebugInfo({
          componentLoaded: new Date().toISOString(),
          handlerStarted: new Date().toISOString(),
          currentUrl: window.location.href,
          token: token ? 'present' : 'missing',
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
        
        // Handle verification token
        if (token) {
          logger.info('Found token in URL, attempting verification');
          console.log('VERIFICATION TOKEN FOUND, ATTEMPTING VERIFICATION');
          
          try {
            setMessage('Verifying your email...');
            
            // First, try to sign out to ensure a clean verification
            await supabase.auth.signOut();
            console.log('SIGNED OUT BEFORE VERIFICATION');
            
            // Verify OTP token with explicit handling for signup
            console.log('CALLING SUPABASE VERIFY OTP', { 
              type: type === 'recovery' ? 'recovery' : 'signup',
              email: email || 'not provided' 
            });
            
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type === 'recovery' ? 'recovery' : 'signup',
              email: email || undefined
            });
            
            console.log('VERIFY OTP RESULT', { 
              success: !verifyError, 
              hasSession: !!data?.session,
              error: verifyError ? verifyError.message : null,
              user: data?.user ? 'present' : 'missing'
            });
            
            if (verifyError) {
              logger.error('Error verifying email:', verifyError);
              setError(`Verification failed: ${verifyError.message}`);
              
              // Redirect to verification page with error
              console.log('REDIRECTING DUE TO VERIFICATION ERROR');
              setTimeout(() => {
                window.location.replace(`/verification-success?verification=failed&error=${encodeURIComponent(verifyError.message)}`);
              }, 1500);
              return;
            }
            
            logger.info('Email verified successfully!');
            console.log('EMAIL VERIFIED SUCCESSFULLY');
            setMessage('Email verified! Setting up your account...');
            
            // If we have a session from verification, update our auth store directly
            if (data?.session && data?.user) {
              logger.info('Session created during verification - user is authenticated');
              console.log('SESSION CREATED DURING VERIFICATION');
              
              // Directly update our auth state
              setUser(data.user);
              setSession(data.session);
              
              // Store the email in preferences if provided
              if (email) {
                setLastUsedEmail(email);
                setRememberMe(true);
                logger.info('Stored verified email in preferences');
                console.log('STORED EMAIL IN PREFERENCES', { email });
              }
              
              // Double-check the session to confirm it's valid
              const { data: sessionCheck } = await supabase.auth.getSession();
              if (sessionCheck?.session) {
                console.log('SESSION CONFIRMED VALID');
              } else {
                console.log('SESSION NOT CONFIRMED - FALLING BACK');
                // Try to set the session explicitly as a fallback
                try {
                  await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                  });
                  console.log('MANUALLY SET SESSION');
                } catch (sessionError) {
                  console.error('FAILED TO MANUALLY SET SESSION', sessionError);
                }
              }
              
              // Redirect to verification success page
              console.log('REDIRECTING TO VERIFICATION SUCCESS');
              window.location.replace('/verification-success?verification=success');
              return;
            } else if (data?.user) {
              // We have a user but no session - try to establish one
              console.log('USER BUT NO SESSION - TRYING TO ESTABLISH SESSION');
              
              // Try setting the user in our store
              setUser(data.user);
              
              // Redirect to verification success with flag to prompt login
              window.location.replace('/verification-success?verification=success&needsLogin=true&email=' + encodeURIComponent(email || ''));
              return;
            }
            
            // If email is present but no session, redirect to the verification success page
            // and let it handle the rest of the flow
            if (email) {
              console.log('NO SESSION YET BUT EMAIL AVAILABLE');
              window.location.replace('/verification-success?verification=success&needsLogin=true&email=' + encodeURIComponent(email));
              return;
            }
            
            // Fallback - redirect to verification success page
            window.location.replace('/verification-success?verification=pending');
            return;
          } catch (err) {
            logger.error('Error processing verification:', err);
            console.error('VERIFICATION PROCESSING ERROR', err);
            setError('Verification failed. Please try again.');
            
            // Redirect to verification page with error
            setTimeout(() => {
              window.location.replace('/verification-success?verification=failed&error=processing_error');
            }, 1500);
            return;
          }
        }
        
        // Handle code exchange (OAuth and magic link flows)
        if (code) {
          logger.info('Found code in URL, exchanging for session');
          console.log('CODE EXCHANGE FLOW DETECTED', { hasCode: true });
          
          try {
            setMessage('Completing authentication...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              logger.error('Error exchanging code for session:', error);
              setError(`Authentication failed: ${error.message}`);
              
              // Redirect to home with error
              setTimeout(() => {
                window.location.replace(`/?auth=failed&error=${encodeURIComponent(error.message)}`);
              }, 1500);
            } else if (data?.session) {
              logger.info('Successfully exchanged code for session');
              console.log('CODE EXCHANGE SUCCESSFUL', { hasSession: true });
              
              // Update auth store
              setSession(data.session);
              if (data.user) {
                setUser(data.user);
              }
              
              // Redirect to home page
              window.location.replace('/');
              return;
            } else {
              logger.warn('Code exchange succeeded but no session returned');
              console.log('CODE EXCHANGE NO SESSION', { success: true, hasSession: false });
              window.location.replace('/?auth=partial');
            }
          } catch (err) {
            logger.error('Error exchanging code:', err);
            console.error('CODE EXCHANGE ERROR', err);
            setError('Failed to complete authentication');
            
            // Redirect to home with error
            setTimeout(() => {
              window.location.replace('/?auth=failed&error=processing_error');
            }, 1500);
          }
        }
        
        // Handle hash fragments (sometimes used by Supabase)
        const hashFragment = window.location.hash.substring(1);
        if (hashFragment && (hashFragment.includes('access_token=') || hashFragment.includes('type='))) {
          logger.info('Found hash fragment, processing');
          console.log('HASH FRAGMENT DETECTED', { hasHash: true });
          
          // Extract hash parameters
          const hashParams = new URLSearchParams(hashFragment);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const hashEmail = hashParams.get('email');
          
          if (hashEmail) {
            setLastUsedEmail(hashEmail);
            setRememberMe(true);
          }
          
          if (accessToken) {
            try {
              setMessage('Setting up your session...');
              // Set session from tokens
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              });
              
              if (error) {
                logger.error('Error setting session from tokens:', error);
                setError(`Authentication failed: ${error.message}`);
                
                // Redirect to home with error
                setTimeout(() => {
                  window.location.replace(`/?auth=failed&error=${encodeURIComponent(error.message)}`);
                }, 1500);
              } else if (data?.session) {
                logger.info('Successfully set session from tokens');
                console.log('SET SESSION FROM HASH SUCCESS', { hasSession: true });
                
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
                
                // Redirect to home page
                window.location.replace('/');
                return;
              } else {
                logger.warn('Set session succeeded but no session data returned');
                window.location.replace('/?auth=partial');
              }
            } catch (err) {
              logger.error('Error processing tokens:', err);
              setError('Failed to authenticate with provided tokens');
              
              // Redirect to home with error
              setTimeout(() => {
                window.location.replace('/?auth=failed&error=token_processing_error');
              }, 1500);
            }
          }
        }
        
        // If we get here, we didn't recognize the auth parameters
        if (!error) {
          setError('No valid authentication parameters found');
          logger.warn('No valid auth parameters found in URL');
          console.log('NO VALID AUTH PARAMETERS FOUND');
        }
        
        // Redirect to home page after delay
        setTimeout(() => {
          window.location.replace('/?auth=unknown');
        }, 2000);
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
        
        {process.env.NODE_ENV === 'development' && (
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
      
      {process.env.NODE_ENV === 'development' && (
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