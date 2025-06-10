import { create } from 'zustand';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../lib/supabase';
import usePreferencesStore from './usePreferencesStore';
import logger from '../lib/logger';
import { clearAllVerificationState } from '../lib/auth/utils';
import { checkVerificationState, saveVerificationState } from '../lib/auth/verification';
import AUTH_CONFIG from '../lib/auth/config';
import { secureSignOut } from '../lib/auth/sessionUtils';

// Auth states that represent the full lifecycle of authentication
export type AuthStatus = 
  | 'INITIAL'      // Initial state before any auth check
  | 'LOADING'      // Auth check in progress
  | 'AUTHENTICATED' // User is authenticated
  | 'UNAUTHENTICATED' // User is not authenticated
  | 'ERROR';       // Auth error occurred

type AuthState = {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  error: string | null;
  lastError: Error | null;
  
  // Add specific loading states
  isSessionLoading: boolean;
  isUserDataLoading: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User; session: Session } | undefined>;
  signUpWithEmail: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; } | null>;
  signOut: () => Promise<void>;
  resetError: () => void;
  setError: (error: string) => void;
  resetPassword: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, token: string) => Promise<{ user: User | null; session: Session | null; } | null>;
  
  // Direct state setters (for auth callbacks and external auth sources)
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  
  // Computed / helpers
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  hasInitialized: () => boolean;
  
  // Verification helpers
  getVerificationTimeRemaining: () => {
    email: string | null;
    remainingMs: number;
    remainingMinutes: number;
    expiresAt: Date;
  } | null;
};

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  status: 'INITIAL',
  error: null,
  lastError: null,
  isSessionLoading: false,
  isUserDataLoading: false,

  initialize: async () => {
    const currentState = get();
    
    // Prevent multiple simultaneous initializations
    if (currentState.status === 'LOADING' || 
        (currentState.status === 'AUTHENTICATED' && currentState.user && currentState.session)) {
      logger.debug('Auth initialization already in progress or completed, skipping');
      return;
    }
    
    // Only initialize if we're in the initial state, error state, or unauthenticated with no session
    if (currentState.status !== 'INITIAL' && 
        currentState.status !== 'ERROR' && 
        !(currentState.status === 'UNAUTHENTICATED' && !currentState.session)) {
      logger.debug('Auth already initialized, skipping initialization');
      return;
    }
    
    try {
      logger.debug('Starting auth initialization');
      set({ 
        status: 'LOADING', 
        error: null,
        isSessionLoading: true,
        isUserDataLoading: false
      });
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      // Update session loading state
      set({ isSessionLoading: false });
      
      // No session means user is not authenticated
      if (!session) {
        logger.debug('No active session found, user is not authenticated');
        set({ 
          status: 'UNAUTHENTICATED',
          user: null,
          session: null,
          isUserDataLoading: false
        });
        return;
      }
      
      // Session found, update session state before fetching user
      set({
        session,
        isUserDataLoading: true
      });
      
      // We have a session, get the user data
      try {
        // Use the configurable retry count from AUTH_CONFIG
        const user = await getCurrentUser(AUTH_CONFIG.maxUserFetchRetries);
        
        if (user) {
          logger.debug('User authenticated', { userId: user.id });
          
          // Clear any verification state since user is already authenticated
          clearAllVerificationState();
          logger.debug('Cleared verification state for authenticated user during initialization');
          
          set({ 
            user,
            status: 'AUTHENTICATED',
            error: null,
            isUserDataLoading: false
          });
        } else {
          // Session exists but no user found
          logger.warn('Session exists but user data not found');
          set({ 
            user: null,
            session: null,
            status: 'UNAUTHENTICATED',
            error: 'Unable to retrieve user data',
            isUserDataLoading: false
          });
        }
      } catch (error) {
        logger.error('Error retrieving user data:', error);
        set({ 
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Failed to get user information',
          lastError: error instanceof Error ? error : new Error('Unknown error'),
          isUserDataLoading: false
        });
      }
    } catch (error) {
      logger.error('Auth initialization error:', error);
      set({ 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Authentication initialization failed',
        lastError: error instanceof Error ? error : new Error('Unknown error'),
        isSessionLoading: false,
        isUserDataLoading: false
      });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      set({ status: 'LOADING', error: null });
      logger.debug('Starting email sign-in process');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (!data.user) {
        logger.warn('Sign-in response had no user data');
        throw new Error('No user data received from authentication service');
      }
      
      // Update the store state
      set({ 
        user: data.user,
        session: data.session,
        status: 'AUTHENTICATED',
        error: null
      });
      
      // Update preferences if needed
      const { rememberMe, setLastUsedEmail } = usePreferencesStore.getState();
      if (rememberMe) {
        setLastUsedEmail(email);
      }
      
      logger.info('Email sign-in successful', { userId: data.user?.id });
      
      // Clear verification state
      clearAllVerificationState();
      
      return data;
    } catch (error: any) {
      logger.error('Error signing in:', error);
      logger.debug('Supabase auth error structure:', JSON.stringify(error, null, 2));
      set({ 
        error: error.message || 'Authentication failed',
        lastError: error,
        status: 'ERROR' 
      });
      throw error;
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    try {
      set({ status: 'LOADING', error: null });
      
      /* 
       * The pre-emptive checkUserExists() function is temporarily disabled.
       * It relies on Supabase's OTP sign-in flow, which is currently disabled in the production environment, causing sign-ups to fail.
       * The primary supabase.auth.signUp() call below has its own robust check for existing users, making this pre-emptive check redundant for now.
       */
      
      // Method 2: Try to check email verification status as a backup check
      const { verified, error: verificationError } = await checkEmailVerificationStatus(email);
      
      // Log detailed information for debugging
      logger.debug('Email existence check results:', { 
        // otpCheck: userExists, // Temporarily disabled
        verificationCheck: {
          verified,
          error: verificationError
        }
      });
      
      // Check for existing email with verification status
      if (verified !== null || 
          (verificationError && verificationError.includes('Invalid login credentials'))) {
        logger.warn('Attempted to sign up with existing email (verification check):', email);
        throw new Error('This email is already registered or was previously used. Please use a different email address or sign in instead.');
      }
      
      // Now attempt to sign up the user
      logger.info('Email appears to be new, attempting signup');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // emailRedirectTo is intentionally omitted to use the project's default email confirmation settings.
          // This avoids issues with strict TypeScript type checks.
        }
      });
      
      if (error) {
        // Double-check for duplicate email errors from the signup API
        if (error.message.toLowerCase().includes('email already registered') || 
            error.message.toLowerCase().includes('already exists') ||
            error.message.toLowerCase().includes('already in use')) {
          logger.warn('Duplicate email detected during signup:', email);
          throw new Error('This email is already registered or was previously used. Please use a different email address or sign in instead.');
        }
        throw error;
      }
      
      // Save verification state to track the 30-minute window
      saveVerificationState(email, false);
      
      // For email confirmation flow, user won't be authenticated immediately
      set({ 
        user: data.user,
        session: data.session,
        status: data.session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
        error: null
      });
      
      return data;
    } catch (error) {
      logger.error('Email sign-up error:', error);
      
      // Log the complete error object for debugging
      if (import.meta.env.DEV) {
        console.log('Sign-up error structure:', JSON.stringify(error, null, 2));
      }
      
      // Set more user-friendly error messages based on error codes
      let userFriendlyError = error instanceof Error ? error.message : 'Failed to sign up';
      
      // First check if this is our own custom error about existing email
      if (error instanceof Error && 
          (error.message.includes('already registered') || 
           error.message.includes('previously used'))) {
        // Keep our custom error message
        userFriendlyError = error.message;
      } 
      // Then check for Supabase error codes
      else if (error && typeof error === 'object') {
        // Check for Supabase structured error format
        const errorCode = 
          // Check for error.code directly
          ('code' in error && typeof error.code === 'string') ? error.code :
          // Check for error.error.code (nested structure)
          ('error' in error && typeof error.error === 'object' && error.error && 'code' in error.error) ? 
            error.error.code : null;
        
        if (errorCode) {
          logger.debug('Sign-up error code detected:', errorCode);
          
          switch (errorCode) {
            case 'email_exists':
            case 'user_exists':
              userFriendlyError = 'This email is already registered. Please use a different email address or sign in instead.';
              break;
            case 'weak_password':
              userFriendlyError = 'Password is too weak. Please use a stronger password.';
              break;
            case 'invalid_email':
              userFriendlyError = 'Please enter a valid email address.';
              break;
            case 'over_request_rate_limit':
            case 'over_email_send_rate_limit':
              userFriendlyError = 'Too many requests. Please try again later.';
              break;
            default:
              // Keep default error message for unrecognized codes
              break;
          }
        }
      }
      
      set({ 
        status: 'ERROR',
        error: userFriendlyError,
        lastError: error instanceof Error ? error : new Error(userFriendlyError)
      });
      return null;
    }
  },

  signOut: async () => {
    try {
      set({ status: 'LOADING' });
      
      // Use the secure sign-out function for better security
      await secureSignOut();
      
      // No need to update state as secureSignOut already calls clearSession
      set({ status: 'UNAUTHENTICATED' });
      
      // Update preferences if needed
      const { clearPreferences } = usePreferencesStore.getState();
      clearPreferences();
      
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Error signing out:', error);
      set({ 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Failed to sign out',
        lastError: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  },

  resetError: () => set({ error: null }),

  setError: (error: string) => set({ 
    error,
    status: 'ERROR',
    lastError: new Error(error)
  }),

  resetPassword: async (email: string) => {
    try {
      set({ status: 'LOADING', error: null });
      
      // Clear any existing verification state before starting a new password reset flow
      clearAllVerificationState();
      logger.info('Cleared existing verification state before password reset', { email });
      
      // Create a password recovery state instead of verification state
      try {
        localStorage.setItem('passwordRecoveryState', JSON.stringify({
          active: true,
          startTime: Date.now(),
          email: email
        }));
        logger.debug('Created password recovery state for email:', email);
      } catch (err) {
        logger.error('Error setting password recovery state:', err);
      }
      
      // Use Magic Link (OTP) for passwordless sign-in
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;
      // Log sending magic link with email and redirect URL
      logger.info('Sending magic link via OTP', { email, redirectTo });
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectTo
        }
      });
      if (error) throw error;
      
      set({ status: 'UNAUTHENTICATED' });
      logger.info('Magic link sent successfully');
      return true;
    } catch (error) {
      // Log error when sending magic link
      logger.error('Magic link send error', error);
      
      // Log the complete error object for debugging
      if (import.meta.env.DEV) {
        console.log('Magic link error structure:', JSON.stringify(error, null, 2));
      }
      
      // Set more user-friendly error messages based on error codes
      let userFriendlyError = error instanceof Error ? error.message : 'Failed to send magic link';
      
      // Check for error code first (more reliable)
      if (error && typeof error === 'object') {
        // Check for Supabase structured error format
        const errorCode = 
          // Check for error.code directly
          ('code' in error && typeof error.code === 'string') ? error.code :
          // Check for error.error.code (nested structure)
          ('error' in error && typeof error.error === 'object' && error.error && 'code' in error.error) ? 
            error.error.code : null;
        
        if (errorCode) {
          logger.debug('Magic link error code detected:', errorCode);
          
          switch (errorCode) {
            case 'email_not_found':
            case 'user_not_found':
              userFriendlyError = 'We couldn\'t find an account with that email address.';
              break;
            case 'over_request_rate_limit':
            case 'over_email_send_rate_limit':
              userFriendlyError = 'Too many requests. Please try again later.';
              break;
            case 'invalid_email':
              userFriendlyError = 'Please enter a valid email address.';
              break;
            default:
              // Keep default error message for unrecognized codes
              break;
          }
        }
      }
      
      set({
        status: 'ERROR',
        error: userFriendlyError,
        lastError: error instanceof Error ? error : new Error(userFriendlyError)
      });
      return false;
    }
  },
  
  // OTP verification method
  verifyOtp: async (email: string, token: string) => {
    try {
      set({ status: 'LOADING', error: null });
      logger.info('Verifying OTP code', { email });
      
      // Check verification state to determine if we're within the verification window
      const verificationState = checkVerificationState();
      
      // Create a timeout promise to handle potential hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Verification request timed out. Please try again.'));
        }, 10000); // 10 second timeout
      });
      
      // Create the actual verification promise
      const verificationPromise = supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });
      
      // Race the verification against the timeout
      const result = await Promise.race([
        verificationPromise,
        timeoutPromise
      ]);
      
      // Since result will be the verification response if it won the race
      const { data, error } = result;
      
      if (error) throw error;
      
      // Handle case where we got data but no user
      if (!data.user) {
        logger.warn('Verification completed but no user returned');
        throw new Error('Verification successful but user data unavailable. Please try signing in.');
      }
      
      // Update auth state with verified user
      set({ 
        user: data.user,
        session: data.session,
        status: data.session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
        error: null
      });
      
      logger.info('OTP verification successful', { userId: data.user?.id });
      
      // Clear verification state
      clearAllVerificationState();
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify code';
      logger.error('OTP verification error:', error);
      
      // Log the complete error object for debugging
      if (import.meta.env.DEV) {
        console.log('Supabase auth error structure:', JSON.stringify(error, null, 2));
      }
      
      // Get verification state to determine if we're within the verification window
      const verificationState = checkVerificationState();
      
      // Set more user-friendly error messages based on error code or message
      let userFriendlyError = errorMessage;
      
      // Check for error code first (more reliable)
      if (error && typeof error === 'object') {
        // Check for Supabase structured error format
        const errorCode = 
          // Check for error.code directly
          ('code' in error && typeof error.code === 'string') ? error.code :
          // Check for error.error.code (nested structure)
          ('error' in error && typeof error.error === 'object' && error.error && 'code' in error.error) ? 
            error.error.code : null;
        
        if (errorCode) {
          logger.debug('Authentication error code detected:', errorCode);
          
          switch (errorCode) {
            case 'invalid_code':
            case 'invalid_otp':
            case 'invalid_token':
              userFriendlyError = 'Incorrect verification code. Please check and try again.';
              break;
            case 'otp_expired':
              userFriendlyError = 'This verification code has expired. Please request a new one.';
              break;
            case 'over_request_rate_limit':
            case 'over_email_send_rate_limit':
              userFriendlyError = 'Too many attempts. Please try again later.';
              break;
            case 'request_timeout':
              userFriendlyError = 'Verification timed out. Please try again.';
              break;
            default:
              // Fall back to message pattern matching if code is not recognized
              break;
          }
        }
      }
      
      // Special case for "Token has expired or is invalid" message
      // This requires special handling since it contains both "expired" and "invalid"
      if (errorMessage === 'Token has expired or is invalid') {
        // Use verification state to improve error message accuracy
        if (verificationState.exists && verificationState.isValid && verificationState.email === email) {
          // If we're still within the verification window, it's more likely the code is incorrect
          userFriendlyError = 'Incorrect verification code. Please check and try again.';
        } else {
          // If the verification window has expired, it's more likely the code is expired
          userFriendlyError = 'This verification code has expired. Please request a new one.';
        }
      } 
      // Fall back to message pattern matching for other cases
      else if (userFriendlyError === errorMessage) {
        // If verification state is valid, prioritize "incorrect" over "expired" for ambiguous errors
        if (verificationState.exists && verificationState.isValid && verificationState.email === email) {
          if (
            errorMessage.toLowerCase().includes('invalid') || 
            errorMessage.toLowerCase().includes('incorrect') ||
            errorMessage.toLowerCase().includes('not found') ||
            errorMessage.toLowerCase().includes('expired') // Treat "expired" as "incorrect" if within time window
          ) {
            userFriendlyError = 'Incorrect verification code. Please check and try again.';
          } else if (errorMessage.includes('timeout')) {
            userFriendlyError = 'Verification timed out. Please try again.';
          }
        } else {
          // If verification state is invalid or expired, use standard error classification
          if (
            errorMessage.toLowerCase().includes('invalid') || 
            errorMessage.toLowerCase().includes('incorrect') ||
            errorMessage.toLowerCase().includes('not found')
          ) {
            userFriendlyError = 'Incorrect verification code. Please check and try again.';
          } else if (errorMessage.includes('timeout')) {
            userFriendlyError = 'Verification timed out. Please try again.';
          } else if (errorMessage.toLowerCase().includes('expired')) {
            userFriendlyError = 'This verification code has expired. Please request a new one.';
          }
        }
      }
      
      // Log the verification state and decision for debugging
      logger.debug('Verification error context:', {
        errorMessage,
        userFriendlyError,
        verificationState: {
          exists: verificationState.exists,
          isValid: verificationState.isValid,
          isExpired: verificationState.isExpired,
          matchesEmail: verificationState.email === email
        }
      });
      
      set({ 
        status: 'ERROR',
        error: userFriendlyError,
        lastError: error instanceof Error ? error : new Error(userFriendlyError)
      });
      return null;
    }
  },
  
  // Direct state setters for auth callbacks
  setUser: (user: User | null) => set({ user }),
  setSession: (session: Session | null) => set({ session }),
  
  clearSession: () => set({ 
    user: null, 
    session: null, 
    status: 'UNAUTHENTICATED',
    error: null
  }),
  
  // Computed helpers
  isAuthenticated: () => get().status === 'AUTHENTICATED',
  isLoading: () => {
    const state = get();
    return state.status === 'LOADING' || state.isSessionLoading || state.isUserDataLoading;
  },
  hasInitialized: () => get().status !== 'INITIAL',
  
  // Verification helpers
  getVerificationTimeRemaining: () => {
    const verificationState = checkVerificationState();
    if (!verificationState.exists || !verificationState.isValid) {
      return null;
    }
    
    return {
      email: verificationState.email,
      remainingMs: verificationState.remainingMs ?? 0,
      remainingMinutes: Math.floor((verificationState.remainingMs ?? 0) / (60 * 1000)),
      expiresAt: verificationState.expiresAt ?? new Date()
    };
  }
}));

// Set up auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  try {
    logger.debug('Auth state change:', { event, hasSession: !!session });
    const currentState = useAuthStore.getState();
    
    // Skip processing if we're already handling an auth operation
    if (currentState.status === 'LOADING') {
      logger.debug('Skipping auth state change during loading');
      return;
    }
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      if (session) {
        // IMPORTANT: Use setTimeout to avoid the Supabase deadlock bug
        // Don't make async API calls directly in onAuthStateChange
        setTimeout(async () => {
          try {
            // Mark as loading while we fetch the user data
            useAuthStore.setState({ 
              status: 'LOADING', 
              isUserDataLoading: true,
              session // Always set the session immediately
            });
            
            const user = await getCurrentUser(AUTH_CONFIG.maxUserFetchRetries);
            
            if (user) {
              useAuthStore.setState({ 
                user,
                session,
                status: 'AUTHENTICATED',
                error: null,
                isUserDataLoading: false
              });
              
              logger.info('User authenticated via state change', { userId: user.id, event });
            } else {
              logger.warn('Auth state change with session but no user data');
              
              // Don't clear the session immediately - give the user a chance to recover
              // Keep the session but mark as error state temporarily
              useAuthStore.setState({ 
                status: 'ERROR',
                error: 'Unable to retrieve user information. Please refresh the page.',
                isUserDataLoading: false
                // Note: We're keeping the session here instead of clearing it
              });
              
              // Try to recover the user data in the background
              setTimeout(async () => {
                try {
                  const retryUser = await getCurrentUser(1); // Single retry
                  if (retryUser) {
                    useAuthStore.setState({ 
                      user: retryUser,
                      status: 'AUTHENTICATED',
                      error: null
                    });
                    logger.info('Successfully recovered user data after initial failure');
                  } else {
                    // Only clear session after exhaustive attempts fail
                    logger.error('Failed to recover user data, clearing session');
                    useAuthStore.setState({ 
                      user: null,
                      session: null,
                      status: 'UNAUTHENTICATED',
                      error: 'Session expired. Please sign in again.'
                    });
                  }
                } catch (error) {
                  logger.error('Error during user data recovery:', error);
                  // Clear session only after recovery fails
                  useAuthStore.setState({ 
                    user: null,
                    session: null,
                    status: 'UNAUTHENTICATED',
                    error: 'Authentication failed. Please sign in again.'
                  });
                }
              }, 2000); // Wait 2 seconds before attempting recovery
            }
          } catch (error) {
            logger.error('Error during auth state change:', error);
            
            // Don't clear session immediately on error - be more conservative
            useAuthStore.setState({ 
              status: 'ERROR',
              error: 'Authentication error. Please refresh the page.',
              lastError: error instanceof Error ? error : new Error('Unknown error'),
              isUserDataLoading: false
              // Keep the session for potential recovery
            });
            
            // Attempt recovery after a delay
            setTimeout(async () => {
              try {
                const currentSession = useAuthStore.getState().session;
                if (currentSession) {
                  const retryUser = await getCurrentUser(1);
                  if (retryUser) {
                    useAuthStore.setState({ 
                      user: retryUser,
                      status: 'AUTHENTICATED',
                      error: null
                    });
                    logger.info('Successfully recovered from auth state change error');
                  }
                }
              } catch (recoveryError) {
                logger.debug('Auth recovery failed, maintaining error state');
              }
            }, 3000); // Wait 3 seconds before attempting recovery
          }
        }, 0); // Use setTimeout to break out of the onAuthStateChange context
      }
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ 
        user: null,
        session: null,
        status: 'UNAUTHENTICATED',
        error: null,
        isSessionLoading: false,
        isUserDataLoading: false
      });
      logger.info('User signed out via state change');
    } else if (event === 'TOKEN_REFRESH_FAILED' as AuthChangeEvent) {
      logger.warn('Token refresh failed, forcing user to re-authenticate');
      
      useAuthStore.setState({
        user: null,
        session: null,
        status: 'UNAUTHENTICATED',
        error: 'Your session has expired. Please sign in again.',
        isSessionLoading: false,
        isUserDataLoading: false
      });
      
      // Dispatch a custom event for UI components to show a notification
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('auth:session-expired', {
          detail: {
            message: 'Your session has expired. Please sign in again.'
          }
        }));
      }
      
      logger.info('User was signed out due to expired refresh token');
    }
  } catch (error) {
    logger.error('Unhandled error in auth state change listener:', error);
    useAuthStore.setState({ 
      status: 'ERROR',
      error: 'Unhandled authentication error',
      lastError: error instanceof Error ? error : new Error('Unknown error')
    });
  }
});

// Add a new function to check if a user's email is verified

export const checkEmailVerificationStatus = async (email: string) => {
  try {
    // We can't directly get a user by email, so we'll need to use the current session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData && sessionData.session) {
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user && userData.user.email === email) {
        // Check if the user's email is verified
        const isVerified = userData.user.email_confirmed_at != null;
        
        return { 
          verified: isVerified, 
          user: userData.user,
          confirmedAt: userData.user.email_confirmed_at,
          error: null 
        };
      }
    }
    
    // Instead of using a fake password, use OTP to check if the email is registered
    // This is more reliable and doesn't affect auth state or cause side effects
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });
    
    if (error) {
      // Log the complete error object for debugging
      if (import.meta.env.DEV) {
        console.log('Email verification check error structure:', JSON.stringify(error, null, 2));
      }
      
      // Check for error code first (more reliable)
      if (typeof error === 'object') {
        const errorCode = 
          // Check for error.code directly
          ('code' in error && typeof error.code === 'string') ? error.code :
          // Check for error.error.code (nested structure)
          ('error' in error && typeof error.error === 'object' && error.error && 'code' in error.error) ? 
            error.error.code : null;
            
        if (errorCode) {
          logger.debug('Email verification check error code:', errorCode);
          
          switch(errorCode) {
            case 'user_not_found':
            case 'email_not_found':
              return { verified: false, error: 'Email not found' };
            case 'over_request_rate_limit':
            case 'over_email_send_rate_limit':
              logger.warn('Rate limit reached during email verification check:', error);
              return { verified: null, error: 'Too many requests' };
            default:
              return { verified: null, error: error.message };
          }
        }
      }
      
      // Fall back to string matching if no code is found
      if (error.message.includes("Email not found")) {
        return { verified: false, error: 'Email not found' };
      }
      
      // Handle rate limiting
      if (error.message.includes("Too many requests") || error.status === 429) {
        logger.warn('Rate limit reached during email verification check:', error);
        return { verified: null, error: 'Too many requests' };
      }
      
      // Other errors
      return { verified: null, error: error.message };
    }
    
    // If no error from OTP request, the email exists but we can't determine if it's verified
    return { verified: null, error: 'Email exists but verification status unknown' };
  } catch (error) {
    logger.error('Exception checking verification status:', error);
    return { verified: false, error: String(error) };
  }
};

// Add a function to directly check if a user exists by email
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    // For development environment, skip these checks to allow any email
    if (import.meta.env.VITE_APP_ENV === 'development') {
      logger.debug('Development mode: Bypassing email existence check for:', email);
      return false;
    }
    
    logger.debug('Checking if user exists:', email);
    
    // Using the official OTP method with shouldCreateUser: false
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      }
    });

    // Log the complete error object for debugging
    if (import.meta.env.DEV && error) {
      console.log('User exists check error structure:', JSON.stringify(error, null, 2));
    }

    // If no error, the email exists and can receive OTP
    if (!error) {
      logger.debug('User exists check: User exists (OTP check successful)');
      return true;
    }

    // Check for error codes first (more reliable)
    if (error && typeof error === 'object') {
      const errorCode = 
        // Check for error.code directly
        ('code' in error && typeof error.code === 'string') ? error.code :
        // Check for error.error.code (nested structure)
        ('error' in error && typeof error.error === 'object' && error.error && 'code' in error.error) ? 
          error.error.code : null;
          
      if (errorCode) {
        logger.debug('User exists check error code:', errorCode);
        
        switch(errorCode) {
          case 'user_not_found':
          case 'email_not_found':
            logger.debug('User exists check: User does not exist (Email not found)');
            return false;
          case 'over_request_rate_limit':
          case 'over_email_send_rate_limit':
            logger.warn('Rate limit reached during email existence check:', error);
            useAuthStore.getState().setError("Too many sign-in attempts. Please try again later.");
            return false;
          default:
            // Fall through to string-based checks
            break;
        }
      }
    }

    // Fall back to string pattern matching if no code found or recognized
    // If error contains "Email not found", the user doesn't exist
    if (error.message.includes("Email not found")) {
      logger.debug('User exists check: User does not exist (Email not found)');
      return false;
    }

    // Handle rate limiting
    if (error.message.includes("Too many requests") || error.status === 429) {
      logger.warn('Rate limit reached during email existence check:', error);
      useAuthStore.getState().setError("Too many sign-in attempts. Please try again later.");
      return false;
    }

    // Log any unexpected errors but don't expose to user
    logger.error("Error checking if user exists:", error);
    
    // If checking user existence fails, assume user might exist to avoid information disclosure
    logger.debug('User exists check error structure:', JSON.stringify(error, null, 2));
    return true; // Fail safely by assuming user exists
  } catch (error) {
    logger.error('Exception checking if user exists:', error);
    return false; // Assume user doesn't exist if there's an error
  }
};

export default useAuthStore; 