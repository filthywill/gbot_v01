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

## Overview

The GraffitiSOFT authentication system is built on top of Supabase, providing a secure and user-friendly authentication experience. It supports email/password authentication with OTP (One-Time Password) verification, Google OAuth, and comprehensive session management.

The system is designed to be:
- **Secure**: Implements best practices for authentication security
- **User-friendly**: Intuitive flows with proper error handling
- **Responsive**: Works seamlessly across desktop and mobile devices
- **Maintainable**: Well-structured code with clear separation of concerns

## Core Features

- **Email/Password Authentication**: Traditional sign-up and sign-in with email and password
- **OTP Code-based Verification**: Email verification using one-time password codes
- **Google OAuth Integration**: Sign in with Google option
- **Session Management**: Automatic session persistence and refresh
- **Protected Routes**: Route-based access control for authenticated users
- **Password Reset**: Secure password reset flow
- **Responsive Design**: Mobile-friendly authentication forms
- **Form Validation**: Comprehensive input validation with error messaging
- **Error Handling**: User-friendly error messages for authentication failures

## Architecture

### Core Components

1. **Supabase Client**: Handles communication with Supabase Auth API
2. **Auth Stores (Zustand)**: Manages authentication state and operations
3. **Authentication Hooks**: Custom React hooks for auth operations
4. **Auth Components**: UI components for authentication flows
5. **Auth Middleware**: Route protection and session validation
6. **Auth Services**: Helper functions for auth-related operations

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
│   │   ├── AuthContext.tsx        # Authentication context provider
│   │   └── useAuth.ts             # Auth hook for components
│   └── supabase/
│       └── supabase.ts            # Supabase client initialization
├── components/
│   └── Auth/
│       ├── flows/
│       │   ├── SignIn.tsx         # Sign-in form and logic
│       │   ├── SignUp.tsx         # Sign-up form and logic
│       │   ├── VerifyOTP.tsx      # OTP verification component
│       │   └── ResetPassword.tsx  # Password reset flow
│       └── ui/
│           ├── AuthForm.tsx       # Shared form component
│           └── VerificationInput.tsx # OTP input component
├── store/
│   └── useAuthStore.ts            # Zustand store for auth state
├── pages/
│   └── auth/
│       ├── signin.tsx             # Sign-in page
│       ├── signup.tsx             # Sign-up page
│       ├── verify.tsx             # Verification page
│       └── reset-password.tsx     # Password reset page
└── types/
    └── supabase/
        └── auth.ts                # TypeScript types for auth
```

## Implementation

### Supabase Client

The Supabase client is initialized in `src/lib/supabase/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### Authentication State Management

The authentication state is managed through a Zustand store in `src/store/useAuthStore.ts`:

```typescript
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  pendingEmail: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,
  isVerified: false,
  pendingEmail: null,
  
  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({
        user: data.user,
        isAuthenticated: true,
        isVerified: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error as AuthError,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },
  
  signUp: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirect: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;
      
      set({
        pendingEmail: email,
        isLoading: false,
        isAuthenticated: false,
        isVerified: false,
      });
    } catch (error) {
      set({
        error: error as AuthError,
        isLoading: false,
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
        isVerified: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error as AuthError,
        isLoading: false,
      });
    }
  },
  
  verifyOTP: async (email, token) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      
      if (error) throw error;
      
      set({
        user: data.user,
        isAuthenticated: true,
        isVerified: true,
        pendingEmail: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error as AuthError,
        isLoading: false,
      });
    }
  },
  
  resetPassword: async (email) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      set({
        pendingEmail: email,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error as AuthError,
        isLoading: false,
      });
    }
  },
  
  updatePassword: async (password) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) throw error;
      
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error as AuthError,
        isLoading: false,
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
}));
```

## OTP Verification Flow

GraffitiSOFT uses OTP code-based email verification rather than link-based verification. This approach offers several advantages:

- **Better user experience**: Users can verify without switching contexts
- **Reduced friction**: No need to open email client and click links
- **Improved security**: Time-limited codes with expiration
- **Lower abandonment rate**: Streamlined verification process

### OTP Flow Implementation

The OTP verification flow consists of the following steps:

1. **User signs up**: Enters email and password
2. **OTP generation**: System generates a one-time code
3. **Email delivery**: Code is sent to user's email address
4. **Code entry**: User enters code in the verification screen
5. **Verification**: System validates the code
6. **Account activation**: Account is activated upon successful verification

### OTP Verification Code

The sign-up component initiates the OTP flow:

```tsx
// components/Auth/flows/SignUp.tsx
const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      // Handle password mismatch error
      return;
    }
    
    await signUp(email, password);
    navigate('/auth/verify');
  };
  
  // Form JSX
};
```

After sign-up, the user is directed to the verification screen:

```tsx
// components/Auth/flows/VerifyOTP.tsx
const VerifyOTP = () => {
  const [otpCode, setOtpCode] = useState('');
  const { verifyOTP, pendingEmail, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  
  // Redirect if no pending email
  useEffect(() => {
    if (!pendingEmail) {
      navigate('/auth/signin');
    }
  }, [pendingEmail, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail) return;
    
    await verifyOTP(pendingEmail, otpCode);
    navigate('/dashboard');
  };
  
  // Verification form JSX with VerificationCodeInput
};
```

The `VerificationCodeInput` component handles the OTP code entry:

```tsx
// components/Auth/ui/VerificationCodeInput.tsx
interface VerificationCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const VerificationCodeInput = ({
  length = 6,
  value,
  onChange,
  disabled = false,
}: VerificationCodeInputProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);
  
  // Split value into individual characters
  const valueArray = value.split('').slice(0, length);
  
  // Handle input change
  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newChar = e.target.value.slice(-1);
    
    // Create new value array and update
    const newValue = [...valueArray];
    newValue[index] = newChar;
    
    // Call onChange with new string value
    onChange(newValue.join(''));
    
    // Focus next input if value was entered
    if (newChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  // Handle key press
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Focus previous input on backspace
    if (e.key === 'Backspace' && !valueArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    onChange(pastedData);
  };
  
  return (
    <div className="flex gap-2 items-center justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          className="w-12 h-14 text-center text-xl border rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
          value={valueArray[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Verification code digit ${index + 1}`}
        />
      ))}
    </div>
  );
};
```

## Password Reset Flow

The password reset flow follows these steps:

1. **User requests reset**: Enters email on reset password form
2. **Reset email**: System sends email with reset link
3. **Link access**: User clicks link in email
4. **New password entry**: User enters new password
5. **Password update**: System updates password

### Implementation

The password reset request component:

```tsx
// components/Auth/flows/RequestPasswordReset.tsx
const RequestPasswordReset = () => {
  const [email, setEmail] = useState('');
  const { resetPassword, isLoading, error } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(email);
    setIsSubmitted(true);
  };
  
  if (isSubmitted) {
    return (
      <div className="text-center">
        <h2>Check your email</h2>
        <p>We've sent password reset instructions to {email}</p>
      </div>
    );
  }
  
  // Form JSX
};
```

The password update component:

```tsx
// components/Auth/flows/UpdatePassword.tsx
const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { updatePassword, isLoading, error } = useAuthStore();
  const [isUpdated, setIsUpdated] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      // Handle password mismatch
      return;
    }
    
    await updatePassword(password);
    setIsUpdated(true);
  };
  
  if (isUpdated) {
    return (
      <div className="text-center">
        <h2>Password Updated</h2>
        <p>Your password has been successfully updated.</p>
        <Button asChild>
          <Link to="/auth/signin">Sign In</Link>
        </Button>
      </div>
    );
  }
  
  // Form JSX
};
```

## Form Validation

All authentication forms implement comprehensive validation:

1. **Email validation**: Proper email format checking
2. **Password strength**: Minimum length, complexity requirements
3. **Matching validation**: Password and confirm password match
4. **Empty field validation**: Required field checking
5. **Error messaging**: Clear user feedback on validation issues

Example validation implementation:

```tsx
// utils/validation.ts
export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  
  // Check for complexity requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!(hasUpperCase && hasLowerCase && hasNumber)) {
    return 'Password must include uppercase, lowercase, and numbers';
  }
  
  return null;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};
```

## UI Components

The authentication UI is built with reusable components following these principles:

1. **Consistency**: Uniform styling across all auth forms
2. **Responsiveness**: Mobile-friendly layouts
3. **Accessibility**: ARIA attributes and keyboard navigation
4. **Error Visibility**: Clear error presentation
5. **Loading States**: Feedback during async operations

Key components include:

- **AuthLayout**: Consistent layout wrapper for all auth pages
- **AuthForm**: Base form component with standard styling
- **FormField**: Labeled input with validation and error display
- **VerificationCodeInput**: Specialized input for OTP codes
- **PasswordStrengthMeter**: Visual password strength indicator
- **AuthButton**: Styled button with loading state
- **AuthDivider**: "or" divider for alternative auth methods
- **SocialAuthButton**: Button for OAuth providers

## Security Considerations

The authentication system implements several security measures:

1. **Secure Password Storage**: Passwords are hashed and never stored in plaintext
2. **Rate Limiting**: Protection against brute force attacks
3. **Secure Session Management**: HTTP-only cookies for session tokens
4. **OTP Expiry**: Time-limited verification codes
5. **HTTPS**: All auth traffic occurs over secure connections
6. **Input Sanitization**: Protection against injection attacks
7. **CSRF Protection**: Cross-site request forgery mitigation

## Testing

### Testing the OTP Flow

To test the OTP verification flow:

1. **Setup test account**: Create a test email for verification purposes
2. **Sign up**: Complete the sign-up process with test credentials
3. **Check email**: Access the test email inbox to retrieve the OTP code
4. **Verify code**: Enter the code in the verification screen
5. **Confirm success**: Verify successful authentication and redirection

For development and testing, you can view OTP codes in the Supabase Auth logs:

1. Go to the Supabase dashboard
2. Navigate to Authentication → Logs
3. Find the relevant sign-up event
4. The OTP code will be visible in the event details

### Testing Edge Cases

Ensure to test these edge cases:

1. **Invalid OTP**: Entering incorrect verification code
2. **Expired OTP**: Attempting to use expired code
3. **Resending OTP**: Requesting new verification code
4. **Session expiry**: Testing behavior when session expires
5. **Network issues**: Testing with intermittent connectivity
6. **Multiple devices**: Verifying on different device than sign-up

## Supabase Setup

### Configuration

1. **Create Supabase Project**:
   - Sign up at [Supabase](https://supabase.com/)
   - Create a new project
   - Note your project URL and anon key

2. **Configure Auth Settings**:
   - Go to Authentication → Settings
   - Set "Site URL" to your application URL
   - Configure "Redirect URLs" for auth callbacks
   - Enable "Email Auth" provider
   - Set up "External OAuth Providers" if needed

3. **Email Templates**:
   - Customize verification and password reset email templates
   - Ensure OTP code is clearly visible in the template

4. **Environment Variables**:
   - Create `.env.local` file in project root
   - Add Supabase URL and anon key:
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

### Enabling OTP Verification

1. **Update Auth Settings**:
   - In Supabase dashboard, go to Authentication → Settings
   - Enable "Email Confirmations" in the Email Auth section

2. **Configure OTP Settings**:
   - Set "Confirmation Method" to "One-time password (OTP)"
   - Configure OTP expiry time (default is 24 hours)

3. **Customize Email Template**:
   - Edit the "Confirm signup" email template
   - Ensure the OTP code is prominently displayed
   - Example template:
     ```html
     <h2>Welcome to GraffitiSOFT!</h2>
     <p>Your verification code is: <strong>{{ .Token }}</strong></p>
     <p>This code will expire in 24 hours.</p>
     ```

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