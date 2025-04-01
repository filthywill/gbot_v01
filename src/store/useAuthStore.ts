import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../lib/supabase';
import logger from '../lib/logger';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  rememberMe: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetError: () => void;
  resetPassword: (email: string) => Promise<void>;
  setRememberMe: (value: boolean) => void;
};

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  rememberMe: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      
      // Check if there's a session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const user = await getCurrentUser();
        set({ 
          user,
          isAuthenticated: !!user,
          isLoading: false,
          // Restore remember me preference from localStorage
          rememberMe: localStorage.getItem('rememberMe') === 'true'
        });
      } else {
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      logger.error('Auth initialization error:', error);
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication'
      });
    }
  },

  signInWithEmail: async (email: string, password: string, rememberMe: boolean) => {
    try {
      set({ isLoading: true, error: null });
      
      // Set session persistence based on rememberMe
      await supabase.auth.setSession({
        access_token: '',  // Will be set by signInWithPassword
        refresh_token: '', // Will be set by signInWithPassword
      });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Store rememberMe preference
      localStorage.setItem('rememberMe', rememberMe.toString());
      
      set({ 
        user: data.user,
        isAuthenticated: !!data.user,
        isLoading: false,
        rememberMe
      });
    } catch (error) {
      logger.error('Email sign-in error:', error);
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sign in'
      });
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // For email confirmation flow, user won't be authenticated immediately
      set({ 
        user: data.user,
        isAuthenticated: !!data.session,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Email sign-up error:', error);
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sign up'
      });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear rememberMe preference
      localStorage.removeItem('rememberMe');
      
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false,
        rememberMe: false
      });
    } catch (error) {
      logger.error('Sign out error:', error);
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sign out'
      });
    }
  },

  resetError: () => {
    set({ error: null });
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      set({ isLoading: false });
    } catch (error) {
      logger.error('Password reset error:', error);
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send reset email'
      });
    }
  },

  setRememberMe: (value: boolean) => {
    set({ rememberMe: value });
    localStorage.setItem('rememberMe', value.toString());
  }
}));

// Set up auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const user = await getCurrentUser();
    useAuthStore.setState({ 
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ 
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
});

export default useAuthStore; 