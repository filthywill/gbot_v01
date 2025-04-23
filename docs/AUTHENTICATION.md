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

## OTP Verification Flow

### OTP Generation and Delivery
1. User signs up with email and password
2. Supabase generates a 6-digit OTP code
3. Code is sent to the user's email address
4. User receives email with verification code

### Code Entry and Validation
1. User enters the code in the verification modal
2. Input supports auto-validation with proper length
3. Code is submitted to Supabase for verification
4. User receives immediate feedback on verification status

### Verification State Persistence
1. Verification state is stored in localStorage
2. State includes email, timestamp, and attempt status
3. 30-minute expiration time for security
4. Verification banner displays when verification is pending
5. Timer shows remaining time for verification
6. Resume button allows reopening the verification modal

### Verification Success Handling
1. Success confirmation is displayed
2. User is automatically signed in
3. Verification state is cleared
4. Banner is hidden
5. Session is established

### Error Handling
1. Invalid codes show clear error messages
2. Network errors are handled gracefully
3. Expired verification shows appropriate message
4. Too many attempts are handled with rate limiting messages

## Password Reset Flow

The password reset process follows these steps:

1. User requests password reset
2. Reset email is sent via Supabase
3. User clicks reset link
4. Password update form is displayed
5. New password is validated and updated

```typescript
// Password reset request
const handleResetPassword = async (email: string) => {
  try {
    await supabase.auth.resetPasswordForEmail(email);
    setResetEmailSent(true);
  } catch (error) {
    handleError(error);
  }
};

// Password update
const handleUpdatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    onPasswordUpdateSuccess();
  } catch (error) {
    handleError(error);
  }
};
```

## Form Validation

The application implements comprehensive form validation:

1. **Email Validation**:
   - Format checking
   - Real-time feedback
   - Debounced validation

2. **Password Validation**:
   - Minimum length
   - Character requirements
   - Password strength meter
   - Match validation for confirmation

```typescript
// Email validation
const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    message: emailRegex.test(email) ? '' : 'Please enter a valid email address'
  };
};

// Password validation
const validatePassword = (password: string): ValidationResult => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  // ... validation logic
};
```

## UI Components

The authentication UI is built with modular components:

1. **AuthModal**: Main authentication interface
2. **AuthHeader**: Navigation and user status
3. **GoogleSignInButton**: OAuth integration
4. **PasswordStrengthMeter**: Password feedback
5. **VerificationCodeInput**: OTP verification interface
6. **VerificationBanner**: Persistent notification

Key features include:
- Responsive design
- Accessible components
- Loading states
- Error handling
- Smooth transitions
- Clear user feedback

## Security Considerations

1. **Password Security**:
   - Strong password requirements
   - Secure password handling
   - Password strength feedback

2. **Session Management**:
   - Secure token storage
   - Automatic session refresh
   - Proper logout handling

3. **Error Handling**:
   - Generic error messages
   - Detailed logging
   - Rate limiting

4. **OTP Security**:
   - 6-digit verification codes
   - 30-minute expiration
   - Limited verification attempts
   - Secure verification process

5. **Data Protection**:
   - Secure storage of preferences
   - Email validation
   - Input sanitization

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