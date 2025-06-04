# Stizack

A modern, high-performance web application for creating and customizing graffiti text art with authentication using Supabase.

## 🚀 Performance Highlights

**Lightning-fast graffiti generation** powered by sophisticated hybrid SVG processing and **comprehensive bundle optimizations**:
- **50-100x faster** letter processing (from 50-100ms to 0.1-1ms per letter in production)
- **Near-instant generation** for typical text lengths (<10ms total processing time)
- **Optimized bundle size**: ~39KB+ reduction through dependency cleanup and tree-shaking
- **Hybrid system** with development runtime processing + production lookup optimization
- **Clean production builds** with zero development noise or overhead
- **Tree-shakeable architecture**: Aggressive optimization for minimal bundle impact
- **State management optimization**: ~80% reduction in prop drilling with selective hooks
- **Self-contained components**: Zero coupling with optimized re-render patterns

## 📦 Bundle Optimization Results

**Comprehensive bundle size optimization completed (December 2024)**:
- **Total size reduction**: ~799KB → ~760KB+ (-39KB, -4.9%+)
- **Dependencies cleaned**: 52 → 31 packages (-21 packages removed)
- **Icon optimization**: Migrated to tree-shakeable `lucide-react` from `react-icons`
- **Tree-shaking**: Wildcard imports eliminated across all UI libraries
- **Development separation**: Clean production builds exclude debug tools
- **Analysis tools**: Built-in bundle analysis with interactive visualization

For complete optimization details, see [Bundle Optimization Summary](./docs/planning/Bundle_Optimization_Summary.md).

## ⚡ State Management Optimizations

**Comprehensive state management optimization completed in parallel (December 2024)**:
- **Prop drilling reduction**: ~80% reduction across core components 
- **Zustand upgrade**: Updated to v4.4.0+ with `useShallow` optimization
- **Custom selective hooks**: Purpose-built hooks eliminate component coupling
- **Self-contained components**: CustomizationToolbar, InputForm, StyleSelector now independent
- **Preserved functionality**: Zero regressions while dramatically improving maintainability
- **Performance boost**: Strategic memoization and optimized re-render patterns

**Key selective hooks created:**
- `useGraffitiDisplay`: Optimized display component state access
- `useGraffitiControls`: Self-contained input and style control logic  
- `useGraffitiCustomization`: Independent customization state management

For complete state optimization details, see [State Management Implementation Plan](./docs/planning/State_Management_Optimization_Implementation_Plan.md).

## Project Overview

Stizack is a React-based web application that allows users to generate customized graffiti text with exceptional performance through a sophisticated hybrid SVG processing system and optimized bundle architecture. The application features robust authentication, optimized SVG processing, comprehensive customization tools, and advanced development workflows for content management.

## Core Features

- **High-Performance Graffiti Generation**: Hybrid processing system with sub-millisecond letter processing in production
- **Optimized Bundle Architecture**: Tree-shaking optimized dependencies with clean development/production separation
- **Development Workflow Tools**: SVG Processing Panel and Overlap Debug Panel for artwork management
- **Style Selection**: Choose from multiple graffiti styles with pre-computed optimizations
- **Real-time Customization**: Adjust colors, size, spacing, and effects with instant preview
- **History & Undo/Redo**: Track changes and revert as needed with efficient state management
- **User Authentication**: Secure user accounts with Google and email login options
- **User Presets**: Save and load customization presets (for authenticated users)
- **Export Options**: Download as optimized SVG or high-quality PNG
- **Full Accessibility**: WCAG 2.1 AA compliant with comprehensive screen reader support

## Accessibility

This application is built with accessibility as a core requirement, ensuring it works for all users including those using assistive technologies:

### ♿ Accessibility Features

- **WCAG 2.1 AA Compliance**: Meets international accessibility standards
- **Screen Reader Support**: Comprehensive ARIA labels and semantic markup
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Color Contrast**: Minimum 4.5:1 contrast ratios for all text content
- **Focus Management**: Clear visual focus indicators and logical tab order
- **Live Regions**: Screen reader announcements for dynamic content changes
- **Error Handling**: Clear, accessible error messages and validation feedback

### Accessibility Standards

All developers must follow our accessibility guidelines when contributing to this project:

- Use semantic HTML elements and proper ARIA attributes
- Implement keyboard navigation for all interactive components
- Provide text alternatives for visual content
- Ensure sufficient color contrast ratios
- Test with screen readers and keyboard-only navigation

For complete accessibility implementation details, see [Accessibility Guidelines](./docs/ACCESSIBILITY_GUIDELINES.md).

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS 3.4
- **Router**: React Router DOM 7.5
- **State Management**: Zustand 4.5 with persistence and optimizations
- **UI Components**: Radix UI primitives with tree-shaking optimization
- **Icons**: Lucide React (tree-shakeable, optimized)
- **Authentication**: Supabase Auth with comprehensive security
- **Database**: Supabase PostgreSQL with RLS
- **Performance**: Hybrid SVG processing with conditional compilation
- **Build Tool**: Vite 6.2 with enhanced tree-shaking and bundle analysis
- **Bundle Analysis**: Rollup Plugin Visualizer for optimization insights
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

### Bundle Optimization Architecture
**Tree-Shaking Optimizations:**
- **Radix UI**: Specific imports instead of wildcard imports for all components
- **Icon Library**: Tree-shakeable Lucide React with individual icon imports
- **Development Tools**: Lazy-loaded with `React.Suspense` for production exclusion
- **Component Memoization**: Strategic `React.memo()` for expensive renders

**Build Configuration:**
- **Aggressive tree-shaking**: `moduleSideEffects: false` for maximum optimization
- **Strategic chunking**: Optimal cache efficiency with manual chunk splitting
- **Production cleanup**: Console log stripping and development code elimination
- **Bundle analysis**: On-demand visualization with `npm run analyze`

### Development Workflows

**Bundle Analysis (New):**
- Use `npm run analyze` to generate interactive bundle composition reports
- Monitor chunk sizes and dependency contributions with treemap visualization
- Track optimization progress with before/after size comparisons
- Identify optimization opportunities with gzip/brotli analysis

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
- **Bundle Size**: ~760KB optimized (vs ~799KB pre-optimization)
- **Dependencies**: 31 packages (vs 52 pre-optimization)
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

## Development & Bundle Analysis

The application includes comprehensive development tools and bundle optimization features:

### Development Tools
- **Performance Testing**: Built-in tools for testing lookup vs runtime performance
- **Debug Panels**: Real-time performance monitoring and optimization testing
- **Value Overlays**: Dynamic data visualization in development mode
- **SVG Processing Tools**: Utilities for generating and validating lookup tables

### Bundle Analysis Tools
```bash
# Generate interactive bundle analysis
npm run analyze

# Development server with analysis
npm run analyze:dev

# Complete bundle report
npm run bundle:report
```

**Analysis Features:**
- Interactive treemap visualization of bundle composition
- Gzip/Brotli compression analysis for real-world size estimates
- Per-chunk breakdown showing dependency contributions
- Optimization opportunity identification

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
- [Accessibility Guidelines](./docs/ACCESSIBILITY_GUIDELINES.md) - Complete accessibility standards and implementation guide
- [Environment Documentation](./docs/ENVIRONMENT.md) - Environment configuration
- [Supabase Setup](./SUPABASE_SETUP.md) - Supabase configuration guide

## License

Copyright © STIZAK. All rights reserved.