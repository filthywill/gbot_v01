import { User, Session } from '@supabase/supabase-js';
import { AuthStatus, AuthView } from './constants';

/**
 * Auth State Interface
 * Represents the full state for the auth store
 */
export interface AuthState {
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
  
  // Direct state setters
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  
  // Computed helpers
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  hasInitialized: () => boolean;
}

/**
 * Auth Modal Props
 * Props for the AuthModal component
 */
export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  initialEmail?: string | null;
  verificationEmail?: string | null;
}

/**
 * Auth Provider Props
 * Props for the AuthProvider component
 */
export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication Parameters
 * Parameters that can be extracted from URLs during auth flows
 */
export interface AuthParams {
  token?: string | null;
  code?: string | null;
  type?: string | null;
  email?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
}

/**
 * Result Types
 */
export interface VerificationResult {
  verified: boolean;
  error?: string;
  data?: any;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface SignInResult {
  success: boolean;
  session?: Session;
  error?: string;
} 