# Component Standards Documentation

This document outlines the standard patterns for components, control elements, and history management in the gbot_v01 application.

## Control Component Hierarchy

The application uses a standardized three-tier approach for control components:

### 1. ControlContainer

`ControlContainer` is the foundation component that provides a consistent layout structure for all control components. It handles:

- Basic container layout and styling
- Toggle switch functionality 
- Collapsible behavior with expand/collapse animations
- Content visibility based on toggle state

```tsx
<ControlContainer
  label="LABEL"
  hasToggle={true} 
  enabled={boolean}
  onToggle={callback}
  isCollapsible={true}
  headerRightContent={ReactNode}
  contentHeight="h-[14px]"
>
  {/* Content to be shown when expanded */}
</ControlContainer>
```

### 2. ControlItem

`ControlItem` extends the basic container by adding:

- Color picker functionality in the header
- Single slider control
- Value conversion between UI/display values and actual values

```tsx
<ControlItem
  label="CONTROL"
  hasToggle={true}
  enabled={boolean}
  onToggle={callback}
  hasColorPicker={true}
  color="#color"
  onColorChange={callback}
  onColorComplete={callback}
  hasSlider={true}
  value={number}
  onValueChange={callback}
  onSliderComplete={callback}
  valueConfig={sliderValueConfig}
  sliderLabel="Size"
/>
```

### 3. EffectControlItem

`EffectControlItem` implements more complex controls with:

- Dual slider functionality
- Consistent value conversion for both sliders
- Expanded content area for multiple controls

```tsx
<EffectControlItem
  label="EFFECT"
  enabled={boolean}
  onToggle={callback}
  firstSliderLabel="Parameter 1"
  firstSliderValue={number}
  onFirstSliderChange={callback}
  secondSliderLabel="Parameter 2"
  secondSliderValue={number}
  onSecondSliderChange={callback}
  onSliderComplete={callback}
  sliderConfig={valueConfig}
/>
```

### 4. Specialized Control Components

These implement specific feature controls by leveraging the mid-tier components:

- `FillControl`: Simple color picker using ControlItem
- `OutlineControl`: Toggle + color + width using ControlItem
- `ShieldControl`: Toggle + color + width using ControlItem
- `ShadowControl`: Toggle + dual sliders using EffectControlItem
- `BackgroundControl`: Toggle + color using ControlItem

## History Management Pattern

The application uses standardized history management through the `useHistoryTracking` hook, which provides a consistent API for tracking state changes.

### Key Functions

1. **updateWithoutHistory(updates)**
   - For temporary changes during user interaction
   - Used when dragging sliders or picking colors
   - Adds `__skipHistory` flag to updates

2. **updateWithHistory(updates, presetId?)**
   - For final state changes that should create history entries
   - Used when completing interactions or applying presets
   - Optionally includes a preset ID

3. **createHistoryEntry(updates?, presetId?)**
   - Manually creates a history entry
   - Used for special cases where direct control over history is needed

4. **handleUndoRedo(newIndex, onComplete?)**
   - Standardized handler for navigation through history states
   - Supports a callback for post-navigation actions

### Usage Patterns

#### For Controls with Dragging Interaction

```tsx
// During interaction (dragging)
const handleDrag = (value) => {
  const updates = updateWithoutHistory({ myValue: value });
  onChange(updates as CustomizationOptions);
};

// On interaction complete
const handleComplete = () => {
  const updates = updateWithHistory({ myValue: finalValue });
  onChange(updates as CustomizationOptions);
};
```

#### For Immediate Changes

```tsx
// For toggles and immediate updates
const handleToggle = (enabled) => {
  const updates = updateWithHistory({ myFeatureEnabled: enabled });
  onChange(updates as CustomizationOptions);
};
```

#### For Preset Application

```tsx
// When applying a preset
const applyPreset = (preset) => {
  const updates = updateWithHistory(preset.settings, preset.id);
  onChange({ ...options, ...updates } as CustomizationOptions);
};
```

## Naming Conventions

Our naming conventions ensure consistency, improved readability, and better maintainability across the codebase. Following these standards helps all team members understand the code more quickly and reduces cognitive load when working with different parts of the application.

### Component Names

- Use **PascalCase** for all component names (e.g., `GraffitiDisplay`, `CustomizationToolbar`)
- Use descriptive names that clearly indicate the component's purpose
- Avoid generic prefixes like "Modern" that don't add semantic value
- Use the "Control" suffix for components in the controls directory (e.g., `FillControl`, `OutlineControl`)
- Use consistent, clear names for related components (e.g., `InputForm`, `StyleSelector`)

### Prop Names

- Use **camelCase** for all prop names
- Use boolean props with "is", "has", or "should" prefixes (e.g., `isLoading`, `hasColorPicker`, `shouldAutoFocus`)
- Use consistent naming for callbacks: `on{Event}` (e.g., `onToggle`, `onValueChange`)
- Use consistent naming for completion callbacks: `on{Event}Complete` (e.g., `onColorComplete`, `onSliderComplete`)
- Use prop names that match their purpose (e.g., `inputText` for text input props)

### File Names

- Use **PascalCase** for component files, matching the component name (e.g., `GraffitiDisplay.tsx`)
- Use **kebab-case** for utility files (e.g., `color-utils.ts`, `svg-processing.ts`)
- Group related components in appropriate directories
- Use `index.ts` files to simplify imports and create cleaner import statements

### CSS Class Names

- Use **kebab-case** for CSS class names
- For Tailwind CSS, follow utility-first approach while maintaining readability
- Use semantic class names that describe the purpose rather than appearance
- For component-specific classes, use component name as prefix (e.g., `graffiti-container`, `color-picker-swatch`)

### Variable Names

- Use **camelCase** for variables and function names
- Use descriptive names that explain what the variable contains or what the function does
- Avoid abbreviations unless they are well-known (e.g., use `hexColor` not `hc`)
- Use plural names for arrays (e.g., `letters`, `presets`, `colors`)
- Use noun phrases for variables, verb phrases for functions
- Prefix boolean variables with verbs like "is", "has", or "should" (e.g., `isLoading`, `hasError`)

### Function Names

- Use **camelCase** for function names
- Use verb phrases that describe the action (e.g., `calculateOverlap`, `processLetter`)
- Use consistent prefixes:
  - `handle` for event handlers (e.g., `handleClick`, `handleChange`)
  - `get` for functions that return values (e.g., `getContrastColor`)
  - `set` for functions that update state (e.g., `setInitialState`)
  - `create` for factory functions (e.g., `createHistoryEntry`)
  - `compute` or `calculate` for computational functions (e.g., `calculateBounds`)

### Store/State Management

- Use consistent prefix `use` for custom hooks and Zustand stores (e.g., `useGraffitiStore`, `useAuthStore`)
- Use descriptive action names in stores (e.g., `updateOptions`, `resetState`)
- Group related state variables together

### Constants

- Use **UPPER_SNAKE_CASE** for true constants (e.g., `MAX_LETTERS`, `DEFAULT_OPACITY`)
- Use **PascalCase** for enumerated values or constant collections (e.g., `ColorThemes`, `GraffitiStyles`)
- Place app-wide constants in a dedicated constants file or directory

### TypeScript Types and Interfaces

- Use **PascalCase** for type names and interfaces
- Use descriptive names that reflect the data structure
- Use `Interface` suffix for interfaces that represent a behavior (e.g., `RenderableInterface`)
- Use `Props` suffix for component props interfaces (e.g., `ButtonProps`, `ColorPickerProps`)
- Use `Type` suffix for complex types (e.g., `ColorType`, `PositionType`)
- Use prefixes consistently:
  - `I` for interfaces (optional, e.g., `IUser`)
  - `T` for type aliases (optional, e.g., `TConfig`)
  - `E` for enums (e.g., `EDirection`)

By adhering to these naming conventions, we maintain a codebase that is easier to navigate, understand, and maintain over time.

## Value Conversion

Use the standardized value conversion utilities for consistent slider behavior:

```tsx
// Create a value configuration
const myValueConfig = {
  min: 0,          // Actual minimum value
  max: 100,        // Actual maximum value
  step: 1,         // Step increment
  displayMin: 0,   // Display minimum
  displayMax: 10,  // Display maximum
  toDisplayValue: (value) => Math.floor(value / 10),
  toActualValue: (display) => display * 10
};

// Or use the helper function
const linearConfig = createLinearValueConfig(0, 100, 1);
```

### Authentication Components

Authentication components follow a layered architecture with clear separation of concerns:

#### Core Authentication Components

**AuthProvider** (`src/components/Auth/AuthProvider.tsx`)
- Manages authentication initialization and session persistence
- Handles tab visibility changes with debouncing and error recovery
- Provides authentication context to the entire application
- Implements retry logic for failed authentication operations

```tsx
interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Session caching and visibility change handling
  const lastKnownSessionRef = useRef<any>(null);
  const visibilityChangeInProgressRef = useRef(false);
  
  // Enhanced initialization with retry logic
  // Tab visibility handling with debouncing
  // Error recovery mechanisms
  
  return <>{children}</>;
};
```

**AuthModal** (`src/components/Auth/AuthModal.tsx`)
- Main modal container for authentication flows
- Manages modal visibility and view transitions
- Integrates with authentication hooks for state management

#### Authentication Hooks

**useEmailVerification** (`src/hooks/auth/useEmailVerification.ts`)
- Manages email verification state and process
- Handles OTP code verification and resending
- Provides verification status and error handling

```tsx
export function useEmailVerification() {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  
  // Verification logic with state persistence
  // URL parameter checking for verification
  // Resume verification functionality
  
  return {
    showVerificationModal,
    setShowVerificationModal,
    verificationEmail,
    verificationError,
    setVerificationError,
    isVerifying,
    pendingVerification,
    handleResumeVerification
  };
}
```

**useAuthModalState** (`src/hooks/auth/useAuthModalState.ts`)
- Controls authentication modal state and view management
- Handles URL parameter-based modal activation
- Manages transitions between sign-in, sign-up, and password reset views

```tsx
export type AuthModalView = 'sign_in' | 'sign_up' | 'forgotten_password';

export function useAuthModalState() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalView>('sign_in');
  
  // URL parameter checking and processing
  // Modal state management
  // View transition handling
  
  return {
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    checkUrlParams
  };
}
```

#### Authentication Store Integration

Authentication components integrate with the enhanced Zustand store:

```tsx
// Enhanced auth store usage
const { 
  user, 
  session, 
  status, 
  error,
  isSessionLoading,
  isUserDataLoading,
  initialize,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetError
} = useAuthStore();

// Status-based rendering
if (status === 'LOADING') {
  return <LoadingSpinner />;
}

if (status === 'ERROR' && error) {
  return <ErrorMessage message={error} onRetry={resetError} />;
}

if (status === 'AUTHENTICATED' && user) {
  return <AuthenticatedContent user={user} />;
}
```

#### Component Architecture Principles

1. **Separation of Concerns**:
   - AuthProvider handles initialization and session management
   - Hooks manage specific authentication flows
   - UI components focus on presentation and user interaction

2. **Error Handling**:
   - Comprehensive error states with user-friendly messages
   - Retry mechanisms for failed operations
   - Graceful degradation when services are unavailable

3. **Loading States**:
   - Granular loading indicators for different operations
   - Separate loading states for session and user data
   - Progressive loading with cached data fallbacks

4. **State Management**:
   - Centralized state through Zustand store
   - Local component state for UI-specific concerns
   - Persistent state for user preferences and session data

5. **Tab Visibility Handling**:
   - Debounced visibility change detection
   - Session restoration on tab focus
   - Error recovery for authentication state inconsistencies

#### Testing Considerations

Authentication components should be tested for:

1. **State Transitions**: Verify proper state changes during auth flows
2. **Error Handling**: Test error scenarios and recovery mechanisms
3. **Tab Switching**: Verify session persistence across tab changes
4. **Network Issues**: Test behavior with intermittent connectivity
5. **Cache Behavior**: Verify proper cache usage and invalidation

Following these standards ensures consistent UI behavior, maintainable code structure, and proper history tracking throughout the application. 