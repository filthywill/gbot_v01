# Authentication System Documentation

This document provides detailed information about the authentication system implemented in GraffitiSOFT using Supabase.

## Overview

The application uses Supabase for authentication with a direct token approach for Google sign-in and email/password authentication. The implementation follows best practices for security, performance, and user experience.

## Architecture

### Core Components

1. **Supabase Client**: Configuration and initialization in `src/lib/supabase.ts`
2. **Auth Store**: State management using Zustand in `src/store/useAuthStore.ts`
3. **Auth Provider**: React context in `src/components/Auth/AuthProvider.tsx`
4. **UI Components**: Modal, header, and authentication buttons

### Authentication Flow

```
┌───────────┐      ┌─────────────┐      ┌─────────────┐
│ Auth UI   │ ───▶ │ Auth Store  │ ───▶ │  Supabase   │
│Components │ ◀─── │ (Zustand)   │ ◀─── │   Client    │
└───────────┘      └─────────────┘      └─────────────┘
                          │                    ▲
                          ▼                    │
                   ┌─────────────┐      ┌─────────────┐
                   │ Auth State  │ ───▶ │ Application │
                   │ Listeners   │      │  Features   │
                   └─────────────┘      └─────────────┘
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
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetError: () => void;
};
```

The store exposes methods for all authentication operations and maintains the current authentication state.

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

// Sign up with email/password
signUpWithEmail: async (email: string, password: string) => {
  // Similar implementation to signInWithEmail
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
    });
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ 
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
});
```

### Auth Provider Component

A React provider component wraps the application to initialize authentication and provide session state:

```typescript
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialize, isLoading } = useAuthStore();
  
  useEffect(() => {
    // Initialize auth state when component mounts
    initialize();
  }, [initialize]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return <>{children}</>;
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

## Optimizations

The authentication implementation includes several performance optimizations:

1. **Memoized Callbacks**: useCallback for event handlers
2. **Single Source of Truth**: Zustand store for state management
3. **Minimal Re-renders**: Efficient state updates and component structure
4. **Proper Cleanup**: All resources properly disposed on unmount
5. **Lazy Loading**: Google SDK loaded dynamically when needed

## Testing Authentication

To test the authentication flow:

1. Set up environment variables with valid Supabase and Google credentials
2. Enable authentication providers in the Supabase dashboard
3. Create test users via the Supabase dashboard or sign-up flow
4. Verify login, logout, and authentication state persistence

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure authorized origins in Google Cloud match your application URL
2. **Missing Environment Variables**: Check that all environment variables are properly set
3. **CORS Issues**: Verify Supabase CORS configuration
4. **Token Validation Failures**: Check Google Client ID configuration
5. **Network Errors**: Use browser developer tools to inspect network requests

### Debug Mode

Enable more detailed logging by setting the environment to development mode.

## Future Improvements

1. **Additional Providers**: Support for more OAuth providers (GitHub, Microsoft, etc.)
2. **Two-Factor Authentication**: Enhanced security with 2FA
3. **Role-Based Access Control**: More granular permissions system
4. **Session Management**: UI for managing active sessions
5. **Profile Management**: User profile editing capabilities 