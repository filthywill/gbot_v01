# GraffitiSOFT Authentication System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Architecture](#architecture)
4. [Implementation](#implementation)
5. [OTP Verification Flow](#otp-verification-flow)
6. [Password Reset Flow](#password-reset-flow)
7. [Form Validation](#form-validation)
8. [UI Components](#ui-components)
9. [Security Considerations](#security-considerations)
10. [Testing](#testing)
11. [Supabase Setup](#supabase-setup)
12. [Troubleshooting](#troubleshooting)
13. [Tab Visibility Solution](#tab-visibility-solution)
14. [Future Considerations](#future-considerations)
15. [Password Security Features](#password-security-features)

## Overview

The GraffitiSOFT authentication system is built on top of Supabase, providing a secure and user-friendly authentication experience. It supports email/password authentication with OTP (One-Time Password) verification, Google OAuth, and comprehensive session management.

The system is designed to be:
- **Secure**: Implements best practices for authentication security
- **User-friendly**: Intuitive flows with proper error handling
- **Responsive**: Works seamlessly across desktop and mobile devices
- **Maintainable**: Well-structured code with clear separation of concerns
- **Resilient**: Handles browser tab switching and network issues gracefully

## Core Features

- **Email/Password Authentication**: Traditional sign-up and sign-in with email and password
- **OTP Code-based Verification**: Email verification using one-time password codes
- **Google OAuth Integration**: Sign in with Google option
- **Session Management**: Automatic session persistence and refresh
- **Tab Visibility Handling**: Maintains authentication when switching browser tabs
- **Protected Routes**: Route-based access control for authenticated users
- **Password Reset**: Secure password reset flow
- **Responsive Design**: Mobile-friendly authentication forms
- **Form Validation**: Comprehensive input validation with error messaging
- **Error Handling**: User-friendly error messages for authentication failures
- **Retry Logic**: Resilient authentication with automatic retry mechanisms

## Architecture

### Core Components

1. **Supabase Client**: Handles communication with Supabase Auth API
2. **Auth Store (Zustand)**: Manages authentication state and operations
3. **Authentication Hooks**: Custom React hooks for auth operations
   - `useEmailVerification`: Manages email verification state and process
   - `useAuthModalState`: Controls authentication modal state and views
4. **Auth Components**: UI components for authentication flows
   - `AuthProvider`: Manages authentication initialization and tab visibility
5. **Modal Components**: Dedicated components for auth-related modals
6. **Auth Middleware**: Route protection and session validation
7. **Auth Configuration**: Centralized configuration via `AUTH_CONFIG`

### Data Flow

```
User Action → UI Component → Auth Hook → Auth Store → Supabase Client → Supabase Auth API
            ↑                                                                     |
            |                                                                     |
            └─────────────────────────── Response ────────────────────────────────┘
```

### Directory Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── config.ts             # Centralized auth configuration
│   │   ├── verification.ts       # Verification utilities
│   │   ├── utils.ts              # Auth utility functions
│   │   └── sessionUtils.ts       # Session management utilities
│   └── supabase/
│       └── supabase.ts           # Supabase client initialization
├── components/
│   ├── app/                      # Core application components
│   │   ├── AppHeader.tsx         # Header with auth controls
│   │   └── ...                   # Other app components
│   ├── Auth/
│   │   ├── flows/
│   │   │   ├── SignIn.tsx        # Sign-in form and logic
│   │   │   ├── SignUp.tsx        # Sign-up form and logic
│   │   │   └── ResetPassword.tsx # Password reset flow
│   │   ├── ui/
│   │   │   ├── AuthForm.tsx      # Shared form component
│   │   │   └── VerificationInput.tsx # OTP input component
│   │   ├── AuthProvider.tsx      # Authentication provider with tab visibility handling
│   │   ├── AuthModal.tsx         # Main authentication modal
│   │   └── VerificationBanner.tsx # Verification notification banner
│   └── modals/
│       ├── VerificationSuccessModal.tsx  # Success feedback modal
│       ├── VerificationErrorModal.tsx    # Error handling modal
│       └── VerificationLoadingModal.tsx  # Loading state modal
├── hooks/
│   └── auth/
│       ├── useEmailVerification.ts # Email verification hook
│       └── useAuthModalState.ts    # Auth modal state hook
├── store/
│   └── useAuthStore.ts            # Zustand store for auth state
└── types/
    └── supabase/
        └── auth.ts                # TypeScript types for auth
```

## Implementation

### Authentication Configuration

The `AUTH_CONFIG` module centralizes authentication-related configuration settings:

```typescript
// src/lib/auth/config.ts
export const AUTH_CONFIG = {
  // Delays for state transitions (longer in production for stability)
  stateTransitionDelay: import.meta.env.PROD ? 300 : 200,
  
  // Retry intervals for init and token operations
  retryDelay: import.meta.env.PROD ? 6000 : 4000,
  tokenExchangeRetryDelay: 1500,
  
  // Timeout for user fetch operations
  userFetchTimeout: 8000,
  
  // Maximum number of retries for various operations
  maxInitRetries: 3,
  maxTokenExchangeRetries: 3,
  maxUserFetchRetries: 3,
  
  // Session duration settings
  sessionDuration: 60 * 60 * 24 * 7, // 7 days in seconds
};
```

This configuration makes it easy to tune authentication behaviors for different environments and provides optimized settings for tab switching scenarios.

### Authentication Provider

The `AuthProvider` component initializes authentication services and handles tab visibility:

```typescript
// src/components/Auth/AuthProvider.tsx
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { initialize, error, status, isSessionLoading, isUserDataLoading } = useAuthStore();
  const { initializeSDK } = useGoogleAuthStore();
  // Cache the last known good session
  const lastKnownSessionRef = useRef<any>(null);
  // Track visibility change progress
  const visibilityChangeInProgressRef = useRef(false);
  
  // Initialize authentication on mount with retry mechanism
  useEffect(() => {
    const setupAuth = async () => {
      try {
        await initialize();
        logger.info('AuthProvider: Authentication initialization completed');
      } catch (err) {
        logger.error('AuthProvider: Authentication initialization failed', err);
        // Retry after delay if initialization fails
        setTimeout(() => {
          initialize().catch(retryErr => {
            logger.error('AuthProvider: Retry authentication initialization failed', retryErr);
          });
        }, AUTH_CONFIG.retryDelay);
      }
    };
    setupAuth();
  }, [initialize, initializeSDK]);
  
  // Cache session when it changes
  useEffect(() => {
    const authState = useAuthStore.getState();
    if (authState.session) {
      lastKnownSessionRef.current = authState.session;
      logger.debug('Updated cached session reference');
    }
  }, [useAuthStore.getState().session]);
  
  // Handle tab visibility changes with debouncing and error recovery
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = async () => {
      if (!document.hidden && !visibilityChangeInProgressRef.current) {
        visibilityChangeInProgressRef.current = true;
        
        debounceTimeout = setTimeout(async () => {
          try {
            const currentState = useAuthStore.getState();
            
            // Skip if auth operations are in progress
            if (currentState.isSessionLoading || currentState.isUserDataLoading) {
              return;
            }
            
            // Handle different auth states appropriately
            if (currentState.status === 'ERROR' && currentState.session) {
              // Attempt recovery from error state
              logger.debug('Attempting to recover from error state on tab visibility change');
              // Trigger session refresh by temporarily clearing and restoring
              currentState.setSession(null);
              setTimeout(() => currentState.setSession(currentState.session), 100);
            }
          } catch (err) {
            logger.error('Error handling tab visibility change:', err);
          } finally {
            visibilityChangeInProgressRef.current = false;
          }
        }, 500);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, []);
  
  return <>{children}</>;
};
```

### Authentication State Management

The authentication state is managed through a Zustand store in `src/store/useAuthStore.ts`:

```typescript
import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../lib/supabase';

export type AuthStatus = 
  | 'INITIAL'      // Initial state before any auth check
  | 'LOADING'      // Auth check in progress
  | 'AUTHENTICATED' // User is authenticated
  | 'UNAUTHENTICATED' // User is not authenticated
  | 'ERROR';       // Auth error occurred

interface AuthState {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  error: string | null;
  lastError: Error | null;
  
  // Specific loading states for better UX
  isSessionLoading: boolean;
  isUserDataLoading: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User; session: Session } | undefined>;
  signUpWithEmail: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; } | null>;
  signOut: () => Promise<void>;
  resetError: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, token: string) => Promise<{ user: User | null; session: Session | null; } | null>;
  
  // Direct state setters for auth callbacks
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  
  // Computed helpers
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  hasInitialized: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
    
    try {
      set({ 
        status: 'LOADING', 
        error: null,
        isSessionLoading: true,
        isUserDataLoading: false
      });
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      set({ isSessionLoading: false });
      
      if (!session) {
        set({ 
          status: 'UNAUTHENTICATED',
          user: null,
          session: null,
          isUserDataLoading: false
        });
        return;
      }
      
      // Session found, get user data with retry logic
      set({ session, isUserDataLoading: true });
      
      const user = await getCurrentUser(AUTH_CONFIG.maxUserFetchRetries);
      
      if (user) {
        set({ 
          user,
          status: 'AUTHENTICATED',
          error: null,
          isUserDataLoading: false
        });
      } else {
        set({ 
          user: null,
          session: null,
          status: 'UNAUTHENTICATED',
          error: 'Unable to retrieve user data',
          isUserDataLoading: false
        });
      }
    } catch (error) {
      set({ 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Authentication initialization failed',
        lastError: error instanceof Error ? error : new Error('Unknown error'),
        isSessionLoading: false,
        isUserDataLoading: false
      });
    }
  },
  
  // ... other methods
}));
```

### Enhanced getCurrentUser Function

The `getCurrentUser` function in `src/lib/supabase.ts` has been enhanced with comprehensive retry logic and caching:

```typescript
// Cache for user data to improve resilience
let lastKnownUserCache: any = null;
let lastUserFetchTime = 0;
const USER_CACHE_TTL = 30 * 1000; // 30 seconds

export const getCurrentUser = async (retryCount = AUTH_CONFIG.maxUserFetchRetries) => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Check for recent cached user data
  const now = Date.now();
  const isRecentCache = (now - lastUserFetchTime) < USER_CACHE_TTL;
  
  if (lastKnownUserCache && isRecentCache && !document.hidden) {
    logger.debug('Using cached user data (visible tab with recent cache)');
    return lastKnownUserCache;
  }
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // Return stale cache on first attempt while fetching fresh data
      if (attempt === 0 && lastKnownUserCache && !document.hidden) {
        logger.debug('Using stale cached user data while fetching fresh data');
        // Schedule background refresh
        setTimeout(() => {
          supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
              lastKnownUserCache = data.user;
              lastUserFetchTime = Date.now();
            }
          }).catch(err => logger.debug('Background refresh failed (non-critical):', err));
        }, 0);
        return lastKnownUserCache;
      }
      
      // Use environment-appropriate timeouts
      const timeoutMs = document.hidden ? 8000 : (import.meta.env.PROD ? 5000 : 3000);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User fetch timeout')), timeoutMs);
      });
      
      const userPromise = supabase.auth.getUser();
      const result = await Promise.race([userPromise, timeoutPromise]) as { data: { user: any }, error?: any };
      
      if (result?.error) throw result.error;
      
      if (!result?.data?.user) {
        if (lastKnownUserCache) {
          logger.debug('Using cached user data as fallback for missing user');
          return lastKnownUserCache;
        }
        
        if (attempt < retryCount) {
          const backoffTime = Math.min(Math.pow(1.5, attempt) * 500, 2000);
          await delay(backoffTime);
          continue;
        }
        return null;
      }
      
      // Cache successful result
      lastKnownUserCache = result.data.user;
      lastUserFetchTime = Date.now();
      
      return result.data.user;
    } catch (error) {
      logger.warn(`Error getting current user (attempt ${attempt + 1}/${retryCount + 1}):`, error);
      
      // Use cached data as fallback on errors
      if (lastKnownUserCache && (attempt === retryCount || document.hidden)) {
        logger.debug('Using cached user data after error (final fallback)');
        return lastKnownUserCache;
      }
      
      if (attempt < retryCount) {
        const backoffTime = Math.min(Math.pow(1.5, attempt) * 500, 2000);
        await delay(backoffTime);
      } else {
        if (lastKnownUserCache) {
          logger.debug('All retries failed, using cached user data as final fallback');
          return lastKnownUserCache;
        }
        return null;
      }
    }
  }
  
  return null;
};
```

## Tab Visibility Solution

We've implemented a comprehensive multi-layered approach to handle authentication persistence when switching between browser tabs, addressing the common issue where users would be logged out when switching tabs:

### Architecture

The tab visibility solution uses several techniques to maintain session state:

1. **Session Reference Caching**: 
   - The `AuthProvider` component maintains a reference to the last known good session
   - This reference is used to restore session state when a tab becomes visible again
   - Implementation using React's `useRef` hook preserves session data between renders

2. **User Data Caching**:
   - In-memory cache for user data with a configurable TTL (30 seconds)
   - Avoids unnecessary API calls when switching tabs
   - Provides fallback data when network requests fail
   - Background refresh mechanism for stale data

3. **Visibility Event Handler**:
   - Listens to the browser's `visibilitychange` event with debouncing
   - Refreshes authentication state when a tab becomes visible again
   - Includes focus event as backup for browser compatibility
   - Prevents race conditions with ongoing auth operations

4. **Enhanced Storage Implementation**:
   - Customized Supabase storage adapter that prioritizes valid sessions
   - Handles edge cases for background tabs and token refreshes
   - Respects user preferences for "Remember Me" functionality
   - Conservative session expiry handling

5. **Token Refresh Optimization**:
   - Special handling for background tabs during token refreshes
   - Retry logic with exponential backoff for failed refresh attempts
   - Fallback to cached data when refreshes fail
   - Longer timeouts for token refresh operations

6. **Error Recovery Mechanisms**:
   - Automatic recovery attempts after auth state change errors
   - Conservative error handling that preserves existing sessions
   - Graceful degradation when network requests fail

### Implementation Details

The solution is implemented across several key files:

1. **AuthProvider.tsx**: Tab visibility handling with debouncing and error recovery
2. **supabase.ts**: Enhanced storage implementation and user data caching
3. **useAuthStore.ts**: Robust auth state management with retry logic
4. **config.ts**: Environment-optimized timeout and retry configurations

### Key Features

- **Debounced Visibility Changes**: Prevents rapid-fire auth checks during tab switching
- **Progressive Fallbacks**: Multiple layers of fallback data (cache, session, recovery)
- **Environment Awareness**: Different timeouts and behaviors for development vs production
- **Background Tab Optimization**: Reduced API calls and longer timeouts for hidden tabs
- **Conservative Session Handling**: Prefers to maintain sessions rather than force logout
- **Comprehensive Logging**: Detailed logging for debugging tab switching issues

## Troubleshooting

### Common Issues and Solutions

1. **OTP Not Received**:
   - Check spam/junk folders
   - Verify email address is correct
   - Check Supabase logs for delivery issues
   - Try resending the OTP

2. **Invalid OTP Error**:
   - Ensure the code is entered correctly
   - Check for spaces or special characters
   - Verify the code hasn't expired
   - Try requesting a new code

3. **Session Issues**:
   - Clear browser cookies/cache
   - Check for proper session handling
   - Verify Supabase configuration

4. **OAuth Errors**:
   - Check OAuth provider configuration
   - Verify redirect URLs are correct
   - Ensure provider credentials are valid

5. **Password Reset Links Not Working**:
   - Check link expiration
   - Verify correct redirect URL configuration
   - Ensure link is opened in same browser as request

6. **Authentication Lost When Switching Tabs**:
   - Verify the latest codebase with enhanced tab visibility handling is deployed
   - Check browser console for auth-related errors during tab switching
   - Ensure network connectivity when tab becomes visible again
   - Try refreshing the page if session restoration fails
   - Check that `visibilitychange` event listener is properly registered

7. **Remember Me Not Working**:
   - Ensure user preferences are correctly saved in localStorage
   - Check localStorage access/permissions
   - Verify the custom storage implementation in Supabase client
   - Check browser settings for localStorage restrictions

8. **getCurrentUser Function Errors**:
   - Check network connectivity and Supabase service status
   - Verify auth configuration timeouts are appropriate for your environment
   - Look for cached user data being used as fallback
   - Check browser console for retry attempts and timeout errors

## Future Considerations

While our current client-side authentication implementation with enhanced tab visibility handling meets our immediate needs, it's worth noting that Supabase is evolving toward server-side authentication approaches:

> **Future Migration Note**: Consider migrating to Supabase's server-side authentication approach using the `@supabase/ssr` package if transitioning to a server-rendered framework (like Next.js). The server-side approach offers improved security by using HTTP-only cookies instead of localStorage and provides better integration with server components.

This migration would be appropriate when:
- Moving to a server-rendered framework like Next.js, SvelteKit, etc.
- Looking to improve security by using HTTP-only cookies instead of localStorage
- Needing to access authentication data directly in server components

### Server-Side Authentication Benefits

1. **Enhanced Security**: 
   - HTTP-only cookies cannot be accessed by JavaScript, protecting against XSS attacks
   - Reduced risk of token theft compared to localStorage

2. **Improved Performance**:
   - Authentication can be verified on the server before sending data to the client
   - Eliminates "flickering" issues when authentication state loads

3. **Better Integration**:
   - Direct access to authentication data in server components
   - Simplified data fetching with authenticated requests

### Migration Approach

If migrating to a server-rendered framework, follow these steps:

1. Install `@supabase/ssr` package instead of the client-side SDK
2. Implement cookie-based session handling
3. Set up middleware for automatic session refresh
4. Update authentication logic to use server components/actions where appropriate
5. Modify client components to work with the server-authenticated state

## Password Security Features

The GraffitiSOFT authentication system includes comprehensive password security features to protect user accounts:

### Password Management Hook

The `usePasswordManagement` hook provides a centralized way to handle password-related operations:

```typescript
// src/hooks/auth/usePasswordManagement.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { validatePassword, checkPasswordStrength, verifyCurrentPassword } from '../../utils/passwordUtils';
import { PasswordStrength } from '../../components/Auth/PasswordStrengthMeter';
import { refreshSessionAfterSensitiveOperation } from '../../lib/auth/sessionUtils';

export const usePasswordManagement = ({ userEmail }: UsePasswordManagementProps = {}): UsePasswordManagementReturn => {
  // State management for password fields, visibility, validation, and feedback
  // ...
  
  // Change password with current password verification and session refresh
  const changePassword = useCallback(async () => {
    if (!validateForm()) {
      return false;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Verify current password
      if (!userEmail) {
        throw new Error('User email not available');
      }
      
      const isCurrentPasswordValid = await verifyCurrentPassword(userEmail, currentPassword);
      
      if (!isCurrentPasswordValid) {
        setPasswordError('Current password is incorrect');
        return false;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      // Refresh session after password change for enhanced security
      await refreshSessionAfterSensitiveOperation();
      
      // Reset form and show success message
      // ...
      
      return true;
    } catch (error) {
      setPasswordError(error.message || 'Error changing password');
      return false;
    } finally {
      setIsChangingPassword(false);
    }
  }, [/* dependencies */]);
  
  // Other password management functions
  // ...
  
  return {
    // Password states, validation results, and methods
    // ...
  };
};
```

This hook encapsulates all password-related functionality, making it easy to implement consistent password management across the application.

### Enhanced Session Security

After sensitive operations like password changes, the application refreshes the user's session to enhance security:

```typescript
// src/lib/auth/sessionUtils.ts
export const refreshSessionAfterSensitiveOperation = async (): Promise<boolean> => {
  try {
    console.info('Refreshing session after sensitive operation');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
    
    if (data.session) {
      // Update auth store with new session
      const authStore = useAuthStore.getState();
      authStore.setSession(data.session);
      console.info('Session successfully refreshed after sensitive operation');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Exception refreshing session:', error);
    return false;
  }
};
```

This session refresh rotates tokens after password changes, reducing the risk of session hijacking.

### Secure Sign-Out

The application implements a secure sign-out process that properly cleans up sensitive data:

```typescript
export const secureSignOut = async (): Promise<boolean> => {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error during sign-out:', error);
      return false;
    }
    
    // Clear auth store and session data
    const authStore = useAuthStore.getState();
    authStore.clearSession();
    
    // Clear any session storage items that may contain sensitive data
    sessionStorage.clear();
    
    // Clear sensitive data from localStorage
    const sensitiveKeys = [
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'supabase.auth.user',
      'userSession',
      'authUser'
    ];
    
    sensitiveKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Exception during secure sign-out:', error);
    return false;
  }
};
```

### Password Validation

The application enforces strong password requirements:

```typescript
// src/utils/passwordUtils.ts
export const validatePassword = (password: string): ValidationResult => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must include at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must include at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must include at least one number' };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, message: 'Password must include at least one special character' };
  }
  
  return { isValid: true };
};
```

### Password Strength Feedback

The `PasswordStrengthMeter` component provides visual feedback about password strength:

```tsx
// Usage in a form
{newPassword && (
  <div className="mt-2">
    <PasswordStrengthMeter strength={passwordStrength} />
    
    {/* Password requirements checklist */}
    <div className="mt-2 space-y-1 text-sm">
      <div className={`flex items-center ${requirements.minLength ? 'text-green-500' : 'text-gray-400'}`}>
        <CheckIcon className="w-4 h-4 mr-1" />
        <span>At least 8 characters</span>
      </div>
      <div className={`flex items-center ${requirements.hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
        <CheckIcon className="w-4 h-4 mr-1" />
        <span>At least 1 uppercase letter</span>
      </div>
      {/* Other requirements */}
    </div>
  </div>
)}
```

### Security Audit Logging

Security-relevant events are logged to the `security_audit_log` table:

```sql
CREATE TABLE "security_audit_log" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);
```

This enables monitoring of sensitive operations like password changes, login attempts, and account creations.