/**
 * Authentication Views
 * Used for controlling which view is displayed in the auth modal
 */
export const AUTH_VIEWS = {
  SIGN_IN: 'signin',
  SIGN_UP: 'signup',
  RESET_PASSWORD: 'reset-password',
  FORGOT_PASSWORD: 'forgot-password',
  VERIFICATION: 'verification',
  MFA: 'mfa',
  SUCCESS: 'success',
  SIGNUP_CONFIRMATION: 'signup-confirmation',
  RESET_CONFIRMATION: 'reset-confirmation',
  UPDATE_PASSWORD: 'update-password'
} as const;

export type AuthView = (typeof AUTH_VIEWS)[keyof typeof AUTH_VIEWS];

/**
 * Auth Status Types
 * Used to represent the current state of authentication
 */
export const AUTH_STATUS = {
  INITIAL: 'INITIAL',
  LOADING: 'LOADING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  ERROR: 'ERROR'
} as const;

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

/**
 * Auth Error Messages
 * Standardized error messages for auth-related errors
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  ACCOUNT_EXISTS: 'An account with this email already exists.',
  WEAK_PASSWORD: 'Password is too weak. Please use a stronger password.',
  EMAIL_NOT_CONFIRMED: 'Please verify your email address before signing in.',
  GENERIC_ERROR: 'An error occurred during authentication. Please try again.'
} as const;

/**
 * Auth Local Storage Keys
 * Keys used for storing auth-related data in local storage
 */
export const AUTH_STORAGE_KEYS = {
  SESSION: 'gbot_supabase_auth',
  PREFERENCES: 'gbot-preferences'
} as const; 