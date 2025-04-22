# Authentication System Documentation

This document provides detailed information about the authentication system implemented in GraffitiSOFT using Supabase.

## Overview

The application uses Supabase for authentication with a direct token approach for Google sign-in and email/password authentication with OTP code-based verification. The implementation follows best practices for security, performance, and user experience.

## Features

### Core Authentication Features
- Email/Password Authentication
- OTP Code-Based Email Verification
- Google OAuth Integration
- Password Reset Flow
- Remember Me Functionality
- Verification State Persistence
- Strong Password Requirements
- Session Management
- PKCE Authentication Flow
- Custom Storage Implementation

### User Experience
- Responsive Modal Design
- Form Validation with Visual Feedback
- Password Strength Meter
- Verification Status Banner
- Persistent Verification State
- Loading States and Error Handling
- Seamless Modal Transitions
- Persistent User Preferences

## Architecture

### Core Components

1. **Supabase Client**: Configuration and initialization in `src/lib/supabase.ts`
2. **Auth Store**: State management using Zustand in `src/store/useAuthStore.ts`
3. **Preferences Store**: User preferences management in `src/store/usePreferencesStore.ts`
4. **Google Auth Store**: Google OAuth management in `src/store/useGoogleAuthStore.ts`
5. **Auth Provider**: React context in `src/components/Auth/AuthProvider.tsx`
6. **Verification Components**: 
   - `VerificationCodeInput.tsx`: Handles OTP code entry and verification
   - `VerificationBanner.tsx`: Provides persistent verification status notification
7. **UI Components**: Modal, header, and authentication buttons

### State Management

The application uses multiple Zustand stores for different concerns:

1. **useAuthStore**: Manages core authentication state
   - User session
   - Authentication status
   - Error handling
   - Auth operations (sign in, sign up, sign out, verify OTP)

2. **usePreferencesStore**: Manages user preferences
   - Remember Me state
   - Last used email
   - Persistent preferences in localStorage

3. **useGoogleAuthStore**: Manages Google OAuth
   - SDK initialization
   - Google sign-in button state
   - OAuth flow handling

### Authentication Flow

```
┌───────────┐      ┌─────────────┐      ┌─────────────┐
│ Auth UI   │ ───▶ │ Auth Store  │ ───▶ │  Supabase   │
│Components │ ◀─── │ (Zustand)   │ ◀─── │   Client    │
└───────────┘      └─────────────┘      └─────────────┘
      │                   │                    ▲
      │                   ▼                    │
      │            ┌─────────────┐      ┌─────────────┐
      │            │ Auth State  │ ───▶ │ Application │
      │            │ Listeners   │      │  Features   │
      ▼            └─────────────┘      └─────────────┘
┌───────────┐      ┌─────────────┐
│Preferences│      │Verification │
│  Store    │      │  Banner     │
└───────────┘      └─────────────┘
```

## Implementation Details

### Supabase Client

The Supabase client is initialized in `src/lib/supabase.ts` with environment variables:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import logger from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'gbot_supabase_auth',
    flowType: 'pkce',
    debug: import.meta.env.DEV,
    storage: {
      // Custom storage implementation that respects the remember me preference
      async getItem(key: string) {
        try {
          // Check preferences for remember me setting
          const preferences = JSON.parse(localStorage.getItem('gbot-preferences') || '{}');
          const rememberMe = preferences?.state?.rememberMe ?? false;
          
          // If remember me is false, don't return session
          if (!rememberMe && key === 'gbot_supabase_auth') {
            return null;
          }
          
          return localStorage.getItem(key);
        } catch (error) {
          logger.error('Error reading from storage:', error);
          return null;
        }
      },
      setItem(key: string, value: string) {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          logger.error('Error writing to storage:', error);
        }
      },
      removeItem(key: string) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          logger.error('Error removing from storage:', error);
        }
      }
    }
  },
  global: {
    fetch: fetchWithTimeout // Custom fetch with timeout
  }
});

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
```

### Authentication Store (Zustand)

The authentication state is managed by a Zustand store in `src/store/useAuthStore.ts`:

```typescript
type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  status: 'LOADING' | 'UNAUTHENTICATED' | 'AUTHENTICATED' | 'ERROR';
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{user: User | null}>;
  signOut: () => Promise<void>;
  resetError: () => void;
};
```

The store exposes methods for all authentication operations and maintains the current authentication state.

### OTP Code-Based Email Verification

The application uses Supabase's One-Time Password (OTP) verification flow instead of link-based verification. This approach provides a better user experience by keeping users within the application during the verification process.

#### Sign-Up Process with OTP

```typescript
// In AuthModal.tsx, during signup
try {
  // Set loading state
  useAuthStore.setState({ status: 'LOADING', error: null });
  
  // Call Supabase with OTP option
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined, // Disable link-based verification 
    }
  });
  
  if (error) throw error;
  
  // For email confirmation flow using OTP code
  logger.info('Signup successful, waiting for OTP verification', { 
    user: data.user?.id,
    identityConfirmed: data.user?.identities?.[0]?.identity_data?.email_verified
  });
  
  // Switch to verification code input
  setVerificationEmail(email);
  
  // Store email for later use
  setLastUsedEmail(email);
  setRememberMe(true);
  
  // Store verification state for persistence
  const verificationState = {
    email: email,
    startTime: Date.now(),
    attempted: true
  };
  localStorage.setItem('verificationState', JSON.stringify(verificationState));
  
  // Success state
  useAuthStore.setState({ 
    status: 'UNAUTHENTICATED',
    error: null
  });
} catch (error) {
  logger.error('Error during signup:', error);
  setAuthError(error instanceof Error ? error.message : 'Failed to sign up');
  useAuthStore.setState({ 
    status: 'ERROR',
    error: error instanceof Error ? error.message : 'Failed to sign up'
  });
}
```

#### OTP Verification Component

The `VerificationCodeInput` component provides a user interface for entering the verification code sent via email:

```typescript
// VerificationCodeInput.tsx (key parts)
const handleVerify = useCallback(async () => {
  // Store the current code value to ensure we use the most up-to-date version
  const currentCode = codeBeforeVerifyRef.current || code;
  
  if (!currentCode.trim()) {
    setError('Please enter the verification code');
    return;
  }

  // Ensure we only have digits
  const cleanCode = currentCode.replace(/\D/g, '');
  if (cleanCode.length !== 6) {
    setError('Please enter a valid 6-digit verification code');
    return;
  }

  setIsVerifying(true);
  setError(null);

  try {
    logger.info('Verifying OTP code', { email, codeLength: cleanCode.length });
    
    // Use the auth store method to verify OTP
    const result = await verifyOtp(email, cleanCode);

    if (!result) {
      throw new Error('Verification failed');
    }

    // Successfully verified
    logger.info('Email verified successfully', { user: result.user?.id });
    
    // Clear verification state
    localStorage.removeItem('verificationState');
    
    // Call success callback
    onSuccess();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Verification error:', errorMessage);
    
    // Handle specific error cases
    setError(`Failed to verify: ${errorMessage}`);
  } finally {
    setIsVerifying(false);
  }
}, [code, email, onSuccess, verifyOtp]);
```

#### Verification State Persistence

To provide a seamless user experience, the verification state is persisted in localStorage. This allows users to close the verification modal or refresh the page without losing their verification progress:

```typescript
// When starting verification
const verificationState = {
  email: email,
  startTime: Date.now(),
  attempted: true
};
localStorage.setItem('verificationState', JSON.stringify(verificationState));

// When closing the verification modal
const handleVerificationClose = () => {
  // Store verification state in localStorage before closing
  if (verificationEmail) {
    const verificationState = {
      email: verificationEmail,
      startTime: Date.now(),
      attempted: true
    };
    
    localStorage.setItem('verificationState', JSON.stringify(verificationState));
    logger.info('Saved verification state', { email: verificationEmail, state: verificationState });
  }
  
  // Close the modal
  onClose();
};
```

### Verification Banner

The `VerificationBanner` component provides a persistent notification about pending verification:

```typescript
// VerificationBanner.tsx (key elements)
const VerificationBanner: React.FC<VerificationBannerProps> = ({ 
  onResumeVerification,
  forceShow = false,
  email,
  isAuthenticated = false
}) => {
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);

  // Verification state checks
  useEffect(() => {
    try {
      // Don't show banner when dismissed or authenticated
      if (dismissed || isAuthenticated) {
        localStorage.removeItem('verificationState');
        return;
      }

      // First check if we have an active verification
      if (forceShow && email) {
        setStoredEmail(email);
        return;
      }

      // Then check localStorage as fallback
      const storedState = localStorage.getItem('verificationState');
      if (storedState) {
        const parsedState = JSON.parse(storedState) as VerificationState;
        
        // Check if state is valid (less than 30 min old)
        const currentTime = Date.now();
        const expirationTime = parsedState.startTime + (30 * 60 * 1000); // 30 minutes
        
        if (currentTime < expirationTime) {
          setStoredEmail(parsedState.email);
          setTimeLeft(Math.floor((expirationTime - currentTime) / 1000));
        } else {
          // Clear expired state
          localStorage.removeItem('verificationState');
          setStoredEmail(null);
        }
      }
    } catch (error) {
      logger.error('Error processing verification state:', error);
    }
  }, [dismissed, isAuthenticated, forceShow, email]);

  // Rendering logic
  if (dismissed || isAuthenticated || (!forceShow && !storedEmail)) {
    return null;
  }
  
  // Banner display implementation
  // ...
};
```

The banner provides:
- Persistent notification of pending verification
- Countdown timer showing time remaining
- Resume verification button
- Dismissal option

### Google Sign-In Implementation

The application uses Google's Identity Services SDK for a direct token approach:

1. **Loading the SDK**: The script is dynamically added to the document
2. **Button Rendering**: Customizable Google sign-in button
3. **Credential Handling**: Processing the Google response token
4. **Token Validation**: Using Supabase to validate and create a session

```typescript
// GoogleSignInButton.tsx (key parts)
useEffect(() => {
  // Load the Google Identity Services SDK
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);

  script.onload = () => {
    // Initialize Google Sign-In button
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      // ...other options
    });
    
    // Render button
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      // ...other options
    });
  };
  
  // Cleanup
  return () => {
    // Remove script when component unmounts
  };
}, [handleCredentialResponse]);
```

The credential response is handled with a memoized callback function:

```typescript
const handleCredentialResponse = useCallback(async (response) => {
  try {
    // Validate credential
    if (!response.credential) {
      throw new Error('No credential received from Google');
    }

    // Sign in with Supabase using the ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    });

    // Handle response
    if (error) {
      logger.error('Supabase auth error', error);
      onError?.(error);
      return;
    }

    // Success handling
    logger.info('Successfully signed in with Google', { userId: data.user?.id });
    onSuccess?.();
    
    // Update auth state
    if (data.user) {
      useAuthStore.setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    }
  } catch (error) {
    logger.error('Error signing in with Google', error);
    onError?.(error);
  }
}, [resetError, onSuccess, onError]);
```

### Email/Password Authentication

Traditional email/password authentication is implemented with Supabase's methods:

```typescript
// Sign in with email/password
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

// Sign up with email/password and OTP verification
signUpWithEmail: async (email: string, password: string) => {
  try {
    set({ status: 'LOADING', error: null });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable link-based verification
      }
    });
    
    if (error) throw error;
    
    set({ 
      status: 'UNAUTHENTICATED',
      error: null
    });
    
    return data;
  } catch (error) {
    set({ 
      status: 'ERROR', 
      error: error instanceof Error ? error.message : 'Failed to sign up'
    });
    throw error;
  }
}
```

### Auth State Listener

The application maintains a global listener for authentication state changes:

```typescript
// Set up auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const user = await getCurrentUser();
    useAuthStore.setState({ 
      user,
      isAuthenticated: true,
      isLoading: false,
      status: 'AUTHENTICATED'
    });
    
    // Clear verification state if exists
    localStorage.removeItem('verificationState');
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ 
      user: null,
      isAuthenticated: false,
      isLoading: false,
      status: 'UNAUTHENTICATED'
    });
  }
});
```

### Auth Provider Component

A React provider component wraps the application to initialize authentication and provide session state:

```typescript
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialize, isLoading, status } = useAuthStore();
  
  useEffect(() => {
    // Initialize auth state when component mounts
    initialize();
  }, [initialize]);
  
  if (status === 'LOADING') {
    return <LoadingSpinner />;
  }
  
  return <>{children}</>;
};
```

### Remember Me Functionality

The Remember Me feature is implemented using the preferences store:

```typescript
// src/store/usePreferencesStore.ts
interface PreferencesState {
  rememberMe: boolean;
  lastUsedEmail: string;
  setRememberMe: (value: boolean) => void;
  setLastUsedEmail: (email: string) => void;
}

const usePreferencesStore = create<PreferencesState>((set) => ({
  rememberMe: localStorage.getItem('rememberMe') === 'true',
  lastUsedEmail: localStorage.getItem('lastUsedEmail') || '',
  
  setRememberMe: (value) => {
    localStorage.setItem('rememberMe', String(value));
    set({ rememberMe: value });
  },
  
  setLastUsedEmail: (email) => {
    if (email) {
      localStorage.setItem('lastUsedEmail', email);
    } else {
      localStorage.removeItem('lastUsedEmail');
    }
    set({ lastUsedEmail: email });
  },
}));
```

## PKCE Authentication Flow

The application uses PKCE (Proof Key for Code Exchange) flow for enhanced security:

```typescript
// In src/lib/supabase.ts
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ...other options
    flowType: 'pkce', // Enhanced security flow
  }
});
```

PKCE adds an extra layer of security compared to implicit flows by:
- Preventing authorization code interception attacks
- Adding a code verifier that only the legitimate client knows
- Protecting against CSRF and authorization code injection attacks
- Ensuring that tokens are obtained directly by the client, not through the URL

This security enhancement is particularly important for single-page applications and mobile apps. When using OAuth providers like Google, the PKCE flow ensures that authorization codes cannot be intercepted and used by malicious actors.

## Custom Storage Implementation

The application implements a custom storage adapter that respects the user's "Remember Me" preference:

```typescript
storage: {
  async getItem(key: string) {
    try {
      // Check preferences for "remember me" setting
      const preferences = JSON.parse(localStorage.getItem('gbot-preferences') || '{}');
      const rememberMe = preferences?.state?.rememberMe ?? false;
      
      // If remember me is false, don't return any stored session
      if (!rememberMe && key === 'gbot_supabase_auth') {
        logger.debug('Not returning stored session due to rememberMe=false');
        return null;
      }
      
      return localStorage.getItem(key);
    } catch (error) {
      logger.error('Error reading from storage:', error);
      return null;
    }
  },
  // Additional methods...
}
```

This approach enhances security and user experience by:
- Only persisting sessions when explicitly requested by the user
- Automatically clearing session data when "Remember Me" is disabled
- Providing a consistent experience across different browsers and devices
- Preventing unexpected persistent logins
- Respecting user privacy preferences

The implementation works by intercepting all storage operations and applying the "Remember Me" logic before allowing access to stored auth tokens. This ensures that even if an auth token exists in localStorage, it will not be used unless the user has opted to be remembered.

## Comprehensive Auth State Handling

The application listens for all authentication state changes and responds appropriately:

```typescript
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  logger.info('Auth event:', event);
  if (event === 'SIGNED_IN') {
    logger.info('User signed in:', session?.user?.email);
    // Update auth state...
  } else if (event === 'SIGNED_OUT') {
    logger.info('User signed out');
    // Clear auth state...
  } else if (event === 'PASSWORD_RECOVERY') {
    logger.info('Password recovery flow initiated');
    // Handle password recovery...
  } else if (event === 'TOKEN_REFRESHED') {
    logger.debug('Auth token refreshed');
    // Silent refresh handling...
  } else if (event === 'USER_UPDATED') {
    logger.info('User data updated');
    // Update user data in store...
  }
});
```

This implementation ensures:
- Consistent auth state across the application
- Proper handling of all auth-related events
- Automatic UI updates in response to auth changes
- Smooth user experience during token refreshes
- Proper cleanup during sign-out

The auth state change listener is critical for maintaining a coherent authentication state throughout the application. It catches events from different authentication operations (like sign-in via Google, OTP verification, or password reset) and ensures the application state is updated accordingly.

## Session Management and Token Refresh

The application includes advanced session management with automatic token refresh:

```typescript
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Additional options...
  }
});
```

Key session management features:
- **Automatic Token Refresh**: Access tokens are automatically refreshed before expiration
- **Timeout Handling**: All requests have configurable timeouts to prevent hanging operations
- **Offline Recovery**: Robust handling of network interruptions during authentication
- **Session Persistence**: Configurable session storage respecting user preferences
- **Secure Token Storage**: Tokens are stored securely and not exposed in URLs
- **Session Recovery**: Ability to resume sessions after browser refreshes or app restarts

Token refresh happens in the background without disrupting the user experience. When a token is about to expire, the client automatically requests a new token using the refresh token. This ensures continuous authentication without requiring the user to log in again.

## Advanced Error Handling

The authentication implementation includes sophisticated error handling for different scenarios:

### Network-Related Errors
```typescript
// Custom fetch with timeout
const fetchWithTimeout = (url: RequestInfo | URL, options: RequestInit = {}) => {
  const timeout = 15000; // 15 seconds timeout
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => {
    controller.abort();
    logger.warn('Supabase API request timed out:', url.toString());
  }, timeout);
  
  return fetch(url, {
    ...options,
    signal
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};
```

### Authentication Errors
```typescript
try {
  // Authentication operation
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  // Provide user-friendly error messages
  if (errorMessage.includes('Invalid login credentials')) {
    setError('Email or password is incorrect');
  } else if (errorMessage.includes('Email not confirmed')) {
    setError('Please verify your email before signing in');
  } else if (errorMessage.includes('rate limit')) {
    setError('Too many attempts. Please try again later');
  } else {
    setError('Authentication failed. Please try again');
  }
  
  // Log detailed error for debugging
  logger.error('Authentication error:', {
    error: errorMessage,
    context: 'signIn',
    // Don't log sensitive information like passwords
    email: email ? 'provided' : 'missing'
  });
}
```

### OTP Verification Errors
```typescript
// In verification flow
try {
  const result = await verifyOtp(email, code);
  // Success handling...
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  // User-friendly error messages for verification
  if (errorMessage.includes('expired')) {
    setError('This verification code has expired. Please request a new one');
  } else if (errorMessage.includes('incorrect')) {
    setError('Invalid verification code. Please check and try again');
  } else if (errorMessage.includes('too many requests')) {
    setError('Too many verification attempts. Please try again later');
  } else {
    setError('Verification failed. Please try again');
  }
}
```

This comprehensive error handling provides:
- User-friendly error messages that guide the user to resolution
- Detailed logging for debugging without exposing sensitive information
- Graceful degradation during network issues
- Rate-limiting protection and appropriate user feedback
- Clear distinction between different types of auth failures

## Verification Banner Implementation

The verification banner component provides a sophisticated notification system for pending verifications:

```typescript
const VerificationBanner: React.FC<VerificationBannerProps> = ({ 
  onResumeVerification,
  forceShow = false,
  email,
  isAuthenticated = false
}) => {
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);

  // Update timer regularly
  useEffect(() => {
    if (!storedEmail || dismissed) return;
    
    // Setup timer to count down
    const interval = setInterval(() => {
      try {
        const storedState = localStorage.getItem('verificationState');
        if (!storedState) {
          clearInterval(interval);
          return;
        }
        
        const parsedState = JSON.parse(storedState) as VerificationState;
        const currentTime = Date.now();
        const expirationTime = parsedState.startTime + (30 * 60 * 1000); // 30 minutes
        
        if (currentTime < expirationTime) {
          setTimeLeft(Math.floor((expirationTime - currentTime) / 1000));
        } else {
          // Clear expired state
          localStorage.removeItem('verificationState');
          setStoredEmail(null);
          clearInterval(interval);
        }
      } catch (error) {
        logger.error('Error updating verification timer:', error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [storedEmail, dismissed]);

  // Format time display
  const formatTimeLeft = () => {
    if (timeLeft <= 0) return 'expired';
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Banner render implementation
}
```

The verification banner provides these key features:
- **Persistence**: Shows across page refreshes until verification is complete
- **Countdown Timer**: Displays remaining time before the verification expires
- **Resumable Verification**: Allows users to continue verification after interruption
- **Dismissable UI**: Users can dismiss the banner if desired
- **Expiration Handling**: Automatically clears expired verification state
- **Session Awareness**: Doesn't show for authenticated users

The banner uses localStorage to persist verification state and implements a countdown timer to indicate the time remaining for verification. This provides a seamless user experience even if the user navigates away or refreshes the page during the verification process.

## Usage

To implement authentication in a component:

```typescript
import useAuthStore from '../store/useAuthStore';
import usePreferencesStore from '../store/usePreferencesStore';

const MyComponent = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { rememberMe } = usePreferencesStore();
  
  // Component logic
};
```

For protected routes:

```typescript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};
```

## Error Handling and Logging

The authentication implementation includes robust error handling and logging:

1. **Structured Logger**: Environment-aware logging with sensitive data sanitization
2. **User-Friendly Error Messages**: Clear error messages in the UI
3. **Detailed Error Logging**: Comprehensive error information for debugging

```typescript
try {
  // Authentication operation
} catch (error) {
  logger.error('Authentication error', error);
  set({ 
    isLoading: false,
    error: error instanceof Error ? error.message : 'Authentication failed'
  });
}
```

## Security Considerations

1. **Environment Variables**: Sensitive keys stored in `.env` files
2. **Token-Based Authentication**: Modern, secure authentication approach
3. **Proper Cleanup**: Resources properly cleaned up on component unmount
4. **Error Sanitization**: Sensitive data removed from error logs
5. **Type Safety**: TypeScript types for increased security and reliability
6. **OTP-Based Verification**: More secure than link-based verification for SPAs

## Optimizations

The authentication implementation includes several performance optimizations:

1. **Memoized Callbacks**: useCallback for event handlers
2. **Single Source of Truth**: Zustand store for state management
3. **Minimal Re-renders**: Efficient state updates and component structure
4. **Proper Cleanup**: All resources properly disposed on unmount
5. **Lazy Loading**: Google SDK loaded dynamically when needed
6. **Verification Persistence**: LocalStorage for seamless user experience

## Testing Authentication

To test the authentication flow:

1. Set up environment variables with valid Supabase and Google credentials
2. Enable authentication providers in the Supabase dashboard
3. Create test users via the Supabase dashboard or sign-up flow
4. Verify login, logout, and authentication state persistence
5. Test OTP verification with different email providers
6. Verify banner functionality after closing the verification modal

## Troubleshooting

### Common Issues

1. **OTP Code Not Received**: Check spam folder or verify email templates in Supabase
2. **Verification Banner Not Showing**: Check localStorage and verification state persistence
3. **Redirect URI Mismatch**: Ensure authorized origins in Google Cloud match your application URL
4. **Missing Environment Variables**: Check that all environment variables are properly set
5. **CORS Issues**: Verify Supabase CORS configuration
6. **Token Validation Failures**: Check Google Client ID configuration
7. **Network Errors**: Use browser developer tools to inspect network requests

### Debug Mode

Enable more detailed logging by setting the environment to development mode.

## Future Improvements

1. **Additional Providers**: Support for more OAuth providers (GitHub, Microsoft, etc.)
2. **Two-Factor Authentication**: Enhanced security with 2FA
3. **Role-Based Access Control**: More granular permissions system
4. **Session Management**: UI for managing active sessions
5. **Profile Management**: User profile editing capabilities
6. **Verification Improvements**: Custom email templates and enhanced UX

## Environment Setup and Debugging

### Required Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Common Authentication Issues

1. **CORS Issues**:
   - Ensure your domain is whitelisted in Supabase dashboard
   - Check that redirect URLs match exactly in Google Cloud Console
   - Verify SSL configuration for local development

2. **Google OAuth Issues**:
   - Verify Google Client ID is correct
   - Ensure authorized domains are configured in Google Cloud Console
   - Check that the OAuth consent screen is properly configured

3. **OTP Verification Issues**:
   - Verify email templates in Supabase dashboard
   - Check that OTP codes are delivered properly
   - Test with multiple email providers
   - Verify that localStorage is working properly for state persistence

4. **Session Management**:
   - Clear localStorage if experiencing persistent session issues
   - Check browser console for token-related errors
   - Verify Supabase session handling in dev tools

### Development Tools

1. **Browser Developer Tools**:
   - Network tab for API calls
   - Application tab for localStorage inspection
   - Console for authentication errors

2. **Supabase Dashboard**:
   - Authentication logs
   - User management
   - Email template configuration

3. **Local Development**:
   - Use HTTPS for OAuth functionality
   - Configure hosts file if needed
   - Monitor Vite server logs

### Debugging Tips

1. **Enable Debug Mode**:
   ```typescript
   const debugAuth = true; // Set in development
   logger.setLevel('debug');
   ```

2. **Monitor Auth State**:
   ```typescript
   useEffect(() => {
     const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
       console.debug('Auth event:', event, session);
     });
     return () => unsubscribe.data.subscription.unsubscribe();
   }, []);
   ```

3. **Test Different Scenarios**:
   - Fresh session
   - Expired token
   - Network interruption
   - Invalid credentials
   - Password reset flow 
   - OTP verification flow
   - Verification persistence across page reloads 