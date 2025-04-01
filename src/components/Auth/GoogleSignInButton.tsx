import React, { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
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

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  onSuccess, 
  onError,
  className = ""
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isLoading, resetError } = useAuthStore();
  
  // Memoize the callback function to prevent unnecessary recreation
  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      logger.debug('Google response received', response);
      resetError();
      
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) {
        logger.error('Supabase auth error', error);
        onError?.(error);
        return;
      }

      logger.info('Successfully signed in with Google', { userId: data.user?.id });
      onSuccess?.();
      
      // Update auth state in Zustand (this should happen automatically via the listener in useAuthStore, but we're being thorough)
      if (data.user) {
        useAuthStore.setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      logger.error('Error signing in with Google', error);
      onError?.(error);
    }
  }, [resetError, onSuccess, onError]);
  
  useEffect(() => {
    // Load the Google Identity Services SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    let scriptRemoved = false;

    // Handle script loading and button initialization
    script.onload = () => {
      if (scriptRemoved) return;
      
      if (!window.google) {
        logger.error('Google Identity Services failed to load');
        return;
      }

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true, // Important for Chrome's third-party cookie phase-out
      });

      // Render the button if the ref is available
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
        });
        
        logger.debug('Google Sign-In button rendered');
      }
    };

    // Clean up
    return () => {
      scriptRemoved = true;
      const scriptElement = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptElement && document.body.contains(scriptElement)) {
        document.body.removeChild(scriptElement);
      }
    };
  }, [handleCredentialResponse]);

  return (
    <div className={className}>
      <div 
        ref={buttonRef} 
        id="google-signin-button" 
        className="flex justify-center"
        aria-label="Sign in with Google"
      />
      {isLoading && (
        <div className="text-center mt-2 text-sm text-gray-500">
          Loading...
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton; 