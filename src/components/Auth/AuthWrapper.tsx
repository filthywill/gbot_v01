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
    
    // First check if the email is verified
    const verificationCheck = await checkEmailVerification(email);
    
    if (!verificationCheck.verified) {
      logger.warn('Cannot sign in directly - email is not verified:', email);
      return { success: false, error: 'Email is not verified' };
    }
    
    // Try to sign in with the provided credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      logger.error('Error signing in after verification:', error);
      return { success: false, error: error.message };
    }
    
    if (data?.user) {
      logger.info('Successfully signed in after verification:', email);
      return { success: true, user: data.user };
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