# Stizack Architecture Documentation

## Project Overview

Stizack is a React-based web application built with TypeScript, designed to create high-quality, customizable vector-based graffiti artwork. The application provides users with proprietary base artwork and extensive customization options, allowing for infinite creative possibilities while maintaining the authentic look and feel of traditional graffiti art.

## Tech Stack

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **Language**: TypeScript 5.5.3
- **State Management**: Zustand 5.0.3
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: 
  - Radix UI primitives
  - Shadcn UI components
  - Custom components
- **Animation**: Framer Motion 12.5.0
- **Icons**: Lucide React and React Icons
- **Security**: 
  - Content Security Policy (CSP)
  - Rate Limiting System
  - SVG Validation and Sanitization
  - User-Friendly Security Messaging

## Performance Architecture: Hybrid SVG Processing System

### Overview
The application achieves exceptional performance through a sophisticated **hybrid SVG processing system** that provides:
- **Production Mode**: Pure lookup-based processing for maximum performance
- **Development Mode**: Full runtime + lookup capabilities for flexibility and development tools

### Performance Metrics
- **7-12x Performance Improvement**: Letter processing reduced from 50-100ms to 0.1-1ms per letter
- **Near-Instant Generation**: Total generation time reduced from 500-1000ms+ to <10ms for typical phrases
- **Clean Production Builds**: Zero development noise, preloading, or verbose logging
- **Scalable Performance**: Performance gains increase with text length due to batch processing optimizations

### Architecture Components

#### 1. Build Flag System
The system uses Vite build flags for conditional compilation:

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    __DEV_SVG_PROCESSING__: isDev,
    __PROD_LOOKUP_ONLY__: !isDev,
  }
});

// Conditional processing based on environment
if (__PROD_LOOKUP_ONLY__) {
  // Production: Pure lookup processing only
} else if (__DEV_SVG_PROCESSING__) {
  // Development: Runtime processing + lookup tables
}
```

#### 2. Development vs Production Modes

**Development Mode Features:**
- **Full Runtime Processing**: Complete `processSvg()` functionality available
- **Lookup Tables**: Pre-computed lookup tables for supported letters
- **Performance Tracking**: Detailed timing and method detection
- **Preloading**: Common letter preloading and predictive caching
- **Debug Console**: Verbose logging for optimization analysis
- **Development Tools**: SVG Processing Panel, Overlap Debug Panel, Performance Testing

**Production Mode Features:**
- **Pure Lookup Processing**: Only lookup table retrieval, no runtime processing
- **Clean Console**: No development logging or performance noise
- **Optimized Performance**: Instant letter generation with minimal overhead
- **Graceful Fallbacks**: Styled placeholders for missing letters
- **Memory Efficiency**: No preloading or caching overhead

#### 3. Pre-computed Lookup Tables
```typescript
interface ProcessedSvgData {
  letter: string;
  style: string;
  variant: 'standard' | 'alternate' | 'first' | 'last';
  bounds: { left: number; right: number; top: number; bottom: number };
  width: number;
  height: number;
  viewBox: string;
  svgContent: string;
  metadata: {
    hasContent: boolean;
    isSymmetric: boolean;
    processingTime: number;
    fileSize: number;
    optimized: boolean;
  };
}
```

#### 4. Intelligent Processing Pipeline
The hybrid processing pipeline with fallback strategies:

```typescript
const processLetter = async (letter: string, ...params): Promise<ProcessedSvg> => {
  // Production-optimized lookup-first approach
  if (isLookupEnabled) {
    try {
      const lookupResult = await getProcessedSvgFromLookupTable(letter, selectedStyle, variant);
      if (lookupResult) return lookupResult;
    } catch (error) {
      // Fallback strategy: Try different variants
    }
  }

  // Production vs Development handling
  if (__PROD_LOOKUP_ONLY__) {
    // Production: Create styled placeholder when lookup completely fails
    return createProductionPlaceholder(letter);
  } else {
    // Development: Fall back to runtime processing
    return await processSvg(svgContent, letter, resolution);
  }
};
```

#### 5. Overlap Generation System
**Single Source of Truth**: All overlap calculations reference `src/data/generatedOverlapLookup.ts`

**Generation Workflow**:
1. Use Overlap Debug Panel in development mode
2. Export complete 36×36 character overlap matrix (1,296 combinations)
3. Runtime pixel-based calculation for maximum precision
4. Automatic file update and application refresh

**Integration**: Both LOOKUP and RUNTIME modes use the same overlap values for consistent positioning

#### 6. Development Tools & Workflows

**SVG Processing Panel**: Required when adding new letter artwork
- Generate complete lookup tables for new styles
- Process all letter variants and bounds information
- Export lookup table files for production integration

**Overlap Debug Panel**: Manage letter positioning
- Individual letter adjustment for testing
- Complete overlap matrix generation (recommended)
- Export to `generatedOverlapLookup.ts` as single source of truth
- Real-time visual feedback and validation

**Performance Testing Components**:
- **LookupIntegrationTest**: Validates lookup accuracy vs runtime
- **LookupPerformanceTest**: Measures processing speed comparisons
- **Performance Monitoring**: Real-time timing analysis and method detection

### Data Structure Optimization
- **Memory Efficiency**: Optimized data structures with minimal memory footprint
- **Conditional Loading**: Development-only features excluded from production builds
- **Type Safety**: Comprehensive TypeScript interfaces for all lookup operations
- **Validation**: Runtime validation of lookup data integrity with graceful fallbacks

### Future Scalability
- **Multi-Style Support**: Architecture designed to support multiple graffiti styles
- **Dynamic Loading**: Support for runtime lookup table updates
- **Cache Optimization**: Multi-layer caching strategy for optimal performance
- **Progressive Enhancement**: Gradual performance improvements as lookup coverage expands

## Project Structure

```
src/
├── assets/         # Static assets and SVG artwork
├── components/     # React components
│   ├── controls/   # Control-specific components
│   │   ├── BaseControlItem.tsx     # Foundation control component
│   │   ├── ModernControlItem.tsx   # Enhanced control with color/slider
│   │   ├── EffectControlItem.tsx   # Dual slider control component
│   │   └── Specific controls (FillControl, OutlineControl, etc.)
│   ├── ui/        # Reusable UI components
│   │   ├── color-picker.tsx  # Enhanced color picker component
│   │   ├── value-slider.tsx  # Custom slider with value display
│   │   └── ... (other UI primitives)
│   ├── GraffitiDisplay/  # Core graffiti rendering components
│   │   ├── index.tsx        # Main container component
│   │   ├── GraffitiContent.tsx  # SVG composition component
│   │   ├── GraffitiLayers.tsx   # SVG layer management
│   │   └── ... (export and history controls)
│   └── Modern UI components (ModernCustomizationToolbar, StylePresetsPanel, etc.)
├── data/          # Static data and letter rules
├── hooks/         # Custom React hooks
│   ├── useGraffitiGeneratorWithZustand.ts  # Main generator hook
│   ├── useSvgCache.ts  # SVG caching mechanism
│   ├── useHistoryTracking.ts  # History tracking for undo/redo
│   └── useTheme.ts  # Theme management hook
├── lib/           # Core libraries and utilities
│   ├── logger.ts           # Centralized logging system
│   ├── svgSecurity.ts      # SVG validation and sanitization
│   ├── rateLimit.ts        # Rate limiting implementation
│   ├── toast.ts            # User notification system
│   └── ... (other utilities)
├── store/         # Zustand state management
│   ├── useGraffitiStore.ts  # Main state store
│   └── useDevStore.ts       # Development-only store
├── styles/        # Global styles and Tailwind configurations
├── utils/         # SVG processing utilities
│   ├── svgUtils.ts            # Core SVG processing functions
│   ├── secureSvgUtils.ts      # Secure SVG processing wrapper
│   ├── svgCustomizationUtils.ts  # SVG styling utilities
│   ├── letterUtils.ts         # Letter-specific processing
│   ├── svgCache.ts            # SVG caching mechanism
│   └── sliderValueConversion.ts  # UI helper for slider values
└── types.ts       # TypeScript type definitions
```

## Core Features

### Security Infrastructure
The application implements a comprehensive security system:

1. **Content Security Policy (CSP)**
   - Configured via Vercel.json
   - Restricts resource origins
   - Controls script execution
   - Manages inline styles
   - Handles blob URLs securely

2. **Rate Limiting System**
   - Configurable per-operation limits
   - User-friendly warning system
   - Automatic cleanup mechanism
   - Protected operations:
     - SVG Generation (60/minute)
     - Export Operations (10/minute)

3. **SVG Security**
   - Multi-layer validation
   - Content sanitization
   - XSS prevention
   - Error boundaries

4. **User Feedback System**
   - Toast notifications
   - Rate limit warnings
   - Error messages
   - Success confirmations

### SVG Security and Processing
The application implements a comprehensive SVG security system:
- Multi-layer security approach with validation and sanitization
- Whitelist-based element and attribute filtering
- XSS prevention through content sanitization
- Secure SVG processing pipeline with error boundaries
- Comprehensive logging and monitoring
- Fallback mechanisms for invalid content

### SVG Processing and Rendering
The application implements sophisticated SVG processing with features including:
- Secure vector-based artwork processing
- Input validation and sanitization
- Intelligent letter positioning with pixel-density-based overlap
- Automatic rotation rules for specific letter combinations
- Bounds detection and optimization for layout
- Efficient caching mechanisms for processed SVGs
- Memory-efficient batch processing for large inputs
- Error boundaries and fallback mechanisms

### Letter Positioning System
- Utilizes pixel data analysis for optimal letter overlap
- Implements special case handling for specific letter pairs
- Density-based positioning for authentic graffiti appearance
- Vertical pixel range analysis for efficient overlap calculation
- Customizable overlap rules for fine-tuning

### Customization Features
All implemented effects include:
- **Background**: Custom background colors and toggles
- **Fill**: Color customization for letter fills
- **Stroke/Outline**: Width and color customization for outlines
- **Shadow**: Multi-parameter shadow effects with opacity and blur
- **Stamp**: Custom width and color effects
- **Shield/Forcefield**: Protective outline effect with width and color options
- **Shadow Effect**: Offset controls for depth
- **Shine**: Basic implementation with opacity control

## State Management

The application uses Zustand for efficient state management with:
- Centralized state store for all customization options
- History tracking for undo/redo functionality
- Efficient SVG caching and processing state
- Real-time preview updates
- Preset management system
- Optimized rendering with fine-grained state updates

### Authentication State
Authentication state is now managed through dedicated hooks and stores:

- **useAuthStore**: Central Zustand store for authentication state with enhanced loading states and error handling
- **useEmailVerification**: Hook for email verification process
- **useAuthModalState**: Hook for modal visibility and view state
- **AuthProvider**: Component that handles authentication initialization and tab visibility changes

The authentication system includes several key improvements:

#### Enhanced State Management
- **Granular Loading States**: Separate loading indicators for session and user data
- **Comprehensive Error Handling**: Detailed error tracking with recovery mechanisms
- **Status-Based State**: Clear authentication status tracking (INITIAL, LOADING, AUTHENTICATED, UNAUTHENTICATED, ERROR)

#### Tab Visibility Handling
- **Session Caching**: Maintains reference to last known good session
- **Visibility Event Handling**: Responds to tab visibility changes with debouncing
- **Error Recovery**: Automatic recovery attempts when auth errors occur during tab switching
- **Progressive Fallbacks**: Multiple layers of fallback data (cache, session, recovery)

#### Robust User Data Retrieval
- **Enhanced getCurrentUser Function**: Comprehensive retry logic with exponential backoff
- **User Data Caching**: In-memory cache with configurable TTL (30 seconds)
- **Background Refresh**: Updates stale cache data in background
- **Environment-Aware Timeouts**: Different timeout values for development vs production

#### Configuration-Driven Behavior
- **AUTH_CONFIG**: Centralized configuration for timeouts, retries, and delays
- **Environment Optimization**: Different settings for development and production
- **Tab Switching Optimization**: Specific configurations for handling tab visibility changes

This separation allows for more granular control over authentication flows and improves code maintainability while providing a resilient authentication experience across different browser behaviors.

### Control Component Hierarchy
The application features a three-tier control component system:
- **BaseControlItem**: Foundation component providing structure and toggle functionality
- **ModernControlItem**: Mid-level component adding color picker and single slider
- **EffectControlItem**: Advanced component with dual sliders for complex effects
- **Specific Controls**: (FillControl, OutlineControl, etc.) that implement specific behaviors

### Color Selection System
The application features an optimized color selection system:
- Custom color picker component with multiple selection methods
- Recent colors memory with localStorage persistence
- Color swatches with predefined color palettes
- Deferred change pattern for optimal history integration
- Global state for recently used and custom colors

## Component Architecture

The application follows a modular component architecture with clear separation of concerns:

### Core Application Components

#### App Container Structure
The main App component has been refactored to use a modular approach:

- **AppHeader**: Contains application logo and authentication controls
- **AppMainContent**: Contains the main graffiti generator UI and customization tools
- **AppFooter**: Contains copyright information and application links
- **AppDevTools**: Contains development-only tools and visualizations (only in development mode)

This modular structure improves maintainability and allows for better component reuse.

### Authentication Components

The authentication system has been completely refactored into dedicated components and hooks:

#### Authentication Architecture

The authentication system follows a modular design with the following key components:

- **Custom Authentication Hooks**: Extracted authentication logic into reusable hooks
- **Dedicated UI Components**: Separate components for different authentication views
- **Modal Management**: Centralized modal control for authentication flows
- **State Persistence**: Robust state handling for interrupted authentication flows

For detailed information on the authentication system implementation, including hook details, component structures, and code examples, see [Authentication Documentation](./AUTHENTICATION.md).

### UI Components
The application uses a comprehensive UI system built with:
- Radix UI primitives for accessibility and interaction
- Custom components with Tailwind styling
- Value conversion utilities for intuitive slider interactions
- Framer Motion for animations and transitions

### Core Components

#### GraffitiDisplay
- Handles SVG composition and rendering
- Manages layout and positioning
- Implements efficient update mechanisms
- Provides real-time preview capabilities
- Export controls for saving results
- History controls for undo/redo operations

#### ModernCustomizationToolbar
- Provides comprehensive customization controls
- Implements customization sliders and toggles
- Offers real-time preview updates
- Groups related controls logically
- Integrates optimized color selection components
- Collapsible sections for better space management

#### StylePresetsPanel
- Manages preset style selection and application
- Handles user-created preset management
- Provides preset saving, loading, and deletion
- Organizes presets in an easy-to-browse grid layout
- Persists user presets in localStorage

### Security Components

#### Rate Limiting Layer
- **Configuration** (`src/lib/rateLimit.ts`)
  - Configurable time windows
  - Operation-specific limits
  - Warning thresholds
  - Automatic cleanup

- **Integration Points**
  - SVG generation
  - Export operations
  - Clipboard operations
  - Share functionality

#### User Notification System
- **Toast System** (`src/lib/toast.ts`)
  - Multiple message types
  - Automatic timeout
  - Animated transitions
  - Consistent styling

Example Implementation:
```typescript
// Toast Types and Styling
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  type?: ToastType;
}

// Usage Examples
// 1. Rate Limit Warning
showWarning("You're generating designs quickly!", {
  duration: 5000 // 5 seconds
});

// 2. Export Success
showSuccess("Design exported successfully!", {
  duration: 3000
});

// 3. Error Handling
showError("Failed to generate design. Please try again.", {
  duration: 4000
});

// 4. Processing Status
showInfo("Processing your design...", {
  duration: 2000
});
```

Integration with Security Features:
```typescript
// Rate Limiting Integration
if (!checkRateLimit('svg_generation', 'svg')) {
  const timeLeft = getRemainingCooldown();
  showWarning(`Please wait ${timeLeft} seconds before generating more designs.`);
  return;
}

// Export Error Handling
try {
  await exportDesign();
  showSuccess('Design exported successfully!');
} catch (error) {
  showError('Export failed. Please try again.');
  logger.error('Export error:', error);
}
```

#### SVG Security Layer
- **Validation Layer** (`src/lib/svgSecurity.ts`)
  - Validates SVG structure and content
  - Enforces allowed elements and attributes
  - Prevents malformed SVG injection
  - Implements comprehensive error handling

- **Sanitization Layer** (`src/lib/svgSecurity.ts`)
  - Removes potentially malicious content
  - Sanitizes attributes and values
  - Prevents XSS attacks
  - Maintains SVG integrity

- **Secure Processing Layer** (`src/utils/secureSvgUtils.ts`)
  - Wraps core SVG processing functions
  - Implements additional security checks
  - Provides secure fallbacks
  - Handles errors gracefully

#### Logging System
- Centralized logging through `src/lib/logger.ts`
- Different log levels for various security events
- Detailed error tracking and reporting
- Performance monitoring capabilities

## Development Guidelines

### Code Style
- Use functional components with TypeScript
- Implement proper type definitions
- Follow component-based architecture
- Keep components focused and maintainable
- Extract complex functionality into separate components
- Limit component size to improve maintainability

### Performance Optimization
- Implement SVG caching mechanisms
- Use batch processing for large inputs
- Employ memoization for frequently used calculations
- Apply pixel-based density calculations
- Optimize overlap calculations with pixel range analysis
- Use deferred change patterns for user interactions

### State Management Best Practices
- Use consistent patterns for state updates
- Follow unidirectional data flow
- Implement proper history tracking
- Optimize for minimal re-renders
- Separate immediate UI feedback from finalized state changes
- Leverage Zustand's fine-grained update capabilities

### SVG Processing Best Practices
- Maintain vector quality throughout processing
- Implement efficient bounds detection
- Use proper SVG attribute management
- Handle SVG parsing errors gracefully
- Employ fallback strategies for unavailable assets

### Component Organization
- Follow single responsibility principle
- Create focused components for specific features
- Extract reusable functionality into separate components
- Maintain clear component hierarchies
- Use composition over inheritance

### Security Best Practices
- Always use secure SVG processing utilities
- Validate and sanitize all SVG content
- Implement proper error boundaries
- Use appropriate logging levels
- Follow the principle of least privilege
- Regular security testing and validation

## Future Considerations

### Planned Features
- Enhanced shine effect variations and controls
- Additional letter style presets
- Enhanced export options with different file formats
- Performance optimizations for large texts
- Mobile-optimized UI improvements

### Performance Optimizations
- Web worker implementation for SVG processing
- Enhanced caching strategies with service workers
- Further optimization of letter positioning algorithms
- Reduction of unnecessary re-renders

### Security Enhancements
- Rate limiting for SVG processing
- Enhanced security logging and monitoring
- Additional SVG validation rules
- Advanced error reporting system
- Regular security audits and updates

---

This documentation is a living document and will be updated as the project evolves. 
This documentation is a living document and will be updated as the project evolves. 