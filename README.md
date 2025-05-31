# Stizack

A modern, high-performance web application for creating and customizing graffiti text art with authentication using Supabase.

## 🚀 Performance Highlights

**Lightning-fast graffiti generation** powered by sophisticated hybrid SVG processing:
- **50-100x faster** letter processing (from 50-100ms to 0.1-1ms per letter in production)
- **Near-instant generation** for typical text lengths (<10ms total processing time)
- **Hybrid system** with development runtime processing + production lookup optimization
- **Clean production builds** with zero development noise or overhead
- **Single source of truth** overlap generation for consistent letter positioning

## Project Overview

Stizack is a React-based web application that allows users to generate customized graffiti text with exceptional performance through a sophisticated hybrid SVG processing system. The application features robust authentication, optimized SVG processing, comprehensive customization tools, and advanced development workflows for content management.

## Core Features

- **High-Performance Graffiti Generation**: Hybrid processing system with sub-millisecond letter processing in production
- **Development Workflow Tools**: SVG Processing Panel and Overlap Debug Panel for artwork management
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
- **Performance**: Hybrid SVG processing with conditional compilation
- **Build Tool**: Vite with build flags for development/production optimization
- **Deployment**: Vercel with CDN optimization

## Performance Architecture

### Hybrid SVG Processing System
The application uses a sophisticated dual-mode system optimized for both development and production:

**Development Mode:**
- **Full Runtime Processing**: Complete `processSvg()` functionality for flexibility
- **Lookup Tables**: Pre-computed lookup tables for supported letters  
- **Development Tools**: SVG Processing Panel, Overlap Debug Panel, Performance Testing
- **Performance Tracking**: Detailed timing and method detection for optimization
- **Debug Console**: Verbose logging for development analysis

**Production Mode:**
- **Pure Lookup Processing**: Only lookup table retrieval for maximum performance
- **Clean Builds**: Zero development noise, preloading, or verbose logging
- **Optimized Fallbacks**: Styled placeholders for missing letters
- **Memory Efficiency**: Minimal overhead with conditional compilation

### Development Workflows

**Overlap Generation (Required for consistent positioning):**
- Use Overlap Debug Panel to generate complete 36×36 character matrix
- Export 1,296 letter pair combinations using runtime pixel-based calculations
- Auto-update `src/data/generatedOverlapLookup.ts` as single source of truth
- Both processing modes reference this file for consistent letter positioning

**SVG Artwork Management (Required when adding new letters):**
- Use SVG Processing Panel to generate lookup tables for new artwork
- Process all letter variants (standard, alternate, first, last) and bounds
- Export complete SVG data files for production integration
- Validate generated lookup tables for accuracy and performance

### Key Performance Metrics
- **Letter Processing**: ~0.1-1ms per letter in production (vs 50-100ms runtime)
- **Total Generation**: <10ms for typical phrases (vs 500-1000ms+ runtime)
- **Memory Efficiency**: Optimized data structures with conditional loading
- **Build Optimization**: Unused development code excluded from production bundles

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
