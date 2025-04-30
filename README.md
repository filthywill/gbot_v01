# Stizack

A modern web application for creating and customizing graffiti text art with authentication using Supabase.

## Project Overview

Stizack is a React-based web application that allows users to generate customized graffiti text. The application features a robust authentication system, SVG processing for graffiti generation, and customization tools for personalizing the output.

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

The project follows a modular component architecture with clear separation of concerns:

```
src/
├── assets/           # Static assets (images, logos, etc.)
├── components/       # React components
│   ├── app/          # Core application components (AppHeader, AppFooter, etc.)
│   ├── Auth/         # Authentication components
│   ├── GraffitiDisplay/  # SVG rendering components
│   ├── controls/     # Customization control components
│   └── modals/       # Modal dialog components
├── hooks/            # Custom React hooks
│   ├── auth/         # Authentication-related hooks
│   └── ...           # Other custom hooks
├── lib/              # Utility libraries and configurations
├── store/            # Zustand state management
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
```

For detailed information on the project architecture, see [Architecture Documentation](./docs/ARCHITECTURE.md).

## Key Features

### Authentication

The application uses a modular authentication system built on Supabase Auth with:

- Email/password authentication with OTP verification
- Google OAuth integration
- Session management and persistence
- Comprehensive security measures

Authentication is implemented through dedicated components and hooks:
- Custom hooks for email verification and modal state management
- Reusable UI components for auth flows
- Centralized state management with Zustand

For comprehensive details on the authentication system, see [Authentication Documentation](./docs/AUTHENTICATION.md).

### Customization

- Color customization for fill, outline, background, and effects
- Width and size adjustments for various effects
- Position and offset controls for shadow effects
- Style presets for quick application of predefined styles
- User-created custom presets
- Real-time preview of all customization changes

### State Management

The application uses Zustand for state management with dedicated stores:

- `useAuthStore`: Manages authentication state
- `useGraffitiStore`: Controls graffiti generation and customization
- `useDevStore`: Development mode utilities and toggles

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

## Development

The application includes helpful debug features in development mode with dynamic data visualization and value overlays. For details on environment configuration, see [Environment Documentation](./docs/ENVIRONMENT.md).

## Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel dashboard
3. Set environment variables in Vercel (see Environment Configuration)
4. Deploy using the default Vite framework preset

### Manual Deployment

1. Build the application with `npm run build`
2. Set environment variables in your hosting platform
3. Deploy the `dist` directory to your hosting provider

## Documentation

- [Architecture Documentation](./docs/ARCHITECTURE.md) - Detailed technical architecture
- [Authentication Documentation](./docs/AUTHENTICATION.md) - Authentication system details
- [Environment Documentation](./docs/ENVIRONMENT.md) - Environment configuration
- [Supabase Setup](./SUPABASE_SETUP.md) - Supabase configuration guide

## License

Copyright © STIZAK. All rights reserved.
