import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../lib/supabase';
import usePreferencesStore from './usePreferencesStore';
import logger from '../lib/logger';
import { clearAllVerificationState } from '../lib/auth/utils';

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
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User; session: Session } | undefined>;
  signUpWithEmail: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; } | null>;
  signOut: () => Promise<void>;
  resetError: () => void;
  setError: (error: string) => void;
  resetPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ user: User | null; session: Session | null; } | null>;
  
  // Direct state setters (for auth callbacks and external auth sources)
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  
  // Computed / helpers
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  hasInitialized: () => boolean;
};

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  status: 'INITIAL',
  error: null,
  lastError: null,

  initialize: async () => {
    // Only initialize if we're in the initial state to prevent duplicate initializations
    if (get().status !== 'INITIAL' && get().status !== 'ERROR') {
      logger.debug('Auth already initialized, skipping initialization');
      return;
    }
    
    try {
      logger.debug('Starting auth initialization');
      set({ status: 'LOADING', error: null });
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      // No session means user is not authenticated
      if (!session) {
        logger.debug('No active session found, user is not authenticated');
        set({ 
          status: 'UNAUTHENTICATED',
          user: null,
          session: null 
        });
        return;
      }
      
      // We have a session, get the user data
      try {
        const user = await getCurrentUser();
        
        if (user) {
          logger.debug('User authenticated', { userId: user.id });
          set({ 
            user,
            session,
            status: 'AUTHENTICATED',
            error: null
          });
        } else {
          // Session exists but no user found
          logger.warn('Session exists but user data not found');
          set({ 
            user: null,
            session: null,
            status: 'UNAUTHENTICATED',
            error: 'Unable to retrieve user data'
          });
        }
      } catch (error) {
        logger.error('Error retrieving user data:', error);
        set({ 
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Failed to get user information',
          lastError: error instanceof Error ? error : new Error('Unknown error')
        });
      }
    } catch (error) {
      logger.error('Auth initialization error:', error);
      set({ 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Authentication initialization failed',
        lastError: error instanceof Error ? error : new Error('Unknown error')
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
    } catch (error) {
      logger.error('Email sign-in error:', error);
      set({ 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Failed to sign in',
        lastError: error instanceof Error ? error : new Error('Unknown error')
      });
      throw error;
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    try {
      set({ status: 'LOADING', error: null });
      
      // First, use our direct check method
      const userExists = await checkUserExists(email);
      if (userExists) {
        logger.warn('Attempted to sign up with existing email:', email);
        throw new Error('This email is already registered or was previously used. Please use a different email address or sign in instead.');
      }
      
      // Additional checks for thoroughness
      // Method 1: Check if we can sign in with OTP
      const { data: existingUserData, error: existingUserError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      // Method 2: Try to check email verification status
      const { verified, error: verificationError } = await checkEmailVerificationStatus(email);
      
      // Log detailed information for debugging
      logger.debug('Email existence check results:', { 
        directCheck: userExists,
        otpCheck: { 
          hasUser: !!existingUserData?.user,
          error: existingUserError?.message
        },
        verificationCheck: {
          verified,
          error: verificationError
        }
      });
      
      // Comprehensive check for existing email
      const emailExists = 
        userExists ||
        !!existingUserData?.user || 
        verified !== null || 
        (verificationError && verificationError.includes('Invalid login credentials')) ||
        (existingUserError && existingUserError.message.toLowerCase().includes('already registered'));
        
      if (emailExists) {
        logger.warn('Attempted to sign up with existing email:', email);
        throw new Error('This email is already registered or was previously used. Please use a different email address or sign in instead.');
      }
      
      // Now attempt to sign up the user
      logger.info('Email appears to be new, attempting signup');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable link-based verification to ensure OTP is used
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
      set({ 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Failed to sign up',
        lastError: error instanceof Error ? error : new Error('Unknown error')
      });
      return null;
    }
  },

  signOut: async () => {
    try {
      set({ status: 'LOADING' });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear auth state
      set({ 
        user: null,
        session: null,
        status: 'UNAUTHENTICATED',
        error: null
      });
      
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Sign out error:', error);
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
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password#recovery',
      });
      
      if (error) throw error;
      
      set({ status: 'UNAUTHENTICATED' });
      logger.info('Password reset email sent');
    } catch (error) {
      logger.error('Password reset error:', error);
      set({ 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Failed to send password reset email',
        lastError: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  },
  
  // OTP verification method
  verifyOtp: async (email: string, token: string) => {
    try {
      set({ status: 'LOADING', error: null });
      logger.info('Verifying OTP code', { email });
      
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
      
      // Set more user-friendly error messages based on error type
      let userFriendlyError = errorMessage;
      if (errorMessage.includes('timeout')) {
        userFriendlyError = 'Verification timed out. Please try again.';
      } else if (errorMessage.includes('expired')) {
        userFriendlyError = 'This verification code has expired. Please request a new one.';
      } else if (errorMessage.includes('invalid')) {
        userFriendlyError = 'Invalid verification code. Please check and try again.';
      }
      
      set({ 
        status: 'ERROR',
        error: userFriendlyError,
        lastError: error instanceof Error ? error : new Error(userFriendlyError)
      });
      return null;
    }
  },
  
  // Direct state setters for auth callbacks
  setUser: (user: User | null) => {
    logger.debug('Explicitly setting user in auth store', { userId: user?.id });
    const currentStatus = get().status;
    
    set({ 
      user, 
      status: user ? 'AUTHENTICATED' : (currentStatus === 'AUTHENTICATED' ? 'UNAUTHENTICATED' : currentStatus)
    });
    
    // If we're setting a user but don't have a session, try to get the current session
    if (user && !get().session) {
      logger.debug('User set but no session, attempting to get current session');
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          logger.debug('Retrieved session to match user');
          set({ session: data.session });
        }
      }).catch(error => {
        logger.error('Error getting session after setting user:', error);
      });
    }
  },
  
  setSession: (session: Session | null) => {
    logger.debug('Explicitly setting session in auth store', { hasSession: !!session });
    const currentUser = get().user;
    const currentStatus = get().status;
    
    set({ 
      session, 
      status: session ? 'AUTHENTICATED' : (currentStatus === 'AUTHENTICATED' ? 'UNAUTHENTICATED' : currentStatus)
    });
    
    // If we're setting a session but don't have a user, try to get the current user
    if (session && !currentUser) {
      logger.debug('Session set but no user, attempting to get current user');
      getCurrentUser().then(user => {
        if (user) {
          logger.debug('Retrieved user to match session');
          set({ user });
        }
      }).catch(error => {
        logger.error('Error getting user after setting session:', error);
      });
    }
  },
  
  // Computed helpers
  isAuthenticated: () => get().status === 'AUTHENTICATED',
  isLoading: () => get().status === 'LOADING' || get().status === 'INITIAL',
  hasInitialized: () => get().status !== 'INITIAL'
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
        try {
          // Mark as loading while we fetch the user data
          useAuthStore.setState({ status: 'LOADING' });
          
          const user = await getCurrentUser();
          
          if (user) {
            useAuthStore.setState({ 
              user,
              session,
              status: 'AUTHENTICATED',
              error: null
            });
            
            logger.info('User authenticated via state change', { userId: user.id, event });
          } else {
            logger.warn('Auth state change with session but no user data');
            useAuthStore.setState({ 
              status: 'UNAUTHENTICATED',
              user: null,
              session: null,
              error: 'Failed to retrieve user information'
            });
          }
        } catch (error) {
          logger.error('Error during auth state change:', error);
          useAuthStore.setState({ 
            status: 'ERROR',
            error: 'Authentication state error',
            lastError: error instanceof Error ? error : new Error('Unknown error')
          });
        }
      }
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ 
        user: null,
        session: null,
        status: 'UNAUTHENTICATED',
        error: null
      });
      logger.info('User signed out via state change');
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
    // and additional checks to determine verification status
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData && sessionData.session) {
      // If we have a session, check if the user is the same as the email we're checking
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
    
    // If we don't have a session or the emails don't match,
    // we can't directly check verification status, so we'll try to sign in
    // with a dummy password to see if there's a verification error
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'dummy_password_for_verification_check'
    });
    
    if (error) {
      // If the error is about unverified email, then we know the user exists but isn't verified
      if (error.message.includes('Email not confirmed')) {
        return { verified: false, error: 'Email not confirmed' };
      }
      
      // If it's an invalid credentials error, the user likely exists but the password is wrong
      // which means they have an account that may or may not be verified
      if (error.message.includes('Invalid login credentials')) {
        return { verified: null, error: 'Cannot determine verification status' };
      }
      
      // Other errors
      return { verified: false, error: error.message };
    }
    
    // If we get here, something unexpected happened
    return { verified: null, error: 'Unexpected outcome when checking verification' };
  } catch (error) {
    logger.error('Exception checking verification status:', error);
    return { verified: false, error: String(error) };
  }
};

// Add a function to directly check if a user exists by email
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    logger.debug('Checking if user exists:', email);
    
    // Method 1: Try to sign in with a fake password
    // This will tell us if the user exists but not give away the password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'ThisIsAFakePasswordToCheckIfUserExists12345!',
    });
    
    // If we get "Invalid login credentials", the user likely exists
    // If we get "Email not confirmed", the user definitely exists
    if (error) {
      if (error.message.includes('Invalid login credentials') || 
          error.message.includes('Email not confirmed')) {
        logger.debug('User exists check: User exists based on auth error');
        return true;
      }
    }
    
    // Method 2: Try OTP which is less reliable but provides another signal
    const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });
    
    if (otpData?.user) {
      logger.debug('User exists check: User exists based on OTP response');
      return true;
    }
    
    // If we get here, the user probably doesn't exist
    logger.debug('User exists check: User likely does not exist');
    return false;
  } catch (error) {
    logger.error('Error checking if user exists:', error);
    return false; // Assume user doesn't exist if there's an error
  }
};

export default useAuthStore; 