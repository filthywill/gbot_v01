import logger from '../logger';
import { supabase } from '../supabase';
import useAuthStore from '../../store/useAuthStore';

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
 * Clean up URL parameters after handling auth-related parameters
 * 
 * @param params Optional array of specific parameters to remove, or all auth-related if not specified
 */
export const cleanUrlParams = (params?: string[]) => {
  const url = new URL(window.location.href);
  
  // Define default auth-related parameters
  const defaultParams = [
    'token', 
    'code', 
    'type', 
    'email', 
    'verification', 
    'needsLogin', 
    'auth', 
    'error',
    'reset',
    'passwordReset'
  ];
  
  // Determine which parameters to remove
  const paramsToRemove = params || defaultParams;
  
  // Remove each parameter
  paramsToRemove.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
    }
  });
  
  // Update the URL without reloading the page
  window.history.replaceState({}, document.title, url.toString());
  
  // Also remove hash parameters if they exist and no specific params were requested
  if (!params && window.location.hash) {
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }
};

/**
 * Save verification state to localStorage
 * 
 * @param email Email address being verified
 * @param isResumed Whether this is a resumed verification
 * @returns The saved verification state
 */
export const saveVerificationState = (email: string, isResumed = false) => {
  const verificationState = {
    email,
    startTime: Date.now(),
    resumed: isResumed,
    resumeTime: isResumed ? Date.now() : undefined
  };
  
  try {
    // Store both in localStorage to ensure consistency
    localStorage.setItem('verificationState', JSON.stringify(verificationState));
    localStorage.setItem('verificationEmail', email);
    
    logger.debug('Saved verification state', { email, isResumed });
    return verificationState;
  } catch (error) {
    logger.error('Error saving verification state', error);
    return null;
  }
};

/**
 * Check if verification state exists and is not expired
 * 
 * @param expirationMinutes Minutes until verification state expires (default: 30)
 * @returns Object with verification state information
 */
export const checkVerificationState = (expirationMinutes = 30) => {
  try {
    const storedState = localStorage.getItem('verificationState');
    const storedEmail = localStorage.getItem('verificationEmail');
    
    if (!storedState || !storedEmail) {
      return { 
        exists: false, 
        isValid: false, 
        isExpired: false, 
        email: null,
        state: null 
      };
    }
    
    const parsedState = JSON.parse(storedState);
    const currentTime = Date.now();
    const expirationTime = parsedState.startTime + (expirationMinutes * 60 * 1000);
    const isExpired = currentTime >= expirationTime;
    
    // If expired, clear the state
    if (isExpired) {
      localStorage.removeItem('verificationState');
      localStorage.removeItem('verificationEmail');
    }
    
    return {
      exists: true,
      isValid: !isExpired,
      isExpired,
      email: storedEmail,
      state: parsedState,
      expiresAt: new Date(expirationTime),
      remainingMs: Math.max(0, expirationTime - currentTime)
    };
  } catch (error) {
    logger.error('Error checking verification state', error);
    return { 
      exists: false, 
      isValid: false, 
      isExpired: true, 
      email: null, 
      state: null,
      error
    };
  }
};

/**
 * Completes the verification process with Supabase
 * 
 * @param token Token from URL
 * @param email User's email
 * @returns Result of verification
 */
export const completeVerification = async (token: string, email: string) => {
  try {
    logger.info('Completing verification process', { tokenLength: token.length, email });
    
    // First try exchangeCodeForSession which is the recommended method
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(token);
    
    if (sessionError) {
      logger.error('Error exchanging code for session, falling back to verifyOtp', sessionError);
      
      // Fallback to verifyOtp if exchangeCodeForSession fails
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
        email
      });
      
      if (verifyError) {
        return { 
          success: false, 
          error: verifyError,
          message: verifyError.message
        };
      }
      
      return { 
        success: true, 
        data,
        message: 'Verification completed using OTP method'
      };
    }
    
    // If we get here, the session exchange was successful
    const { user, status } = useAuthStore.getState();
    
    return { 
      success: true, 
      user,
      status,
      message: 'Verification completed using exchangeCodeForSession method'
    };
  } catch (error) {
    logger.error('Error completing verification', error);
    return { 
      success: false, 
      error,
      message: error instanceof Error ? error.message : 'Unknown error during verification'
    };
  }
}; 