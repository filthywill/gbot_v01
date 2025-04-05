import React, { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import useGoogleAuthStore from '../../store/useGoogleAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';
import logger from '../../lib/logger';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

// Define fixed dimensions for the button container to prevent layout shifts
const BUTTON_CONTAINER_STYLES = {
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative' as const,
  overflow: 'hidden',
  borderRadius: '4px',
  margin: '0 auto',
  width: '100%'
};

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  onSuccess, 
  onError,
  className = ""
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isLoading, resetError } = useAuthStore();
  const { 
    isSDKLoaded, 
    isSDKLoading, 
    sdkError: globalSdkError, 
    initializeSDK, 
    resetError: resetSdkError 
  } = useGoogleAuthStore();
  const { setRememberMe, setLastUsedEmail } = usePreferencesStore();
  
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Track if the component is mounted
  const isMountedRef = useRef<boolean>(true);
  
  // For development mode
  const isDevelopment = import.meta.env.DEV;
  const isSecureContext = window.isSecureContext;
  const protocol = window.location.protocol;
  const isHttps = protocol === 'https:';
  const canUseRealGoogleButton = isSecureContext;

  logger.debug(`GoogleSignInButton rendering - isSDKLoaded: ${isSDKLoaded}, isSDKLoading: ${isSDKLoading}, canUseRealGoogleButton: ${canUseRealGoogleButton}, clientID exists: ${!!import.meta.env.VITE_GOOGLE_CLIENT_ID}, isDevelopment: ${isDevelopment}, isSecureContext: ${isSecureContext}, protocol: ${protocol}`);
  
  // Cleanup function for unmounting
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Handle Google sign-in response
  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      logger.debug('Google response received', response);
      resetError();
      resetSdkError();
      setLocalError(null);
      
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Google sign-in should always remember the user
      setRememberMe(true);

      // Log before Supabase auth attempt
      logger.debug('Attempting to sign in with Google via Supabase');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) {
        logger.error('Supabase auth error', error);
        setLocalError('Authentication failed. Please try again.');
        onError?.(error);
        return;
      }

      logger.info('Successfully signed in with Google', { userId: data.user?.id });
      
      // Store email for future sign-ins
      if (data.user?.email) {
        setLastUsedEmail(data.user.email);
      }
      
      // Update auth store to reflect new state immediately
      useAuthStore.getState().initialize();
      
      // CRITICAL: Ensure success callback is called synchronously to close the modal
      logger.debug('Calling success callback immediately after Google sign-in');
      onSuccess?.();

      // For debugging in case the callback doesn't work
      if (!onSuccess) {
        logger.warn('No success callback provided for Google sign-in');
      }
    } catch (error) {
      logger.error('Error signing in with Google', error);
      setLocalError(`Sign-in error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onError?.(error);
    }
  }, [resetError, onSuccess, onError, resetSdkError, setRememberMe, setLastUsedEmail]);
  
  // Initialize Google Sign-In with the loaded SDK
  const initializeGoogleSignIn = useCallback(() => {
    if (!window.google?.accounts?.id) {
      logger.error('Cannot initialize Google Sign-In: SDK not loaded properly');
      setLocalError('Google authentication unavailable');
      return;
    }
    
    try {
      logger.debug('Initializing Google Sign-In with client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true, // For Chrome's third-party cookie phase-out
      });
      
      // Render the button if the ref is available
      renderButton();
    } catch (err) {
      logger.error('Error initializing Google Sign-In:', err);
      setLocalError(`Failed to initialize Google Sign-In: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [handleCredentialResponse]);
  
  // Render the Google Sign-In button
  const renderButton = useCallback(() => {
    if (!buttonRef.current || !window.google?.accounts?.id) {
      logger.debug('Cannot render button: buttonRef.current exists: ' + !!buttonRef.current + ', window.google?.accounts?.id exists: ' + !!window.google?.accounts?.id);
      return;
    }
    
    try {
      logger.debug('Rendering Google Sign-In button');
      
      // Ensure the container is visible and has a width before rendering
      const containerWidth = buttonRef.current.offsetWidth || 
                            buttonRef.current.parentElement?.offsetWidth || 
                            300; // Fallback width
      
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
        width: containerWidth,
      });
      logger.debug('Google Sign-In button rendered successfully');
    } catch (err) {
      logger.error('Error rendering Google Sign-In button:', err);
      setLocalError(`Failed to display Sign-In button: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);
  
  // Initialize the Google SDK on mount
  useEffect(() => {
    // Start SDK initialization if needed
    logger.debug('Initializing SDK from GoogleSignInButton component');
    initializeSDK();
  }, [initializeSDK]);
  
  // When SDK loads or component mounts, initialize Google Sign-In
  useEffect(() => {
    if (isSDKLoaded && canUseRealGoogleButton) {
      logger.debug('SDK loaded and canUseRealGoogleButton is true, initializing Google Sign-In');
      initializeGoogleSignIn();
    } else {
      logger.debug(`Not initializing Google Sign-In: isSDKLoaded=${isSDKLoaded}, canUseRealGoogleButton=${canUseRealGoogleButton}`);
    }
  }, [isSDKLoaded, canUseRealGoogleButton, initializeGoogleSignIn]);

  // Try to reload if button ref changes
  useEffect(() => {
    if (isSDKLoaded && buttonRef.current && canUseRealGoogleButton) {
      logger.debug('Button ref changed, re-rendering button');
      renderButton();
    }
  }, [renderButton, isSDKLoaded, buttonRef, canUseRealGoogleButton]);

  // Calculate the final error state from either global or local errors
  const error = localError || globalSdkError;
  
  // Handle retry of SDK loading
  const handleRetry = () => {
    setLocalError(null);
    resetSdkError();
    initializeSDK();
  };

  // Development mode test button for non-HTTPS environments
  const renderDevModeButton = () => (
    <button
      onClick={() => {
        logger.info('Development mode Google Sign-In button clicked');
        
        // Update the auth store for testing
        useAuthStore.setState((state) => ({
          ...state,
          status: 'AUTHENTICATED',
          user: {
            id: 'dev-user-id',
            email: 'dev-user@example.com',
            // Add other required user properties
          } as any,
          session: { expires_at: Date.now() + 3600 } as any,
        }));
        
        // Trigger the success callback
        onSuccess?.();
      }}
      className="w-full py-2 px-4 flex justify-center items-center bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <span className="mr-2">🧪</span>
      <span>Sign in with Google (Development Mode)</span>
    </button>
  );

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 text-sm text-red-600 p-2 border border-red-200 rounded bg-red-50" role="alert">
          <p>{error}</p>
          <button 
            onClick={handleRetry}
            className="mt-2 text-indigo-600 hover:text-indigo-700 hover:underline text-xs"
          >
            Retry
          </button>
        </div>
      )}
      
      {isSDKLoading && !error && (
        <div className="w-full h-10 flex items-center justify-center border border-gray-300 rounded-md bg-gray-50">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-500">Loading Google Sign-In...</span>
          </div>
        </div>
      )}
      
      {!isSDKLoading && !error && (
        <>
          {canUseRealGoogleButton ? (
            <div
              ref={buttonRef}
              className="w-full h-10 flex items-center justify-center border border-gray-300 rounded-md bg-white"
            />
          ) : (
            renderDevModeButton()
          )}
        </>
      )}
      
      {import.meta.env.DEV && !canUseRealGoogleButton && !error && (
        <div className="mt-2 text-xs text-amber-700 text-center p-1 bg-amber-50 border border-amber-200 rounded">
          <strong>Development Mode:</strong> HTTPS required for real Google Sign-In
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton; 