import { supabase } from '../supabase';
import logger from '../logger';
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';

/**
 * Checks if an email is verified in Supabase
 * 
 * @param email The email address to check
 * @returns Object containing verification status and error if any
 */
export const checkEmailVerification = async (email: string): Promise<{ 
  verified: boolean; 
  error?: string;
  data?: any;
}> => {
  try {
    if (!email) {
      return { verified: false, error: 'No email provided' };
    }
    
    // First, try to get user by email from Supabase's auth admin API
    const { data: userData, error: userError } = await supabase.functions.invoke('get-user-by-email', {
      body: { email }
    });
    
    if (userError) {
      logger.error('Error checking email verification status:', userError);
      return { verified: false, error: userError.message };
    }
    
    if (!userData) {
      return { verified: false, error: 'User not found' };
    }
    
    // Check if email is confirmed
    const isVerified = userData.email_confirmed_at != null;
    
    return { 
      verified: isVerified, 
      data: userData 
    };
  } catch (err) {
    logger.error('Error in checkEmailVerification:', err);
    return { 
      verified: false, 
      error: err instanceof Error ? err.message : 'Unknown error checking verification status' 
    };
  }
};

/**
 * Attempts to force verify an email in Supabase
 * This is a fallback mechanism for cases where normal verification fails
 * 
 * @param email The email to force verify
 * @returns Success status and error if any
 */
export const forceVerifyEmail = async (email: string): Promise<{ 
  success: boolean; 
  error?: string;
  data?: any;
}> => {
  try {
    if (!email) {
      return { success: false, error: 'No email provided' };
    }
    
    // Call Supabase function to verify the email
    const { data, error } = await supabase.functions.invoke('force-verify-email', {
      body: { email }
    });
    
    if (error) {
      logger.error('Error forcing email verification:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Error in forceVerifyEmail:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error during forced verification' 
    };
  }
};

/**
 * Tries to sign in a user directly after verification without going through the full flow
 * 
 * @param email Verified email
 * @param password User password
 * @returns Success status and session if successful
 */
export const signInDirectlyAfterVerification = async (email: string, password: string): Promise<{
  success: boolean;
  session?: any;
  error?: string;
}> => {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }
    
    // Attempt to sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      logger.error('Error signing in after verification:', error);
      return { success: false, error: error.message };
    }
    
    if (!data.session) {
      return { success: false, error: 'No session created' };
    }
    
    return { success: true, session: data.session };
  } catch (err) {
    logger.error('Error in signInDirectlyAfterVerification:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error during sign in' 
    };
  }
};

/**
 * Extracts and processes auth parameters from URL and hash fragments
 * 
 * @returns Extracted auth parameters
 */
export const extractAuthParams = (): {
  token?: string | null;
  code?: string | null;
  type?: string | null;
  email?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
} => {
  // Get parameters from URL
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');
  const code = url.searchParams.get('code');
  const type = url.searchParams.get('type');
  const email = url.searchParams.get('email');
  
  // Get parameters from hash fragment
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  
  return {
    token,
    code,
    type,
    email,
    accessToken,
    refreshToken
  };
};

/**
 * Determines if a URL contains authentication parameters
 * 
 * @returns Whether the URL contains auth parameters
 */
export const hasAuthParams = (): boolean => {
  const url = new URL(window.location.href);
  const hasToken = url.searchParams.has('token');
  const hasCode = url.searchParams.has('code');
  const hasType = url.searchParams.has('type') && 
    ['signup', 'recovery', 'invite'].includes(url.searchParams.get('type') || '');
  
  // Check hash for auth data
  const urlHash = window.location.hash;
  const hasAuthHash = urlHash.length > 0 && 
    (urlHash.includes('access_token=') || 
     urlHash.includes('refresh_token=') || 
     urlHash.includes('type='));
  
  return hasToken || hasCode || hasType || hasAuthHash;
};

/**
 * Checks if user is authenticated and closes modal or redirects as needed
 * 
 * @param onClose Optional callback to close modal
 * @returns Whether the user is authenticated
 */
export const checkAuthAndClose = (onClose: () => void) => {
  const { isAuthenticated } = useAuthStore.getState();
  
  if (isAuthenticated()) {
    logger.debug('User already authenticated, closing auth modal');
    onClose();
  }
};

/**
 * Utility function to clear all verification state from localStorage and memory
 * Call this whenever verification state needs to be reset
 */
export const clearAllVerificationState = () => {
  try {
    localStorage.removeItem('verificationState');
    localStorage.removeItem('verificationEmail');
    logger.debug('Cleared all verification state');
    return true;
  } catch (error) {
    logger.error('Error clearing verification state:', error);
    return false;
  }
}; 