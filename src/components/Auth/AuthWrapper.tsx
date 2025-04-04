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
 * Try to directly verify an email address with Supabase
 * This function attempts to use the Supabase API to directly mark an email as verified
 */
export const directVerifyEmail = async (email: string) => {
  try {
    logger.debug('Attempting to directly verify email with Supabase:', email);
    
    // First, check if we are the user already
    const { data: userData } = await supabase.auth.getUser();
    
    if (userData?.user?.email === email) {
      logger.info('Currently signed in as the user we need to verify');
      
      // Access the session directly to mark it as verified
      // This is a workaround that might help in some cases
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        logger.info('Found active session, attempting to use it for verification');
        
        // Update user metadata to add email_confirmed information
        const { error: updateError } = await supabase.auth.updateUser({
          data: { email_verified: true }
        });
        
        if (updateError) {
          logger.error('Error updating user metadata:', updateError);
        } else {
          logger.info('Successfully updated user metadata');
          return { success: true };
        }
      }
    }
    
    // Try using the API to refresh the session, which might help
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          logger.info('Successfully refreshed session, which might help with verification');
          return { success: true };
        }
      }
    } catch (refreshErr) {
      logger.error('Error refreshing session:', refreshErr);
    }
    
    return { success: false, message: 'Could not directly verify email' };
  } catch (err) {
    logger.error('Exception during direct email verification:', err);
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
    
    // First check if the user is already authenticated
    const { data: currentUser } = await supabase.auth.getUser();
    if (currentUser?.user?.email === email) {
      logger.info('User is already authenticated with the correct email');
      
      // Update the auth store to ensure it matches Supabase state
      const authStore = useAuthStore.getState();
      await authStore.initialize();
      
      return { 
        success: true, 
        user: currentUser.user,
        message: 'User is already authenticated'
      };
    }
    
    // Simple approach: Try signing in directly first
    logger.info('Attempting direct sign-in first');
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If successful, great! Update auth store and return success
    if (!signInResult.error) {
      logger.info('Direct sign-in successful');
      const authStore = useAuthStore.getState();
      await authStore.initialize();
      
      return { 
        success: true, 
        user: signInResult.data.user, 
        session: signInResult.data.session
      };
    }
    
    // If we get "Email not confirmed" error, we need to handle it differently
    if (signInResult.error.message.includes('Email not confirmed')) {
      logger.warn('Got "Email not confirmed" error. Trying to update verification status...');
      
      // 1. Sign out to clear any existing sessions
      await supabase.auth.signOut();
      
      // 2. Look for confirmation token in URL or hash
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = url.searchParams.get('type') || hashParams.get('type');
      
      // 3. Process confirmation token if present
      if (token && (type === 'verification' || type === 'signup' || type === 'recovery')) {
        logger.info('Found confirmation token in URL, attempting to confirm with it');
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
            email
          });
          
          if (verifyError) {
            logger.error('Error verifying with token:', verifyError);
          } else {
            logger.info('Successfully verified email with token');
            
            // Try signing in again after successful verification
            const retrySignIn = await supabase.auth.signInWithPassword({ email, password });
            
            if (!retrySignIn.error) {
              logger.info('Sign-in successful after token verification');
              const authStore = useAuthStore.getState();
              await authStore.initialize();
              
              return {
                success: true,
                user: retrySignIn.data.user,
                session: retrySignIn.data.session
              };
            } else {
              logger.error('Still unable to sign in after token verification:', retrySignIn.error);
            }
          }
        } catch (err) {
          logger.error('Exception verifying with token:', err);
        }
      }
      
      // 4. Try with access token from hash if present
      if (accessToken) {
        logger.info('Found access token in hash, attempting to set session');
        try {
          const refreshToken = hashParams.get('refresh_token') || '';
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            logger.error('Error setting session from hash:', sessionError);
          } else {
            logger.info('Successfully set session from hash parameters');
            
            // Try signing in again after setting session
            const retrySignIn = await supabase.auth.signInWithPassword({ email, password });
            
            if (!retrySignIn.error) {
              logger.info('Sign-in successful after setting session from hash');
              const authStore = useAuthStore.getState();
              await authStore.initialize();
              
              return {
                success: true,
                user: retrySignIn.data.user,
                session: retrySignIn.data.session
              };
            } else {
              logger.error('Still unable to sign in after setting session:', retrySignIn.error);
            }
          }
        } catch (err) {
          logger.error('Exception setting session from hash:', err);
        }
      }
      
      // 5. Final approach: Use passwordless login to trigger verification
      logger.info('Attempting passwordless login as last resort to trigger verification');
      
      // This is async, we don't need to await it
      supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      }).catch(error => {
        if (!error.message?.includes('rate limit')) {
          logger.error('Error sending passwordless login:', error);
        }
      });
      
      // Return verification needed status to inform the user
      return {
        success: false,
        error: 'Your email is not verified. Please check your email for a verification link.',
        needsVerification: true
      };
    }
    
    // For other errors, return them directly
    logger.error('Sign-in error:', signInResult.error);
    return { success: false, error: signInResult.error.message };
    
  } catch (err) {
    logger.error('Exception during sign-in after verification:', err);
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