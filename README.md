# GraffitiSOFT

A modern web application for creating and customizing graffiti text art with authentication using Supabase.

## Project Overview

GraffitiSOFT is a React-based web application that allows users to generate customized graffiti text. The application features a robust authentication system, SVG processing for graffiti generation, and customization tools for personalizing the output.

## Core Features

- **Graffiti Text Generation**: Convert input text into stylized graffiti art
- **Style Selection**: Choose from multiple graffiti styles
- **Customization Tools**: Adjust colors, size, spacing, and other properties
- **History & Undo/Redo**: Track changes and revert as needed
- **Authentication**: User accounts with Google and email login options
- **User Presets**: Save and load customization presets (for authenticated users)
- **Export Options**: Download as SVG or PNG

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Authentication**: Supabase Auth
- **Storage**: Supabase PostgreSQL
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## Project Structure

```
src/
├── assets/           # Static assets (images, logos, etc.)
├── components/       # React components
│   ├── Auth/         # Authentication components
│   ├── GraffitiDisplay/  # SVG rendering components
│   └── ui/           # Reusable UI components
├── data/             # Static data like style definitions
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries and configurations
├── services/         # API service integrations
├── store/            # Zustand state management
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
```

## Features

### Authentication
- Secure email/password authentication
- Google OAuth integration
- Remember Me functionality
- Password reset flow with email verification
- Strong password requirements with strength meter
- Persistent user preferences
- Modern, responsive authentication UI
- Real-time form validation
- Comprehensive error handling

### State Management
- Zustand for efficient state management
- Separate stores for different concerns:
  - Authentication state
  - User preferences
  - Google OAuth
  - Application features
- Persistent storage where appropriate
- Type-safe state management

## Authentication Implementation

The application uses Supabase for authentication with a robust, type-safe implementation.

### Authentication Flow

1. **Client Initialization**: `supabase.ts` initializes the Supabase client with environment variables
2. **State Management**: `useAuthStore.ts` manages authentication state with Zustand
3. **UI Components**: Components in `components/Auth/` handle user interactions
4. **Session Handling**: AuthProvider maintains session state throughout the app

### Authentication Methods

- **Google Sign-In**: Direct token approach using Google Identity Services
- **Email/Password**: Traditional email and password authentication

### Key Authentication Files

- `src/lib/supabase.ts`: Supabase client configuration
- `src/store/useAuthStore.ts`: Authentication state management
- `src/components/Auth/AuthProvider.tsx`: Context provider for auth state
- `src/components/Auth/AuthHeader.tsx`: Sign in/out UI
- `src/components/Auth/AuthModal.tsx`: Authentication modal dialog
- `src/components/Auth/GoogleSignInButton.tsx`: Google authentication integration
- `src/components/Auth/AuthCallback.tsx`: Handles redirect-based auth flows

## Google Authentication Implementation

The application uses a direct token approach for Google authentication:

1. Load Google Identity Services script
2. Initialize button with client ID from environment variables
3. Handle credential response by validating token with Supabase
4. Update authentication state in Zustand store

```tsx
// GoogleSignInButton.tsx (simplified)
const handleCredentialResponse = useCallback(async (response) => {
  if (!response.credential) throw new Error('No credential');
  
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.credential,
  });
  
  if (error) {
    logger.error('Supabase auth error', error);
    return;
  }
  
  // Authentication successful
}, []);
```

## State Management

The application uses Zustand for state management with dedicated stores:

- `useAuthStore`: Manages authentication state
- `useGraffitiStore`: Controls graffiti generation and customization
- `useDevStore`: Development mode utilities and toggles

## Logging System

A structured logging system is implemented in `src/lib/logger.ts` with environment-aware behavior:

- **Development**: Full logging with detailed information
- **Production**: Minimal logging with sensitive data sanitization
- **Log Levels**: ERROR, WARN, INFO, DEBUG

## Environment Configuration

Environment variables are managed through a `.env` file:

```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Authentication
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Copy `.env.example` to `.env` and add your configuration
4. Follow the steps in `SUPABASE_SETUP.md` to configure Supabase
5. Run the development server with `npm run dev`

## Supabase Setup

See `SUPABASE_SETUP.md` for detailed instructions on setting up Supabase, including:

- Creating a Supabase project
- Configuring authentication providers
- Setting up database tables and security policies
- Obtaining and configuring API keys

## Development

### Development Mode

The application includes helpful debug features in development mode:

- debug panel with dynamic data visualization
- value overlays for quick verification 
- development mode is automatically enabled for local development

### Environment Configuration

For details on environment configuration and how development/production modes work, see [Environment Documentation](./docs/ENVIRONMENT.md).

## Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel dashboard
3. Set the following environment variables in Vercel:
   - `VITE_APP_ENV=production` (Ensures debug overlays are disabled)
   - `VITE_SUPABASE_URL` (Your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` (Your Supabase anonymous key)
   - `VITE_GOOGLE_CLIENT_ID` (If using Google authentication)
4. Deploy using the default Vite framework preset

### Manual Deployment

1. Build the application with `npm run build`
2. Set environment variables in your hosting platform
3. Deploy the `dist` directory to your hosting provider

## License

Copyright © STIZAK. All rights reserved.

# GraffitiSOFT OTP Verification Implementation

This document outlines the implementation of an OTP-based email verification system for GraffitiSOFT.

## 📋 Overview

We've implemented a code-based (OTP) verification system that replaces the link-based verification approach. This enhances user experience by keeping users within the application during the verification process.

## 🆕 New Components and Features

### 1. OTP-Based Verification Flow

- **Verification Code Input Component** (`src/components/Auth/VerificationCodeInput.tsx`):
  - Collects and validates a 6-digit OTP code
  - Includes paste functionality for easier code entry
  - Provides clear error messages and loading states
  - Auto-verification when pasting a valid code

- **Verification Banner** (`src/components/Auth/VerificationBanner.tsx`):
  - Persistent notification for pending verifications
  - Displays a countdown timer for verification expiration
  - Allows resuming the verification process
  - Automatically hides when user is authenticated

### 2. Verification State Management

- **localStorage Persistence**:
  - Verification state stored in `localStorage` for persistence
  - State includes email, timestamp, and attempt status
  - 30-minute expiration for security
  - Automatically cleared upon successful verification

- **Auth Store Integration**:
  - New `verifyOtp` method for code validation
  - Integration with existing auth state management
  - Proper error handling and user feedback

### 3. Email Template

- **Custom Email Template**:
  - Clear, easily copyable verification code
  - Modern design with visual hierarchy
  - Mobile-responsive layout
  - Matches application branding

## 🚀 Implementation Details

### Authentication Flow

1. **Sign Up**:
   - User enters email and password
   - Supabase API called with `emailRedirectTo: undefined` to disable link redirection
   - Verification state saved to localStorage
   - User presented with verification code input screen

2. **Verification**:
   - User receives email with 6-digit code
   - Code entered in the verification screen
   - Supabase API verifies the code
   - User automatically signed in upon success

3. **Persistence**:
   - If user closes modal/browser before verifying
   - Banner appears on next visit
   - User can resume verification process
   - State expires after 30 minutes

## 📄 Documentation

New documentation has been added to support this implementation:

1. **`docs/AUTHENTICATION.md`**: Updated with OTP verification details
2. **`docs/OTP_VERIFICATION_SETUP.md`**: Setup guide for Supabase
3. **`docs/VERIFICATION_EMAIL_TEMPLATE.html`**: Email template for OTP delivery

## 🧪 Testing the OTP Flow

To test the new verification flow:

1. **Local Testing**:
   - Sign up with a valid email
   - Check your email for the verification code
   - Enter the code in the verification modal
   - You should be automatically logged in upon success

2. **Testing Banner Persistence**:
   - Sign up with a valid email
   - Close the verification modal without verifying
   - Refresh the page
   - Banner should appear at the top of the page
   - Click "Resume Verification" to continue

3. **Testing Code Entry**:
   - Verify that only digits are accepted in the code field
   - Test paste functionality
   - Test auto-verification when pasting a valid code
   - Verify that error messages are clear and helpful

## 🛠️ Supabase Setup

To configure your Supabase project:

1. Update the email template in Supabase dashboard
   - Go to Authentication → Email Templates
   - Replace "Confirm signup" template with our custom HTML

2. Ensure proper URL configuration
   - Set site URL to your production domain
   - Add localhost to redirect URLs for local development

See `docs/OTP_VERIFICATION_SETUP.md` for detailed instructions.

## 🔧 Technical Challenges Solved

1. **Persistent Verification State**: Implemented localStorage-based state persistence
2. **Banner Visibility Logic**: Created reliable banner display/hide logic
3. **Clipboard Integration**: Added secure paste functionality
4. **Auto-verification**: Implemented auto-verify on valid paste
5. **Seamless User Experience**: Maintained user context throughout verification