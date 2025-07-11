# Stizack API Reference

This document provides detailed API documentation for the core hooks, stores, and utility functions in the Stizack application.

## Table of Contents

- [Stores](#stores)
- [Hooks](#hooks)
- [Utilities](#utilities)
- [Components](#components)
- [Services](#services)
- [Type Definitions](#type-definitions)

## React Hooks

### useGraffitiGeneratorWithZustand

The main hook that powers graffiti generation and customization, optimized for React 19's enhanced concurrent features.

```typescript
const useGraffitiGeneratorWithZustand = () => {
  // Returns all state and actions for graffiti generation
}
```

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `inputText` | `string` | The current input text |
| `displayInputText` | `string` | The text currently being displayed |
| `isGenerating` | `boolean` | Whether graffiti is being generated |
| `error` | `string \| null` | Current error message, if any |
| `selectedStyle` | `string` | Currently selected graffiti style |
| `processedSvgs` | `ProcessedSvg[]` | Array of processed SVG objects |
| `positions` | `number[]` | Horizontal positions for each letter |
| `contentWidth` | `number` | Width of the graffiti content |
| `contentHeight` | `number` | Height of the graffiti content |
| `containerScale` | `number` | Scale factor for the container |
| `customizationOptions` | `CustomizationOptions` | Current customization options |
| `history` | `HistoryState[]` | History of customization states |
| `currentHistoryIndex` | `number` | Current position in history |
| `generateGraffiti` | `(text: string) => Promise<void>` | Generate graffiti from input text |
| `handleCustomizationChange` | `(options: CustomizationOptions) => void` | Update customization options |
| `handleInputTextChange` | `(text: string) => void` | Update input text |
| `handleStyleChange` | `(style: string) => void` | Change graffiti style |
| `handleUndoRedo` | `(newIndex: number) => void` | Navigate through history |

**Usage Example:**

```tsx
const {
  displayInputText,
  isGenerating,
  generateGraffiti,
  handleInputTextChange
} = useGraffitiGeneratorWithZustand();

// Update input and generate graffiti
handleInputTextChange('Hello');
generateGraffiti('Hello');
```

### useSvgCache

Hook for caching SVG content to improve performance.

```typescript
const useSvgCache = () => {
  // Returns methods for SVG caching
}
```

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `getCachedSvg` | `(key: string) => ProcessedSvg \| undefined` | Get a cached SVG by key |
| `cacheSvg` | `(key: string, svg: ProcessedSvg) => void` | Cache an SVG with a key |
| `preloadSvg` | `(letter: string, path: string, style: string) => Promise<void>` | Preload an SVG for later use |
| `clearCache` | `(style?: string) => void` | Clear the SVG cache |

**Usage Example:**

```tsx
const { getCachedSvg, cacheSvg, preloadSvg } = useSvgCache();

// Cache an SVG
cacheSvg('a-standard', processedSvgObject);

// Retrieve a cached SVG
const cachedSvg = getCachedSvg('a-standard');
```

### useHistoryTracking

Hook for tracking and managing state history.

```typescript
const useHistoryTracking = () => {
  // Returns methods for history tracking
}
```

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `updateWithoutHistory` | `<T>(updates: Partial<T>) => Partial<T>` | Update state without creating history |
| `updateWithHistory` | `<T>(updates: Partial<T>, presetId?: string) => Partial<T>` | Update state and create a history entry |
| `createHistoryEntry` | `<T>(updates?: Partial<T>, presetId?: string) => void` | Manually create a history entry |
| `handleUndoRedo` | `(newIndex: number, onComplete?: () => void) => void` | Navigate through history |

**Usage Example:**

```tsx
const { updateWithoutHistory, updateWithHistory } = useHistoryTracking();

// During slider drag (temporary updates)
const handleDrag = (value) => {
  const updates = updateWithoutHistory({ stampWidth: value });
  onChange(updates);
};

// When slider interaction completes (permanent update)
const handleComplete = () => {
  const updates = updateWithHistory({ stampWidth: finalValue });
  onChange(updates);
};
```

### useTheme

Hook for theme management.

```typescript
const useTheme = () => {
  // Returns theme state and methods
}
```

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `theme` | `'light' \| 'dark'` | Current theme |
| `setTheme` | `(theme: 'light' \| 'dark') => void` | Set theme |
| `toggleTheme` | `() => void` | Toggle between light and dark themes |

**Usage Example:**

```tsx
const { theme, toggleTheme } = useTheme();

// Toggle theme button
<button onClick={toggleTheme}>
  Current theme: {theme}
</button>
```

## Zustand Stores

### useGraffitiStore

The main store for graffiti state management.

```typescript
const useGraffitiStore = create<GraffitiState>((set, get) => ({
  // State and actions
}));
```

**State Properties:**

| Name | Type | Description |
|------|------|-------------|
| `inputText` | `string` | Current input text |
| `displayInputText` | `string` | Text being displayed |
| `isGenerating` | `boolean` | Generation status |
| `error` | `string \| null` | Current error message |
| `selectedStyle` | `string` | Selected style ID |
| `processedSvgs` | `ProcessedSvg[]` | Processed SVG objects |
| `positions` | `number[]` | Letter positions |
| `contentWidth` | `number` | Content width |
| `contentHeight` | `number` | Content height |
| `containerScale` | `number` | Container scale factor |
| `customizationOptions` | `CustomizationOptions` | Customization state |
| `history` | `HistoryState[]` | State history |
| `currentHistoryIndex` | `number` | Current history position |
| `isUndoRedoOperation` | `boolean` | Flag for undo/redo operations |
| `hasInitialGeneration` | `boolean` | Whether initial generation has occurred |

**Actions:**

| Name | Type | Description |
|------|------|-------------|
| `setInputText` | `(text: string) => void` | Update input text |
| `setDisplayInputText` | `(text: string) => void` | Update display text |
| `setIsGenerating` | `(isGenerating: boolean) => void` | Set generating state |
| `setError` | `(error: string \| null) => void` | Set error message |
| `setSelectedStyle` | `(style: string) => void` | Set selected style |
| `setProcessedSvgs` | `(svgs: ProcessedSvg[]) => void` | Update processed SVGs |
| `setCustomizationOptions` | `(options: CustomizationOptions) => void` | Update customization |
| `updatePositions` | `() => void` | Recalculate letter positions |
| `addToHistory` | `(state: HistoryState) => void` | Add state to history |
| `handleUndoRedo` | `(newIndex: number) => void` | Handle undo/redo |

**Usage Example:**

```tsx
// Get state
const options = useGraffitiStore(state => state.customizationOptions);

// Update state
useGraffitiStore.setState({ selectedStyle: 'bubble' });

// Use an action
useGraffitiStore.getState().setError('Something went wrong');
```

### useAuthStore

Store for authentication state management.

```typescript
const useAuthStore = create<AuthState>((set) => ({
  // Authentication state and actions
}));
```

**State Properties:**

| Name | Type | Description |
|------|------|-------------|
| `user` | `User \| null` | Current authenticated user |
| `session` | `Session \| null` | Current authentication session |
| `status` | `AuthStatus` | Current authentication status |
| `error` | `string \| null` | Authentication error message |
| `lastError` | `Error \| null` | Last error object for debugging |
| `isSessionLoading` | `boolean` | Session loading state |
| `isUserDataLoading` | `boolean` | User data loading state |

**AuthStatus Type:**

```typescript
export type AuthStatus = 
  | 'INITIAL'      // Initial state before any auth check
  | 'LOADING'      // Auth check in progress
  | 'AUTHENTICATED' // User is authenticated
  | 'UNAUTHENTICATED' // User is not authenticated
  | 'ERROR';       // Auth error occurred
```

**Actions:**

| Name | Type | Description |
|------|------|-------------|
| `initialize` | `() => Promise<void>` | Initialize authentication state with retry logic |
| `signInWithEmail` | `(email: string, password: string) => Promise<{ user: User; session: Session } \| undefined>` | Sign in with email/password |
| `signUpWithEmail` | `(email: string, password: string) => Promise<{ user: User \| null; session: Session \| null; } \| null>` | Sign up with email/password |
| `signOut` | `() => Promise<void>` | Sign out current user |
| `resetError` | `() => void` | Clear authentication errors |
| `setError` | `(error: string) => void` | Set authentication error |
| `resetPassword` | `(email: string) => Promise<boolean>` | Send password reset email |
| `verifyOtp` | `(email: string, token: string) => Promise<{ user: User \| null; session: Session \| null; } \| null>` | Verify OTP code |
| `setUser` | `(user: User \| null) => void` | Direct user state setter |
| `setSession` | `(session: Session \| null) => void` | Direct session state setter |
| `clearSession` | `() => void` | Clear session data |

**Computed Helpers:**

| Name | Type | Description |
|------|------|-------------|
| `isAuthenticated` | `() => boolean` | Check if user is authenticated |
| `isLoading` | `() => boolean` | Check if any auth operation is loading |
| `hasInitialized` | `() => boolean` | Check if auth has been initialized |

**Usage Example:**

```tsx
// Get auth state
const { user, status, isLoading } = useAuthStore();

// Use auth actions
const { signInWithEmail, signOut, initialize } = useAuthStore();

// Sign in
try {
  const result = await signInWithEmail('user@example.com', 'password123');
  if (result) {
    console.log('Signed in:', result.user);
  }
} catch (error) {
  console.error('Sign in failed:', error);
}

// Initialize auth on app start
useEffect(() => {
  initialize();
}, []);
```

### usePreferencesStore

Store for user preferences.

```typescript
const usePreferencesStore = create<PreferencesState>((set) => ({
  // Preferences state and actions
}));
```

**State Properties:**

| Name | Type | Description |
|------|------|-------------|
| `rememberMe` | `boolean` | Remember me preference |
| `lastUsedEmail` | `string` | Last used email address |

**Actions:**

| Name | Type | Description |
|------|------|-------------|
| `setRememberMe` | `(value: boolean) => void` | Update remember me setting |
| `setLastUsedEmail` | `(email: string) => void` | Update last used email |

**Usage Example:**

```tsx
// Get preferences
const { rememberMe, lastUsedEmail } = usePreferencesStore();

// Update preferences
const { setRememberMe } = usePreferencesStore();
setRememberMe(true);
```

### useDevStore

Store for development-only features.

```typescript
const useDevStore = create<DevState>((set) => ({
  // Development state and actions
}));
```

**State Properties:**

| Name | Type | Description |
|------|------|-------------|
| `showValueOverlays` | `boolean` | Whether to show debug value overlays |
| `showColorPanel` | `boolean` | Whether to show debug color panel |

**Actions:**

| Name | Type | Description |
|------|------|-------------|
| `toggleValueOverlays` | `() => void` | Toggle value overlays |
| `toggleColorPanel` | `() => void` | Toggle color panel |

**Usage Example:**

```tsx
// Development mode tools
const { showValueOverlays, toggleValueOverlays } = useDevStore();

// Toggle debug tools
<button onClick={toggleValueOverlays}>
  {showValueOverlays ? 'Hide Values' : 'Show Values'}
</button>
```

## Utility Functions

### SVG Processing Utilities

#### processSvg

Processes raw SVG content into a standardized format.

```typescript
processSvg(
  svgContent: string, 
  letter: string, 
  rotation: number = 0
): Promise<ProcessedSvg>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `svgContent` | `string` | Raw SVG XML content |
| `letter` | `string` | The letter this SVG represents |
| `rotation` | `number` | Optional rotation angle in degrees |

**Returns:**

`Promise<ProcessedSvg>` - Processed SVG object with dimensions and cleaned content

**Usage Example:**

```typescript
const svgContent = '<svg>...</svg>';
const processedSvg = await processSvg(svgContent, 'a', 0);
```

#### findOptimalOverlap

Calculates the optimal overlap between two SVG letters.

```typescript
findOptimalOverlap(
  leftSvg: ProcessedSvg, 
  rightSvg: ProcessedSvg, 
  overlapMultiplier: number = 1
): number
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `leftSvg` | `ProcessedSvg` | Left letter SVG |
| `rightSvg` | `ProcessedSvg` | Right letter SVG |
| `overlapMultiplier` | `number` | Multiplier for overlap amount |

**Returns:**

`number` - Optimal overlap in pixels

**Usage Example:**

```typescript
const overlap = findOptimalOverlap(svgA, svgB, 0.8);
```

### Authentication Utilities

#### getCurrentUser

Enhanced function to get the current user with retry logic and caching.

```typescript
getCurrentUser(
  retryCount?: number
): Promise<User | null>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `retryCount` | `number` | Maximum number of retry attempts (default: AUTH_CONFIG.maxUserFetchRetries) |

**Returns:**

`Promise<User | null>` - Current user or null if not authenticated

**Features:**

- **Caching**: Uses in-memory cache with 30-second TTL
- **Retry Logic**: Exponential backoff for failed requests
- **Tab Awareness**: Different timeouts for visible vs hidden tabs
- **Fallback Handling**: Returns cached data when fresh requests fail
- **Background Refresh**: Updates cache in background for stale data

**Usage Example:**

```typescript
// Get current user with default retry count
const user = await getCurrentUser();

// Get current user with custom retry count
const user = await getCurrentUser(5);

// Handle potential null result
if (user) {
  console.log('Current user:', user.email);
} else {
  console.log('No authenticated user');
}
```

#### Auth Configuration

Centralized configuration for authentication timeouts and retry logic.

```typescript
// src/lib/auth/config.ts
export const AUTH_CONFIG = {
  // Delays for state transitions (optimized for tab switching)
  stateTransitionDelay: import.meta.env.PROD ? 300 : 200,
  
  // Retry intervals for operations
  retryDelay: import.meta.env.PROD ? 6000 : 4000,
  tokenExchangeRetryDelay: 1500,
  
  // Timeout for user fetch operations
  userFetchTimeout: 8000,
  
  // Maximum number of retries
  maxInitRetries: 3,
  maxTokenExchangeRetries: 3,
  maxUserFetchRetries: 3,
  
  // Session duration
  sessionDuration: 60 * 60 * 24 * 7, // 7 days in seconds
};
```

**Configuration Properties:**

| Name | Type | Description |
|------|------|-------------|
| `stateTransitionDelay` | `number` | Delay for auth state transitions (ms) |
| `retryDelay` | `number` | Base delay for retry operations (ms) |
| `userFetchTimeout` | `number` | Timeout for user fetch operations (ms) |
| `maxUserFetchRetries` | `number` | Maximum retries for user fetch operations |

### Rate Limiting

#### checkRateLimit

Checks if an operation is rate-limited.

```typescript
checkRateLimit(
  operationType: string, 
  resourceType: string
): boolean
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `operationType` | `string` | Type of operation (e.g., 'svg_generation') |
| `resourceType` | `string` | Type of resource (e.g., 'svg') |

**Returns:**

`boolean` - `true` if operation is allowed, `false` if rate limited

**Usage Example:**

```typescript
if (!checkRateLimit('svg_generation', 'svg')) {
  showWarning('Please wait before generating more graffiti');
  return;
}
```

### Notification Utilities

#### showSuccess / showError / showWarning / showInfo

Show toast notifications of different types.

```typescript
showSuccess(message: string, duration?: number): void
showError(message: string, duration?: number): void
showWarning(message: string, duration?: number): void
showInfo(message: string, duration?: number): void
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `message` | `string` | Notification message |
| `duration` | `number` | Optional duration in milliseconds |

**Usage Example:**

```typescript
showSuccess('Graffiti exported successfully!', 3000);
showError('Failed to generate graffiti');
```

### Export Utilities

#### createFilename

Creates standardized filenames for export operations.

```typescript
createFilename(inputText: string, extension: 'svg' | 'png'): string
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `inputText` | `string` | The input text used to generate the graffiti |
| `extension` | `'svg' \| 'png'` | File extension for the export |

**Returns:**

`string` - Formatted filename in the pattern "(input text)_STZCK.{extension}"

**Features:**

- **Consistent Format**: All exports use "(input text)_STZCK.{extension}" pattern
- **Text Sanitization**: Spaces converted to underscores, special characters removed
- **Uppercase Conversion**: Input text converted to uppercase for consistency
- **Length Limiting**: Prevents excessively long filenames (max 60 characters)
- **Fallback Handling**: Returns "STZCK.{extension}" for empty input

**Usage Example:**

```typescript
// For graffiti text "Hello World"
const svgFilename = createFilename('Hello World', 'svg');
// Returns: "HELLO_WORLD_STZCK.svg"

const pngFilename = createFilename('Hello World', 'png');
// Returns: "HELLO_WORLD_STZCK.png"

// For empty input
const fallbackFilename = createFilename('', 'svg');
// Returns: "STZCK.svg"
```

## Type Definitions

### ProcessedSvg

```typescript
interface ProcessedSvg {
  letter: string;
  svgContent: string;
  width: number;
  height: number;
  pixelData?: PixelDensityData;
  rotation: number;
}
```

### CustomizationOptions

```typescript
interface CustomizationOptions {
  // Background settings
  backgroundEnabled: boolean;
  backgroundColor: string;
  
  // Fill settings
  fillColor: string;
  
  // Outline settings
  stampEnabled: boolean;
  stampColor: string;
  stampWidth: number;
  
  // Shadow effect settings
  shadowEffectEnabled: boolean;
  shadowEffectOffsetX: number;
  shadowEffectOffsetY: number;
  
  // Shield effect settings
  shieldEnabled: boolean;
  shieldColor: string;
  shieldWidth: number;
}
```

### HistoryState

```typescript
interface HistoryState {
  inputText: string;
  options: CustomizationOptions;
  presetId?: string;
  timestamp?: number;
}
```

### User

```typescript
interface User {
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    [key: string]: any;
  };
  aud: string;
  // Additional Supabase User properties
}
```

### ExportControls

Component for export controls with authentication-based access control.

```typescript
interface ExportControlsProps {
  onCopyToPngClipboard: () => void;
  onSaveAsSvg?: () => void;
  onShare?: () => void;
  isExporting: boolean;
  showAllButtons?: boolean;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  onCopyToPngClipboard,
  onSaveAsSvg,
  onShare,
  isExporting,
  showAllButtons = false
}) => {
  // Authentication check for SVG export
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  
  // Handle disabled SVG export click (triggers auth modal)
  const handleDisabledSvgClick = () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('auth:trigger-modal', {
        detail: { view: AUTH_VIEWS.SIGN_IN, reason: 'svg_export' }
      }));
    }
  };
  
  // Component implementation
};
```

**Props:**

| Name | Type | Description |
|------|------|-------------|
| `onCopyToPngClipboard` | `() => void` | Handler for PNG clipboard export (labeled as "Save PNG") |
| `onSaveAsSvg` | `() => void` | Handler for SVG file export (requires authentication) |
| `onShare` | `() => void` | Handler for share functionality (optional) |
| `isExporting` | `boolean` | Whether export operation is in progress |
| `showAllButtons` | `boolean` | Whether to show all export options (default: false) |

**Features:**

- **PNG Export**: Always available via clipboard with custom filename format
- **SVG Export**: Authentication required, disabled state with sign-in prompt for unauthenticated users
- **Custom Event System**: Triggers authentication modal when unauthenticated users click SVG export
- **Responsive Design**: Consistent button styling and tooltips

**Usage Example:**

```tsx
<ExportControls
  onCopyToPngClipboard={() => copyToClipboard()} // Available to all users
  onSaveAsSvg={() => exportSvg()}                // Requires authentication
  isExporting={false}
  showAllButtons={true}
/>
``` 