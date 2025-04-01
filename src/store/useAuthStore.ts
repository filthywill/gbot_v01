import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../lib/supabase';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetError: () => void;
};

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

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
        });
      } else {
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication'
      });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ 
        user: data.user,
        isAuthenticated: !!data.user,
        isLoading: false,
      });
    } catch (error) {
      console.error('Email sign-in error:', error);
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
      console.error('Email sign-up error:', error);
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
      
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sign out'
      });
    }
  },

  resetError: () => {
    set({ error: null });
  },
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