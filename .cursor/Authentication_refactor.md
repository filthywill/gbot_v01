# Detailed Refactoring Roadmap

## Phase 1: Setup and Preparation ✅ COMPLETED

1. Create a new git branch for the refactoring
   ```bash
   git checkout -b refactor/app-component-extraction
   ```

2. Install any needed dependencies (none required for this refactoring)

3. Create directory structure for new files
   ```bash
   mkdir -p src/hooks/auth
   mkdir -p src/components/app
   mkdir -p src/components/modals
   mkdir -p src/lib/flags
   ```

## Phase 2: Feature Flag Implementation ✅ COMPLETED

### Step 1: Create Feature Flag System
1. Create `src/lib/flags/index.ts` file with feature flags
   ```typescript
   // Feature flags for gradual implementation and rollback capability
   export const FLAGS = {
     // Controls whether to use new auth hook implementation
     USE_NEW_AUTH_HOOKS: process.env.NODE_ENV === 'development',
     
     // Controls whether to use new component structure
     USE_NEW_COMPONENTS: process.env.NODE_ENV === 'development',
     
     // Controls debugging of auth state transitions
     DEBUG_AUTH_STATE: false
   };
   ```

2. Create a helper function to dynamically update flags
   ```typescript
   // Add to src/lib/flags/index.ts
   export function updateFlag(flagName: keyof typeof FLAGS, value: boolean): void {
     if (flagName in FLAGS) {
       FLAGS[flagName] = value;
       // Store in localStorage for persistence during development
       if (typeof window !== 'undefined') {
         localStorage.setItem('APP_FLAGS', JSON.stringify(FLAGS));
       }
     }
   }
   ```

3. Create a hook for using feature flags
   ```typescript
   // Create src/hooks/useFeatureFlag.ts
   import { useState, useEffect } from 'react';
   import { FLAGS } from '../lib/flags';

   export function useFeatureFlag(flagName: keyof typeof FLAGS) {
     const [flagValue, setFlagValue] = useState(FLAGS[flagName]);
     
     // Update flag value when it changes
     useEffect(() => {
       const handleStorageChange = () => {
         const storedFlags = localStorage.getItem('APP_FLAGS');
         if (storedFlags) {
           const parsedFlags = JSON.parse(storedFlags);
           if (parsedFlags[flagName] !== undefined) {
             setFlagValue(parsedFlags[flagName]);
           }
         }
       };
       
       window.addEventListener('storage', handleStorageChange);
       return () => window.removeEventListener('storage', handleStorageChange);
     }, [flagName]);
     
     // Function to toggle flag
     const toggleFlag = () => {
       const newValue = !flagValue;
       FLAGS[flagName] = newValue;
       setFlagValue(newValue);
       localStorage.setItem('APP_FLAGS', JSON.stringify(FLAGS));
     };
     
     return [flagValue, toggleFlag] as const;
   }
   ```

4. Create a simple UI control for feature flags in development mode
   ```typescript
   // Create src/components/dev/FeatureFlagControls.tsx
   import React from 'react';
   import { FLAGS } from '../../lib/flags';
   import { useFeatureFlag } from '../../hooks/useFeatureFlag';

   export function FeatureFlagControls() {
     // Only show in development
     if (process.env.NODE_ENV !== 'development') {
       return null;
     }
     
     return (
       <div className="fixed bottom-4 right-4 bg-gray-800 p-3 rounded-lg shadow-lg text-white z-50 opacity-80 hover:opacity-100 transition-opacity">
         <h3 className="text-sm font-bold mb-2">Feature Flags</h3>
         <div className="space-y-2">
           {(Object.keys(FLAGS) as Array<keyof typeof FLAGS>).map(flagName => (
             <FlagToggle key={flagName} flagName={flagName} />
           ))}
         </div>
       </div>
     );
   }

   function FlagToggle({ flagName }: { flagName: keyof typeof FLAGS }) {
     const [value, toggle] = useFeatureFlag(flagName);
     
     return (
       <div className="flex items-center justify-between">
         <span className="text-xs mr-2">{flagName}:</span>
         <button
           onClick={() => toggle()}
           className={`px-2 py-1 text-xs rounded ${value ? 'bg-green-600' : 'bg-red-600'}`}
         >
           {value ? 'ON' : 'OFF'}
         </button>
       </div>
     );
   }
   ```

5. Add the feature flag controls to App.tsx
   ```typescript
   // Example - will be added in actual App.tsx refactoring phase
   // import { FeatureFlagControls } from './components/dev/FeatureFlagControls';
   
   // Then add in the component JSX:
   // {process.env.NODE_ENV === 'development' && <FeatureFlagControls />}
   ```

## Phase 3: Custom Hook Extraction ✅ COMPLETED

### Step 1: Email Verification Hook
1. Create `src/hooks/auth/useEmailVerification.ts`
2. Extract state variables from App.tsx:
   - showVerificationModal
   - verificationEmail
   - verificationError
   - isVerifying
   - pendingVerification
3. Extract verification functions:
   - checkForVerification
   - handleResumeVerification
4. Extract all related useEffect hooks
5. Create and export the hook interface
6. Add proper TypeScript types
7. Add state transition logging for debugging

### Step 2: Auth Modal State Hook
1. Create `src/hooks/auth/useAuthModalState.ts`
2. Extract state variables from App.tsx:
   - showAuthModal
   - authModalMode
3. Extract URL parameter handling logic
4. Create and export the hook interface
5. Add state transition logging for debugging

### Step 3: Create Utility Functions
1. Create `src/lib/auth/verification.ts` for shared verification functions
2. Move URL cleaning utilities and shared logic

### Step 4: Create State Synchronization Utilities
1. Create `src/lib/auth/stateSync.ts` for synchronization utilities
   ```typescript
   // Helper for logging state transitions in development mode
   export function logStateTransition(hookName: string, stateName: string, prevValue: any, newValue: any) {
     if (process.env.NODE_ENV === 'development' || localStorage.getItem('DEBUG_AUTH_STATE') === 'true') {
       console.group(`🔄 State Change: ${hookName} - ${stateName}`);
       console.log('Previous:', prevValue);
       console.log('New:', newValue);
       console.groupEnd();
     }
   }
   
   // Helper to track verification state consistency
   export function checkVerificationStateConsistency() {
     const verificationEmail = localStorage.getItem('verificationEmail');
     const verificationState = localStorage.getItem('verificationState');
     
     if (Boolean(verificationEmail) !== Boolean(verificationState)) {
       console.warn('Verification state inconsistency detected!', {
         hasEmail: Boolean(verificationEmail),
         hasState: Boolean(verificationState)
       });
       
       // Auto-fix the inconsistency in development
       if (process.env.NODE_ENV === 'development') {
         if (verificationEmail && !verificationState) {
           // Create missing state
           const newState = {
             email: verificationEmail,
             startTime: Date.now(),
             resumed: false
           };
           localStorage.setItem('verificationState', JSON.stringify(newState));
           console.info('Auto-fixed by creating verification state');
         } else if (!verificationEmail && verificationState) {
           // Extract email from state
           try {
             const parsedState = JSON.parse(verificationState);
             if (parsedState.email) {
               localStorage.setItem('verificationEmail', parsedState.email);
               console.info('Auto-fixed by extracting email from state');
             }
           } catch (e) {
             // Invalid state, remove it
             localStorage.removeItem('verificationState');
             console.info('Auto-fixed by removing invalid state');
           }
         }
       }
     }
     
     return {
       isConsistent: Boolean(verificationEmail) === Boolean(verificationState),
       hasEmail: Boolean(verificationEmail),
       hasState: Boolean(verificationState)
     };
   }
   ```

## Phase 4: Component Extraction ✅ COMPLETED

### Step 1: Header Component
1. Create `src/components/app/AppHeader.tsx`
2. Extract header JSX from App.tsx
3. Create proper interfaces for props
4. Use existing AuthHeader component

### Step 2: Footer Component
1. Create `src/components/app/AppFooter.tsx`
2. Extract footer JSX from App.tsx
3. Create year calculation logic

### Step 3: Main Content Component
1. Create `src/components/app/AppMainContent.tsx`
2. Extract main content JSX from App.tsx
3. Create comprehensive interface for all graffitiState props
4. Extract hasInitialGeneration logic
5. Connect all event handlers

### Step 4: Dev Tools Component
1. Create `src/components/app/AppDevTools.tsx`
2. Extract developer tools JSX from App.tsx
3. Create props interface

## Phase 5: Modal Component Extraction ✅ COMPLETED

### Step 1: Verification Success Modal
1. Create `src/components/modals/VerificationSuccessModal.tsx`
2. Extract verification success modal JSX from App.tsx
3. Create props interface
4. Implement proper event handlers

### Step 2: Verification Error Modal
1. Create `src/components/modals/VerificationErrorModal.tsx`
2. Extract verification error modal JSX from App.tsx
3. Create props interface
4. Implement proper event handlers

### Step 3: Verification Loading Modal
1. Create `src/components/modals/VerificationLoadingModal.tsx`
2. Extract verification loading modal JSX from App.tsx
3. Create props interface

## Phase 6: Incremental Implementation

### Step 1: Update App.tsx to Support Both Implementations
1. Create a version of App.tsx that can run both old and new implementations (SKIP) ✅ COMPLETED
   ```typescript
   // Example structure (simplified)
   function App() {
     // Get feature flag values
     const [useNewAuthHooks] = useFeatureFlag('USE_NEW_AUTH_HOOKS');
     const [useNewComponents] = useFeatureFlag('USE_NEW_COMPONENTS');
     
     // Initialize states and hooks based on feature flags
     // Original implementation
     const originalStates = useMemo(() => {
       if (!useNewAuthHooks) {
         // Initialize original state variables and effects
         // ... existing App.tsx code
       }
       return null;
     }, [useNewAuthHooks]);
     
     // New implementation with hooks
     const { 
       showVerificationModal, 
       verificationEmail,
       // ... other states 
     } = useNewAuthHooks ? useEmailVerification() : originalStates || {};
     
     const {
       showAuthModal,
       authModalMode,
       // ... other states
     } = useNewAuthHooks ? useAuthModalState() : originalStates || {};
     
     // Render UI based on feature flags
     return (
       <AuthProvider>
         <div className="min-h-screen bg-app text-primary">
           {/* Conditionally render components based on feature flags */}
           {useNewComponents ? (
             <>
               <VerificationBanner 
                 onResumeVerification={handleResumeVerification} 
                 forceShow={!!verificationEmail} 
                 email={verificationEmail || undefined}
                 isAuthenticated={!!user} 
               />
               <AppHeader />
               <AppMainContent {...graffitiState} />
               <AppFooter />
             </>
           ) : (
             <>
               {/* Original JSX structure */}
               {/* ... existing App.tsx render code */}
             </>
           )}
           
           {/* Modals and other UI elements */}
           {/* ... */}
           
           {/* Feature flag controls (dev only) */}
           {process.env.NODE_ENV === 'development' && <FeatureFlagControls />}
         </div>
       </AuthProvider>
     );
   }
   ```

2. Create a component that displays differences between old and new implementations (SKIP) ✅ COMPLETED
   ```typescript
   // src/components/dev/ImplementationComparison.tsx
   import React from 'react';
   
   export function ImplementationComparison({ 
     oldState,
     newState, 
     showDiff = true 
   }: { 
     oldState: Record<string, any>,
     newState: Record<string, any>,
     showDiff?: boolean
   }) {
     if (process.env.NODE_ENV !== 'development') {
       return null;
     }
     
     // Find differences between states
     const differences = Object.keys(newState).filter(key => {
       // Check for value differences but handle cases like undefined vs null
       return !Object.is(newState[key], oldState[key]);
     });
     
     // Only show if there are differences and showDiff is true
     if (differences.length === 0 || !showDiff) {
       return null;
     }
     
     return (
       <div className="fixed left-4 bottom-4 bg-gray-800 p-3 rounded-lg shadow-lg text-white z-50 opacity-80 hover:opacity-100 transition-opacity max-h-80 overflow-auto">
         <h3 className="text-sm font-bold mb-2">State Differences</h3>
         <div className="space-y-2">
           {differences.map(key => (
             <div key={key} className="text-xs">
               <div className="font-bold">{key}:</div>
               <div className="text-red-400">Old: {JSON.stringify(oldState[key])}</div>
               <div className="text-green-400">New: {JSON.stringify(newState[key])}</div>
             </div>
           ))}
         </div>
       </div>
     );
   }
   ```

### Step 2: Implement Gradual Transition Strategy
1. Start with both implementations side-by-side
   - Keep all old code functional
   - Run both implementations in parallel to compare results
   - Log any differences in behavior

2. Create a development utility to compare implementation outputs (SKIP) ✅ COMPLETED
   ```typescript
   // Add to useEmailVerification.ts
   if (process.env.NODE_ENV === 'development') {
     // Compare new hook state with original state
     useEffect(() => {
       // Get original state from App component
       const originalState = window.__ORIGINAL_AUTH_STATE__;
       if (originalState) {
         // Log differences
         const differences = Object.keys(originalState)
           .filter(key => originalState[key] !== state[key])
           .map(key => ({
             key,
             original: originalState[key],
             new: state[key]
           }));
         
         if (differences.length > 0) {
           console.group('Email Verification State Differences:');
           differences.forEach(diff => {
             console.log(`${diff.key}:`, { original: diff.original, new: diff.new });
           });
           console.groupEnd();
         }
       }
     }, [state]);
   }
   ```

3. Establish test cases for all critical flows
   - Document each authentication scenario
   - Create test checklist for manual verification
   - Compare behavior between implementations

4. Switch components one by one
   - Start with low-risk components (Footer, Header)✅
   - Move to main content components✅
   - Finally switch auth-specific components

5. Add monitoring for authentication failures
   ```typescript
   // In src/lib/auth/monitoring.ts
   type AuthError = {
     component: string;
     action: string;
     error: Error | string;
     timestamp: number;
     userEmail?: string;
   };
   
   const authErrors: AuthError[] = [];
   
   export function logAuthError(component: string, action: string, error: Error | string, userEmail?: string) {
     const newError = {
       component,
       action,
       error: error instanceof Error ? error.message : error,
       timestamp: Date.now(),
       userEmail
     };
     
     authErrors.push(newError);
     
     // Log to console in development
     if (process.env.NODE_ENV === 'development') {
       console.error(`Auth Error [${component}] ${action}:`, error);
     }
     
     // In production, could send to monitoring service
     // if (process.env.NODE_ENV === 'production') {
     //   sendToMonitoring(newError);
     // }
   }
   
   export function getAuthErrors() {
     return [...authErrors];
   }
   
   export function clearAuthErrors() {
     authErrors.length = 0;
   }
   ```

## Phase 7: App Component Refactoring

1. Create temporary App.tsx.new file
2. Import all new hooks and components
3. Restructure App component to use all new components
4. Add comments explaining the component structure
5. Add TypeScript types for all props and variables
6. Implement feature flag support in the new file
7. Add state synchronization safeguards
8. Rename App.tsx.new to App.tsx when complete

## Phase 8: Testing

1. Create automated test cases to verify behavior consistency
   ```typescript
   // Example test case structure
   describe('Authentication Flow', () => {
     test('Email verification process works correctly', async () => {
       // Test verification flow 
     });
     
     test('Password reset flow works correctly', async () => {
       // Test password reset flow
     });
     
     // More test cases...
   });
   ```

2. Run the application locally with both implementations
   ```bash
   npm run dev
   ```

3. Test all authentication flows with both implementations:
   - Email verification flow
   - Sign-in flow
   - Password reset flow
   - Session handling

4. Test application functionality:
   - Graffiti generation
   - Customization
   - UI behaviors

5. Test all modals and UI components

6. Test developer tools if in development mode

7. Test feature flag controls to ensure they properly toggle implementations

8. Test state synchronization by intentionally creating inconsistent states

## Phase 9: Optimization and Cleanup

1. Review all extracted hooks for optimization opportunities
2. Check for any repeated code that could be further extracted
3. Ensure consistent error handling across all components
4. Add proper JSDoc comments to all hooks and components
5. Remove any unused imports or variables
6. Remove any debug code not intended for production
7. Finalize logging and monitoring

## Phase 10: Rollout Strategy

1. Implement canary deployment
   - Deploy to a subset of users first
   - Add a "rollback to old version" button in production for emergency use
   ```typescript
   // Example rollback button for production emergencies
   function EmergencyRollbackButton() {
     if (process.env.NODE_ENV !== 'production') return null;
     
     return (
       <button
         onClick={() => {
           // Set all feature flags to false
           localStorage.setItem('APP_FLAGS', JSON.stringify({
             USE_NEW_AUTH_HOOKS: false,
             USE_NEW_COMPONENTS: false
           }));
           // Force reload to apply changes
           window.location.reload();
         }}
         className="fixed bottom-4 left-4 bg-red-600 text-white p-2 rounded text-xs opacity-50 hover:opacity-100"
       >
         Emergency: Rollback Auth
       </button>
     );
   }
   ```

2. Monitor authentication metrics
   - Track authentication success rate
   - Track verification completion rate
   - Compare metrics between old and new implementations

3. Create a rollback plan
   - Document exact steps to revert changes
   - Practice rollback procedure
   - Establish criteria for triggering rollback

4. Full deployment
   - Once confident, remove feature flags
   - Clean up dual implementation code
   - Remove development utilities

## Phase 11: Documentation

1. Update documentation to reflect the new component structure
2. Add code comments explaining complex logic
3. Create flow diagrams for authentication if needed
4. Document testing approach and results
5. Create user-facing documentation for any visible changes
6. Document lessons learned and improvements made

## Phase 12: Final Review and Commit

1. Run TypeScript compiler to check for type errors
   ```bash
   npx tsc --noEmit
   ```

2. Run ESLint to check for code style issues
   ```bash
   npm run lint
   ```

3. Run final application tests to ensure everything works correctly

4. Clean up any remaining development code
   ```typescript
   // Remove development-only utilities
   if (process.env.NODE_ENV === 'production') {
     // These should be conditionally imported or tree-shaken
     // to not be included in production builds
   }
   ```

5. Commit changes with descriptive message
   ```bash
   git add .
   git commit -m "Refactor: Extract authentication logic and components from App.tsx"
   ```

6. Create pull request for review

7. After approval, merge and deploy incrementally:
   - First with feature flags defaulting to off
   - Gradually enable for more users
   - Finally enable for all users

This roadmap provides a comprehensive step-by-step guide to complete the refactoring of App.tsx, with careful attention to risk management through feature flags, incremental implementation, and state synchronization safeguards.