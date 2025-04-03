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

The application includes a development mode with debugging tools:

- **Debug Panel**: Visualize SVG processing details
- **Value Overlays**: Display internal values for debugging
- **Console Logging**: Detailed logging through the structured logger

Enable debug mode by setting `NODE_ENV=development` in your environment.

### Code Conventions

- **Component Structure**: Functional components with TypeScript interfaces
- **State Management**: Zustand stores with clear actions and state
- **Memoization**: React.memo, useMemo, and useCallback for performance optimization
- **Error Handling**: Structured error logging and user-friendly messages
- **Testing**: Component and utility tests using Vitest

## Deployment

1. Build the application with `npm run build`
2. Deploy the `dist` directory to your hosting provider
3. Configure environment variables on your hosting platform

## License

Copyright © STIZAK. All rights reserved.