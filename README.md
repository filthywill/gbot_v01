# Stizack

A modern, high-performance web application for creating and customizing graffiti text art with authentication using Supabase.

## 🚀 Performance Highlights

**Lightning-fast graffiti generation** powered by pre-computed SVG lookup tables:
- **7-12x faster** letter processing (from 50-100ms to 0.1-1ms per letter)
- **Near-instant generation** for typical text lengths
- **Intelligent fallback** to runtime processing for edge cases
- **Production-ready performance** with automatic optimization

## Project Overview

Stizack is a React-based web application that allows users to generate customized graffiti text. The application features a robust authentication system, optimized SVG processing for graffiti generation, and comprehensive customization tools for personalizing the output.

## Core Features

- **High-Performance Graffiti Generation**: Convert input text into stylized graffiti art with sub-millisecond processing
- **Style Selection**: Choose from multiple graffiti styles with pre-computed optimizations
- **Real-time Customization**: Adjust colors, size, spacing, and effects with instant preview
- **History & Undo/Redo**: Track changes and revert as needed with efficient state management
- **User Authentication**: Secure user accounts with Google and email login options
- **User Presets**: Save and load customization presets (for authenticated users)
- **Export Options**: Download as optimized SVG or high-quality PNG

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand with persistence
- **Authentication**: Supabase Auth with comprehensive security
- **Database**: Supabase PostgreSQL with RLS
- **Performance**: Pre-computed SVG lookup tables, intelligent caching
- **Build Tool**: Vite with optimized bundle splitting
- **Deployment**: Vercel with CDN optimization

## Performance Architecture

### SVG Lookup System
The application uses a sophisticated pre-computed lookup system for optimal performance:

- **Lookup Tables**: Pre-processed SVG data for instant letter retrieval
- **Variant Support**: Standard, alternate, first, and last letter variants
- **Overlap Optimization**: Pre-calculated letter spacing and positioning
- **Graceful Fallback**: Automatic runtime processing for unsupported letters
- **Caching Layer**: Intelligent result caching for repeated operations

### Key Performance Metrics
- **Letter Processing**: ~0.1-1ms per letter (vs 50-100ms runtime)
- **Total Generation**: <10ms for typical phrases (vs 500-1000ms+ runtime)
- **Memory Efficiency**: Optimized data structures with minimal memory footprint
- **Bundle Size**: Code-split lookup tables for efficient loading

## Project Structure

The project follows a modular component architecture with clear separation of concerns:

```
src/
├── assets/           # Static assets (images, logos, etc.)
├── components/       # React components
│   ├── app/          # Core application components (AppHeader, AppFooter, etc.)
│   ├── Auth/         # Authentication components
│   ├── GraffitiDisplay/  # SVG rendering and export components
│   ├── controls/     # Customization control components
│   ├── dev/          # Development and testing components
│   └── modals/       # Modal dialog components
├── data/             # Static data and generated lookup tables
│   └── generated/    # Pre-computed SVG lookup tables
├── hooks/            # Custom React hooks
│   ├── auth/         # Authentication-related hooks
│   └── ...           # Performance and utility hooks
├── lib/              # Utility libraries and configurations
├── store/            # Zustand state management
├── types/            # TypeScript type definitions
└── utils/            # Helper functions and performance utilities
    ├── dev/          # Development and lookup generation tools
    └── ...           # SVG processing and optimization utilities
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

- Real-time color customization for fill, outline, background, and effects
- Dynamic width and size adjustments for various effects
- Position and offset controls for shadow effects
- Style presets for quick application of predefined styles
- User-created custom presets with cloud sync
- Instant preview of all customization changes

### State Management

The application uses Zustand for state management with dedicated stores:

- `useAuthStore`: Manages authentication state and user sessions
- `useGraffitiStore`: Controls graffiti generation and customization with performance optimization
- `useDevStore`: Development mode utilities and performance testing tools

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

The application includes comprehensive development tools:

- **Performance Testing**: Built-in tools for testing lookup vs runtime performance
- **Debug Panels**: Real-time performance monitoring and optimization testing
- **Value Overlays**: Dynamic data visualization in development mode
- **SVG Processing Tools**: Utilities for generating and validating lookup tables

For details on environment configuration, see [Environment Documentation](./docs/ENVIRONMENT.md).

## Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel dashboard
3. Set environment variables in Vercel (see Environment Configuration)
4. Deploy using the default Vite framework preset

The application is optimized for production deployment with:
- Automatic code splitting and optimization
- CDN-optimized static assets
- Server-side rendering ready
- Performance monitoring integration

### Manual Deployment

1. Build the application with `npm run build`
2. Set environment variables in your hosting platform
3. Deploy the `dist` directory to your hosting provider

## Performance Optimization

The application achieves exceptional performance through:

- **Pre-computed Lookup Tables**: Eliminates runtime SVG processing overhead
- **Intelligent Caching**: Multi-layer caching for repeated operations
- **Code Splitting**: Optimized bundle loading for faster initial load
- **Memory Management**: Efficient data structures and garbage collection
- **Progressive Enhancement**: Graceful fallback for edge cases

## Documentation

- [Architecture Documentation](./docs/ARCHITECTURE.md) - Detailed technical architecture
- [Authentication Documentation](./docs/AUTHENTICATION.md) - Authentication system details
- [Environment Documentation](./docs/ENVIRONMENT.md) - Environment configuration
- [Supabase Setup](./SUPABASE_SETUP.md) - Supabase configuration guide

## License

Copyright © STIZAK. All rights reserved.
