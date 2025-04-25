
# Detailed Refactoring Roadmap

## Phase 1: Setup and Preparation

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
   ```

## Phase 2: Custom Hook Extraction

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

### Step 2: Auth Modal State Hook
1. Create `src/hooks/auth/useAuthModalState.ts`
2. Extract state variables from App.tsx:
   - showAuthModal
   - authModalMode
3. Extract URL parameter handling logic
4. Create and export the hook interface

### Step 3: Create Utility Functions
1. Create `src/lib/auth/verification.ts` for shared verification functions
2. Move URL cleaning utilities and shared logic

## Phase 3: Component Extraction

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

## Phase 4: Modal Component Extraction

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

## Phase 5: App Component Refactoring

1. Create temporary App.tsx.new file
2. Import all new hooks and components
3. Restructure App component to use all new components
4. Add comments explaining the component structure
5. Add TypeScript types for all props and variables
6. Rename App.tsx.new to App.tsx when complete

## Phase 6: Testing

1. Run the application locally
   ```bash
   npm run dev
   ```

2. Test all authentication flows:
   - Email verification flow
   - Sign-in flow
   - Password reset flow
   - Session handling

3. Test application functionality:
   - Graffiti generation
   - Customization
   - UI behaviors

4. Test all modals and UI components

5. Test developer tools if in development mode

## Phase 7: Optimization and Cleanup

1. Review all extracted hooks for optimization opportunities
2. Check for any repeated code that could be further extracted
3. Ensure consistent error handling across all components
4. Add proper JSDoc comments to all hooks and components
5. Remove any unused imports or variables

## Phase 8: Documentation

1. Update documentation to reflect the new component structure
2. Add code comments explaining complex logic
3. Create flow diagrams for authentication if needed
4. Document testing approach and results

## Phase 9: Final Review and Commit

1. Run TypeScript compiler to check for type errors
   ```bash
   npx tsc --noEmit
   ```

2. Run ESLint to check for code style issues
   ```bash
   npm run lint
   ```

3. Run final application tests to ensure everything works correctly

4. Commit changes with descriptive message
   ```bash
   git add .
   git commit -m "Refactor: Extract authentication logic and components from App.tsx"
   ```

5. Create pull request for review

This roadmap provides a step-by-step guide to complete the refactoring of App.tsx, extracting authentication logic into custom hooks and components.
