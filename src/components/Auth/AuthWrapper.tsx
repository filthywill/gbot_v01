import React, { useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import logger from '../../lib/logger';
import { supabase } from '../../lib/supabase';

/**
 * Check if an email is verified directly with Supabase
 * This is a workaround for the fact that Supabase doesn't provide a direct way
 * to check if an email is verified through the client SDK
 */
export const checkEmailVerification = async (email: string): Promise<{ verified: boolean, error?: string }> => {
  try {
    logger.debug('Checking email verification status for:', email);
    
    // Try to sign in with a dummy password - if we get "Email not confirmed" error,
    // then the email isn't verified. If we get "Invalid login credentials", then
    // the email exists but the password is wrong (which means the email is verified)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'dummy_verification_check' + Math.random()
    });
    
    if (error) {
      // If we get "Email not confirmed" error, then the email isn't verified
      if (error.message.includes('Email not confirmed')) {
        logger.debug('Email exists but is not verified:', email);
        return { verified: false, error: 'Email not confirmed' };
      }
      
      // If we get "Invalid login credentials", then the email is likely verified
      // because Supabase only checks password AFTER email verification
      if (error.message.includes('Invalid login credentials')) {
        logger.debug('Email is likely verified (got invalid credentials):', email);
        return { verified: true };
      }
      
      // Any other error
      logger.error('Error checking email verification:', error);
      return { verified: false, error: error.message };
    }
    
    // If there's no error, then the sign-in was successful (unlikely with dummy password)
    return { verified: true };
  } catch (err) {
    logger.error('Exception checking email verification status:', err);
    return { verified: false, error: String(err) };
  }
};

/**
 * Force-verify an email address if possible
 * This is a workaround to try verifying an email directly
 */
export const forceVerifyEmail = async (email: string) => {
  try {
    logger.debug('Attempting to force-verify email:', email);
    
    // Get the URL to extract any tokens
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    // If we have a token in the URL params, try to use it
    if (token) {
      logger.info('Found token in URL, attempting to verify with it:', token.substring(0, 5) + '...');
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });
        
        if (error) {
          logger.error('Failed to verify with token:', error);
        } else {
          logger.info('Successfully verified email using token from URL');
          return { success: true, message: 'Email verified with token' };
        }
      } catch (err) {
        logger.error('Exception verifying with token:', err);
      }
    }
    
    // If we have an access token in hash, try to set the session
    if (accessToken) {
      logger.info('Found access token in hash, attempting to set session');
      try {
        const refreshToken = hashParams.get('refresh_token') || '';
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          logger.error('Error setting session from hash:', error);
        } else {
          logger.info('Successfully set session from hash parameters');
          return { success: true, message: 'Session set from hash tokens' };
        }
      } catch (err) {
        logger.error('Exception setting session from hash:', err);
      }
    }
    
    // First, try to get current user - if we're already signed in as this user, we can try to verify directly
    const { data: userData } = await supabase.auth.getUser();
    
    if (userData?.user?.email === email) {
      logger.debug('Already signed in as the email we need to verify. Attempting direct verification.');
      
      // Try to directly update the email_confirmed_at attribute (this likely won't work from client)
      // but we can try a passwordless sign-in which may trigger verification
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false // Don't create a new user, just sign in existing one
        }
      });
      
      if (error) {
        logger.error('Error attempting to force verify email:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, message: 'Verification email sent' };
    } else {
      // We're not signed in as this user, so we need to request a password reset to trigger verification
      logger.debug('Not signed in as target email. Sending a passwordless sign-in to force verification.');
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false // Don't create a new user, just sign in existing one
        }
      });
      
      if (error) {
        logger.error('Error sending passwordless sign-in to force verification:', error);
        return { success: false, error: error.message };
      }
      
      return { 
        success: true, 
        message: 'Password reset email sent. This may trigger verification.' 
      };
    }
  } catch (err) {
    logger.error('Exception during force-verify:', err);
    return { success: false, error: String(err) };
  }
};

/**
 * Try to sign in directly after verification
 * This function will attempt to sign in a user immediately after verification
 */
export const signInDirectlyAfterVerification = async (email: string, password: string) => {
  try {
    logger.info('Attempting to sign in directly after verification:', email);
    
    // First try to directly handle any tokens in the URL
    // This can help bypass verification issues
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    let tokenHandlingResult = null;
    
    // If we have a token in the URL params, try to use it for verification
    if (token) {
      logger.info('Found token in URL, attempting to verify with it before sign-in');
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });
        
        if (!error) {
          logger.info('Successfully verified email using token before sign-in');
          tokenHandlingResult = { success: true, source: 'token' };
        }
      } catch (err) {
        logger.error('Exception verifying with token before sign-in:', err);
      }
    }
    
    // If we have an access token in hash, try to set the session
    if (accessToken && !tokenHandlingResult) {
      logger.info('Found access token in hash, attempting to set session before sign-in');
      try {
        const refreshToken = hashParams.get('refresh_token') || '';
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (!error) {
          logger.info('Successfully set session from hash parameters before sign-in');
          tokenHandlingResult = { success: true, source: 'hash' };
          
          // If we successfully set the session, we might be logged in already
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            // Sync the auth store state
            const authStore = useAuthStore.getState();
            await authStore.initialize();
            
            return { 
              success: true, 
              user: userData.user,
              message: 'Successfully authenticated using token from URL',
              tokenAuth: true
            };
          }
        }
      } catch (err) {
        logger.error('Exception setting session from hash before sign-in:', err);
      }
    }
    
    // Check if the email is verified
    const verificationCheck = await checkEmailVerification(email);
    
    if (!verificationCheck.verified) {
      logger.warn('Email verification check failed. Attempting to force verify before sign-in.');
      
      // Try to force verify the email
      await forceVerifyEmail(email);
      
      // If we couldn't verify, try to sign in anyway - sometimes Supabase's verification check 
      // returns false negatives, and the user might actually be verified
      logger.info('Proceeding with sign-in attempt despite verification uncertainty');
    }
    
    // Try to sign in with the provided credentials
    const { data: initialData, error: initialError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    let data = initialData;
    let error = initialError;
    
    if (error) {
      // If we get "Email not confirmed" error but we thought it was verified,
      // it might be a race condition with the verification process
      if (error.message.includes('Email not confirmed') && verificationCheck.verified) {
        logger.warn('Got "Email not confirmed" even though verification check passed. Possible race condition.');
        
        // Wait a moment and try to force verify again
        await new Promise(resolve => setTimeout(resolve, 1000));
        await forceVerifyEmail(email);
        
        // Try signing in one more time
        logger.info('Retrying sign-in after forced verification attempt');
        const retryResult = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (retryResult.error) {
          logger.error('Retry sign-in failed after verification attempt:', retryResult.error);
          return { success: false, error: retryResult.error.message, retryAttempted: true };
        }
        
        data = retryResult.data;
        logger.info('Retry sign-in succeeded after verification attempt');
      } else {
        logger.error('Error signing in after verification:', error);
        return { success: false, error: error.message };
      }
    }
    
    if (data?.user) {
      // Explicitly update the auth store state to ensure it's synchronized
      try {
        // Get the auth store state and update it directly
        const authStore = useAuthStore.getState();
        
        // Call the store's initialize method to refresh the auth state
        await authStore.initialize();
        
        // Double-check that the user is now authenticated in the store
        if (!authStore.isAuthenticated()) {
          logger.warn('User authenticated with Supabase but not reflected in auth store. Manually updating store.');
          
          // Manually set the authenticated state to ensure it's updated
          await authStore.signInWithEmail(email, password)
            .catch(err => {
              logger.error('Failed to manually update store:', err);
            });
        }
        
        logger.info('Successfully signed in after verification:', email);
        
        // Return success regardless of store update to ensure the UI continues
        return { 
          success: true, 
          user: data.user, 
          session: data.session,
          manualAuthUpdate: !authStore.isAuthenticated()
        };
      } catch (storeError) {
        logger.error('Error updating auth store after successful sign-in:', storeError);
        
        // Return success even if the store update failed,
        // as the Supabase authentication itself was successful
        return { 
          success: true, 
          user: data.user,
          session: data.session,
          storeError: String(storeError)
        };
      }
    }
    
    return { success: false, error: 'Sign in successful but no user data returned' };
  } catch (err) {
    logger.error('Exception during direct sign-in after verification:', err);
    return { success: false, error: String(err) };
  }
};

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { initialize, isLoading } = useAuthStore();
  
  useEffect(() => {
    // Initialize auth state when component mounts
    initialize();
  }, [initialize]);
  
  if (isLoading()) {
    // You could return a loading indicator here if needed
    return null;
  }
  
  return <>{children}</>;
};

export default AuthWrapper; 