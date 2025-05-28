# Implementation Plan: Addressing Auth State Warning Messages

Based on my analysis of the documentation and the project layout, here's a detailed implementation plan to address the warning messages related to auth state changes.

## Configuration Setup ✅ COMPLETED

First, we'll establish a configuration module to centralize timeout values and other settings. This will make our implementation more maintainable and allow for environment-specific adjustments.

```typescript
// In src/lib/auth/config.ts

/**
 * Auth configuration settings for timeouts and delays
 * Values are optimized for different environments
 */
export const AUTH_CONFIG = {
  // Delays for state transitions (longer in production for stability)
  stateTransitionDelay: import.meta.env.PROD ? 200 : 100,
  
  // Retry intervals for init and token operations
  retryDelay: import.meta.env.PROD ? 5000 : 3000,
  tokenExchangeRetryDelay: 1000,
  
  // Timeout for user fetch operations
  userFetchTimeout: 4000,
  
  // Maximum number of retries for various operations
  maxInitRetries: 2,
  maxTokenExchangeRetries: 2,
  maxUserFetchRetries: 2,
  
  // Session duration settings
  sessionDuration: 60 * 60 * 24 * 7, // 7 days in seconds
};

export default AUTH_CONFIG;
```

## Implementation Plan: Addressing Auth State Warning Messages

### 1. Add Loading State to `useAuthStore`  ✅ COMPLETED

The current implementation is missing a dedicated loading state for user data fetching. We should enhance the state management to track both session and user loading states separately.

```typescript
// In src/store/useAuthStore.ts
import AUTH_CONFIG from '../lib/auth/config';

// Modify the AuthState type
type AuthState = {
  // ... existing properties
  
  // Add specific loading states
  isSessionLoading: boolean;
  isUserDataLoading: boolean;
  
  // ... existing properties
};

// Update the initial state
const useAuthStore = create<AuthState>((set, get) => ({
  // ... existing state
  isSessionLoading: false,
  isUserDataLoading: false,
  
  // Modify initialize function
  initialize: async () => {
    // Only initialize if we're in the initial state to prevent duplicate initializations
    if (get().status !== 'INITIAL' && get().status !== 'ERROR') {
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
  
  // Update isLoading helper function
  isLoading: () => {
    const state = get();
    return state.status === 'LOADING' || state.isSessionLoading || state.isUserDataLoading;
  },
  
  // ... rest of the store implementation
}));
```

### 2. Enhance Error Handling in `useEmailVerification.ts`✅ COMPLETED

The current implementation has some issues when handling errors and asynchronous operations. We'll also implement the recommended Supabase approach for email verification links to address the issue of email scanners invalidating tokens.

```typescript
// In src/hooks/auth/useEmailVerification.ts
import AUTH_CONFIG from '../../lib/auth/config';

// Add a safe link redirect handler for email verification
// This creates an intermediary step to protect against email scanners
const createSafeVerificationLink = (originalLink: string): string => {
  // Instead of directly using the token in the URL, create a redirect
  const encodedLink = encodeURIComponent(originalLink);
  return `${window.location.origin}/auth/verify-redirect?link=${encodedLink}`;
};

// Then implement a VerifyRedirect component that handles the redirection safely
// This would go in src/pages/auth/VerifyRedirect.tsx
// The component would:
// 1. Extract the encoded link from URL params
// 2. Store it in sessionStorage
// 3. Show a button for the user to click to complete verification
// 4. Only when clicked, use the stored token to complete verification

// Improve error handling in checkForVerification
const checkForVerification = async () => {
  // ... existing code for parsing URL params
  
  // Check if this is our custom verification request
  if (tokenFromSearch && (typeFromSearch === 'verification' || typeFromSearch === 'signup') && emailFromSearch) {
    logger.info('Detected CUSTOM verification parameters in SEARCH URL');
    setIsVerifying(true);
    setVerificationEmail(emailFromSearch);
    setVerificationError(null); // Reset any previous errors
    
    try {
      // Save email for login form in case they need to sign in manually later
      setLastUsedEmail(emailFromSearch);
      setRememberMe(true);
      
      // Enhanced error handling with retries for token exchange
      let success = false;
      let attempts = 0;
      const maxAttempts = AUTH_CONFIG.maxTokenExchangeRetries;
      
      while (!success && attempts < maxAttempts) {
        attempts++;
        try {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(tokenFromSearch);
          
          if (sessionError) {
            logger.warn(`Token exchange attempt ${attempts} failed:`, sessionError);
            
            if (attempts < maxAttempts) {
              // Wait before retry using configured timeout
              await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.tokenExchangeRetryDelay));
              continue;
            }
            
            // If all attempts fail, try fallback method
            logger.error('Error exchanging code for session, falling back to verifyOtp:', sessionError);
            
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: tokenFromSearch,
              type: 'signup'
            });
            
            if (verifyError) {
              logger.error('Error verifying email with verifyOtp:', verifyError);
              throw verifyError;
            }
          }
          
          success = true;
          logger.info('Email verified successfully!');
        } catch (exchangeError) {
          if (attempts >= maxAttempts) {
            logger.error('Failed to exchange token after multiple attempts:', exchangeError);
            throw exchangeError;
          }
          // Continue to next attempt
        }
      }
      
      // Use a more robust approach to refresh the auth state
      const authStore = useAuthStore.getState();
      
      // Clear auth state first to ensure a clean reload
      authStore.setUser(null);
      
      // Wait a moment for auth state to clear - use configured delay
      await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.stateTransitionDelay));
      
      // Then reinitialize auth
      await authStore.initialize();
      
      // Check if the user is authenticated after initialization
      const { user, status } = useAuthStore.getState();
      logger.info('Auth state after verification:', { status, hasUser: !!user });
      
      // Clear verification state now that user is verified
      setVerificationEmail(null);
      setPendingVerification(false);
      clearAllVerificationState();
      
      // Show success modal - don't show sign-in modal
      setShowVerificationModal(true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Exception during verification:', errorMessage);
      setVerificationError(errorMessage);
      
      // Reset verification state on error
      setPendingVerification(false);
    } finally {
      setIsVerifying(false);
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/');
    }
  }
};
```

### 3. Refactor Auth Initialization in `AuthProvider.tsx`✅ COMPLETED

Update the auth provider to handle state transitions more gracefully and use the configurable timeout values:

```typescript
// In src/components/Auth/AuthProvider.tsx
import AUTH_CONFIG from '../../lib/auth/config';

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { initialize, error, status, isSessionLoading, isUserDataLoading } = useAuthStore();
  const { initializeSDK } = useGoogleAuthStore();
  
  // Initialize authentication on mount
  useEffect(() => {
    logger.info('AuthProvider: Starting authentication services');
    
    const setupAuth = async () => {
      // Initialize Google SDK in parallel (non-blocking)
      if (window.isSecureContext) {
        initializeSDK().catch(err => 
          logger.warn('Non-critical Google SDK initialization error:', err)
        );
      }
      
      // Initialize authentication with enhanced error handling
      try {
        await initialize();
        logger.info('AuthProvider: Authentication initialization completed');
      } catch (err) {
        // Errors are already handled in the store
        logger.error('AuthProvider: Authentication initialization failed', err);
        
        // Add recovery mechanism - retry initialization after a delay if it failed
        setTimeout(() => {
          logger.info('AuthProvider: Retrying authentication initialization');
          initialize().catch(retryErr => {
            logger.error('AuthProvider: Retry authentication initialization failed', retryErr);
          });
        }, AUTH_CONFIG.retryDelay);
      }
    };
    
    setupAuth();
  }, [initialize, initializeSDK]);
  
  // Add detailed logging for loading states
  useEffect(() => {
    if (isSessionLoading) {
      logger.debug('AuthProvider: Session loading in progress');
    }
    if (isUserDataLoading) {
      logger.debug('AuthProvider: User data loading in progress');
    }
  }, [isSessionLoading, isUserDataLoading]);
  
  // Log errors but don't block rendering
  useEffect(() => {
    if (error) {
      logger.error('AuthProvider: Authentication error:', error);
    }
  }, [error]);
  
  // Log status changes with more context
  useEffect(() => {
    logger.debug('AuthProvider: Auth status changed to', status, {
      isSessionLoading,
      isUserDataLoading
    });
  }, [status, isSessionLoading, isUserDataLoading]);
  
  // Render children without waiting for auth to complete
  return <>{children}</>;
};
```

### 4. Update Supabase Auth Event Handling✅ COMPLETED

Improve the auth state change handler in `supabase.ts`, using direct store imports:

```typescript
// In src/lib/supabase.ts
import AUTH_CONFIG from './auth/config';
import useAuthStore from '../store/useAuthStore';

// Create a more robust auth event handler
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  logger.info('Auth event:', event);
  
  // Handle session state changes
  if (event === 'SIGNED_IN') {
    logger.info('User signed in:', session?.user?.email);
    
    // Important: Fetch user data immediately after sign-in
    // This helps prevent the "session but no user data" warning
    if (session?.user?.id) {
      setTimeout(async () => {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (error) {
            logger.error('Error fetching user data after sign-in:', error);
            return;
          }
          
          if (data?.user) {
            // Direct access to the store
            useAuthStore.getState().setUser(data.user);
            logger.debug('Updated user data after auth state change');
          }
        } catch (err) {
          logger.error('Exception fetching user data after sign-in:', err);
        }
      }, AUTH_CONFIG.stateTransitionDelay);
    }
  } else if (event === 'SIGNED_OUT') {
    logger.info('User signed out');
  } else if (event === 'PASSWORD_RECOVERY') {
    logger.info('Password recovery flow initiated');
  } else if (event === 'TOKEN_REFRESHED') {
    logger.debug('Auth token refreshed');
    
    // After token refresh, update user data
    setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          // Direct access to the store
          useAuthStore.getState().setUser(data.user);
          logger.debug('Updated user data after token refresh');
        }
      } catch (err) {
        logger.error('Failed to update user data after token refresh:', err);
      }
    }, AUTH_CONFIG.stateTransitionDelay);
  } else if (event === 'USER_UPDATED') {
    logger.info('User data updated');
  }
});
```

### 5. Improve `getCurrentUser` Function with Retry Logic✅ COMPLETED

Enhance the `getCurrentUser` function in `supabase.ts` to handle transient errors and use configurable timeout values:

```typescript
// In src/lib/supabase.ts
import AUTH_CONFIG from './auth/config';

export const getCurrentUser = async (retryCount = AUTH_CONFIG.maxUserFetchRetries) => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User fetch timeout')), AUTH_CONFIG.userFetchTimeout);
      });
      
      const userPromise = supabase.auth.getUser();
      
      // Race between the actual request and the timeout
      const result = await Promise.race([userPromise, timeoutPromise]) as { data: { user: any } };
      
      if (!result?.data?.user) {
        logger.debug(`No user found in getCurrentUser (attempt ${attempt + 1}/${retryCount + 1})`);
        
        if (attempt < retryCount) {
          // Exponential backoff
          const backoffTime = Math.pow(2, attempt) * 500;
          logger.debug(`Retrying getCurrentUser in ${backoffTime}ms`);
          await delay(backoffTime);
          continue;
        }
        return null;
      }
      
      logger.debug('Successfully retrieved current user');
      return result.data.user;
    } catch (error) {
      logger.error(`Error getting current user (attempt ${attempt + 1}/${retryCount + 1}):`, error);
      
      if (attempt < retryCount) {
        // Exponential backoff
        const backoffTime = Math.pow(2, attempt) * 500;
        logger.debug(`Retrying getCurrentUser in ${backoffTime}ms`);
        await delay(backoffTime);
      } else {
        return null;
      }
    }
  }
  
  return null;
};
```

### 6. Create Email Verification Redirect Component✅ COMPLETED

As mentioned in section 2, we need to implement a redirect component to protect against email scanners:

```typescript
// In src/pages/auth/VerifyRedirect.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Card, Text, Heading, Flex, Box } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import AUTH_CONFIG from '../../lib/auth/config';
import logger from '../../lib/logger';

const VerifyRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Get the encoded verification link from URL params
  const encodedLink = searchParams.get('link');
  const decodedLink = encodedLink ? decodeURIComponent(encodedLink) : null;
  
  // Extract the token from the decoded link
  const getTokenFromLink = (link: string | null) => {
    if (!link) return null;
    
    try {
      const url = new URL(link);
      return url.searchParams.get('token') || url.hash.match(/token=([^&]*)/)?.[1] || null;
    } catch (err) {
      logger.error('Failed to parse verification link:', err);
      return null;
    }
  };
  
  // Store token in state only, not in sessionStorage, for security
  const [token, setToken] = useState<string | null>(null);
  
  // Extract token from URL only once on component mount
  useEffect(() => {
    const extractedToken = decodedLink ? getTokenFromLink(decodedLink) : null;
    if (extractedToken) {
      setToken(extractedToken);
    }
  }, [decodedLink]);
  
  // Handle manual verification click
  const handleVerify = async () => {
    if (!token) {
      setError('Invalid verification link. Please try again or request a new link.');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      // Use the retry logic for token exchange
      let success = false;
      let attempts = 0;
      const maxAttempts = AUTH_CONFIG.maxTokenExchangeRetries;
      
      while (!success && attempts < maxAttempts) {
        attempts++;
        try {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(token);
          
          if (sessionError) {
            logger.warn(`Token exchange attempt ${attempts} failed:`, sessionError);
            
            if (attempts < maxAttempts) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.tokenExchangeRetryDelay));
              continue;
            }
            
            throw sessionError;
          }
          
          success = true;
          logger.info('Email verified successfully!');
        } catch (exchangeError) {
          if (attempts >= maxAttempts) {
            logger.error('Failed to exchange token after multiple attempts:', exchangeError);
            throw exchangeError;
          }
        }
      }
      
      if (success) {
        // Initialize auth state after successful verification
        await useAuthStore.getState().initialize();
        navigate('/auth/verification-success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Exception during verification:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };
  
  if (!token) {
    return (
      <Card padding="lg">
        <Heading>Invalid Verification Link</Heading>
        <Text color="error">The verification link appears to be invalid. Please try again or request a new verification email.</Text>
      </Card>
    );
  }
  
  return (
    <Card padding="lg">
      <Flex direction="column" gap="md" align="center">
        <Heading>Complete Your Email Verification</Heading>
        <Text>
          To protect your security, please click the button below to complete the email verification process.
        </Text>
        {error && (
          <Box padding="sm" backgroundColor="errorLight" borderRadius="md">
            <Text color="error">{error}</Text>
          </Box>
        )}
        <Button 
          onClick={handleVerify} 
          isLoading={isVerifying} 
          loadingText="Verifying..."
          disabled={isVerifying}
          variant="primary"
          size="lg"
        >
          Complete Verification
        </Button>
      </Flex>
    </Card>
  );
};

export default VerifyRedirect;
```

### 7. Enhance Auth Event Handler with Stale Token Recovery✅ COMPLETED

Add explicit handling for stale refresh tokens in the auth event handler to ensure users aren't stuck in a broken authentication state:

```typescript
// In src/lib/supabase.ts - extend the auth event handler
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  // ... existing event handler code ...
  
  // Add explicit handling for token refresh failures
  if (event === 'TOKEN_REFRESH_FAILED') {
    logger.warn('Token refresh failed, forcing user to re-authenticate');
    
    // Get access to the auth store
    const authStore = useAuthStore.getState();
    
    // Clear the user and session data
    authStore.setUser(null);
    authStore.setSession(null);
    authStore.setStatus('UNAUTHENTICATED');
    
    // Show a user-friendly notification
    // If you have a toast/notification system, use it here
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('auth:session-expired', {
        detail: {
          message: 'Your session has expired. Please sign in again.'
        }
      }));
    }
    
    logger.info('User was signed out due to expired refresh token');
  }
});

// Then in your application's main component or notification system:
useEffect(() => {
  const handleSessionExpired = (event: CustomEvent) => {
    // Show a notification to the user using your UI system
    showNotification({
      type: 'info',
      title: 'Session Expired',
      message: event.detail.message
    });
  };
  
  window.addEventListener('auth:session-expired', handleSessionExpired as EventListener);
  
  return () => {
    window.removeEventListener('auth:session-expired', handleSessionExpired as EventListener);
  };
}, []);
```

### 8. Implement Protected Route Component

Add a `ProtectedRoute` component to secure routes that require authentication:

```typescript
// In src/components/Auth/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Spinner } from '../../components/ui';
import logger from '../../lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * A component that protects routes which require authentication.
 * Redirects to login if user is not authenticated.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/auth/login',
  fallback = <Spinner size="lg" centered />
}) => {
  const { status, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    if (!isLoading() && status !== 'AUTHENTICATED') {
      logger.info('Access to protected route denied, redirecting to login', {
        path: location.pathname,
        authStatus: status
      });
      
      // Include the return path so user can be redirected back after login
      const returnPath = encodeURIComponent(location.pathname + location.search);
      navigate(`${redirectTo}?returnTo=${returnPath}`);
    }
  }, [status, isLoading, navigate, redirectTo, location]);
  
  // Show loading state while checking authentication
  if (isLoading()) {
    return <>{fallback}</>;
  }
  
  // Only render the protected content if authenticated
  return status === 'AUTHENTICATED' ? <>{children}</> : null;
};

export default ProtectedRoute;

// Usage example:
// <Route 
//   path="/dashboard" 
//   element={
//     <ProtectedRoute>
//       <Dashboard />
//     </ProtectedRoute>
//   } 
// />
```

## Implementation Strategy

1. Create the `AUTH_CONFIG` module in `src/lib/auth/config.ts` ✅ COMPLETED
2. Update the loading state in `useAuthStore.ts` to use the config values  ✅ COMPLETED
3. Implement the `VerifyRedirect` component for email verification with in-memory token storage
4. Enhance error handling in `useEmailVerification.ts` with the configurable values
5. Update the auth provider in `AuthProvider.tsx` to use the config values
6. Implement the `ProtectedRoute` component for securing authenticated routes
7. Modify the auth event handler in `supabase.ts` to handle stale tokens and use direct imports
8. Improve the `getCurrentUser` function with the configurable retry logic

Test each change thoroughly before moving to the next step. Pay special attention to the authentication flow, particularly during sign-in, sign-up, and session restoration to ensure the warning messages are eliminated.

These changes will significantly reduce or eliminate the "Auth state change with session but no user data" warnings by ensuring proper loading states and better synchronization between session and user data.

## Testing Considerations

### 1. Comprehensive Authentication Flow Testing

Test each of these scenarios thoroughly:

- **Fresh Sign-Up and Verification**
  - Register a new email
  - Verify the email via verification link
  - Ensure user is properly logged in after verification
  - Test the new verification redirect flow

- **Sign-In/Sign-Out Cycles**
  - Test multiple sign-in/sign-out cycles in sequence
  - Verify user data is properly cleared on sign-out
  - Verify session restoration works after browser refresh

- **Password Reset Flow**
  - Test password reset request
  - Verify the reset link works properly
  - Reset password and verify login with new credentials

- **Token Refresh**
  - Test that sessions properly refresh when tokens expire
  - Verify user remains logged in across token refreshes

### 2. Network Condition Testing

- **Slow Network Testing**
  - Use browser devtools to simulate slow 3G connections
  - Verify that retry mechanisms work properly under high latency
  - Test that timeout periods are adequate for slow connections
  - Ensure the new email verification redirect approach works even with slow connections

- **Network Interruption**
  - Test authentication during intermittent network failure
  - Verify recovery when network is restored
  - Verify retry logic correctly handles network interruptions

### 3. Cross-Browser Compatibility

- Test in all major browsers (Chrome, Firefox, Safari, Edge)
- Pay special attention to localStorage/sessionStorage behavior differences
- Test on mobile browsers as well as desktop browsers
- Verify that the verification redirect component works across all browsers

### 4. Edge Case Testing

- **Race Condition Testing**
  - Rapidly trigger multiple auth operations
  - Test concurrent auth operations (e.g., sign out in one tab while requesting user data in another)
  - Verify that the state loading flags prevent race conditions

- **Session Expiry**
  - Test behavior when session expires
  - Verify graceful handling of 401 responses
  - Ensure the auth store correctly transitions states when a session expires

- **Email Link Verification Edge Cases**
  - Test clicking verification link after it's already been used
  - Test behavior with malformed verification tokens
  - Test when verification link is clicked after significant delay
  - Verify the new verification redirect approach handles email scanners correctly

### 5. Monitoring Implementation

During testing, enable comprehensive logging to verify the flow:

```typescript
// Add structured logging
const logAuthEvent = (event: string, metadata: Record<string, any> = {}) => {
  logger.info(`Auth Event: ${event}`, {
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Then use throughout the auth flow
logAuthEvent('initialize_start', { status: useAuthStore.getState().status });
logAuthEvent('initialize_complete', { status: useAuthStore.getState().status });
```

### 6. Deployment Testing

Before deploying to production:

- Test the entire authentication flow in a staging environment
- Verify all timeout configurations work correctly in the production build
- Test with real devices and networks, not just emulators or simulators
- Ensure the verification redirect mechanism works with actual email clients that may pre-scan links

By thoroughly testing these scenarios, we can ensure that the authentication flow is robust and provides a smooth user experience even in challenging network conditions or edge cases.
