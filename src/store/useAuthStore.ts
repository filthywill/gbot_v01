import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../lib/supabase';
import usePreferencesStore from './usePreferencesStore';
import logger from '../lib/logger';

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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
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

  resetPassword: async (email: string) => {
    try {
      set({ status: 'LOADING', error: null });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
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
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });
      
      if (error) throw error;
      
      // Update auth state with verified user
      set({ 
        user: data.user,
        session: data.session,
        status: data.session ? 'AUTHENTICATED' : 'UNAUTHENTICATED',
        error: null
      });
      
      logger.info('OTP verification successful', { userId: data.user?.id });
      return data;
    } catch (error) {
      logger.error('OTP verification error:', error);
      set({ 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Failed to verify code',
        lastError: error instanceof Error ? error : new Error('Unknown error')
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

export default useAuthStore; 