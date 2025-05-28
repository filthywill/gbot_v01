# Stizack.com Production Logging Cleanup Plan

## Overview
This plan addresses the excessive "NEW IMPLEMENTATION" logging messages appearing on the live production site at stizack.com. The goal is to implement proper environment-based logging controls and clean up the production build.

## Phase 1: Investigate Current Build Configuration

### 1.1 Examine Vite Configuration
**File to check:** `vite.config.ts`

**Actions:**
- [ ] Review the current Vite build configuration
- [ ] Check if `build.minify` is properly configured for production
- [ ] Verify if console.log statements are being stripped in production builds
- [ ] Look for any custom plugins that might affect logging
- [ ] Ensure proper environment variable handling

**Expected findings:**
- Determine if Vite is configured to remove console logs in production
- Identify any misconfigurations that allow debug logs to persist

### 1.2 Review Environment Variable Setup
**Files to check:** 
- `.env.production`
- `.env.local` 
- `src/lib/env.ts`
- `package.json` (build scripts)

**Actions:**
- [ ] Verify `VITE_APP_ENV` or similar is set to `'production'` for live deployment
- [ ] Check if `NODE_ENV` is properly set during build process
- [ ] Confirm `isDevelopment()` and `isProduction()` functions work correctly
- [ ] Review build scripts in `package.json` to ensure proper environment setting

**Expected findings:**
- Confirm environment detection is working properly
- Identify any environment variable misconfigurations

## Phase 2: Locate and Analyze Logging Sources

### 2.1 Find "NEW IMPLEMENTATION" Log Sources
**Files to check:**
- `src/hooks/auth/useAuthModalState.ts`
- `src/hooks/auth/useEmailVerification.ts`
- `src/App.tsx` (current implementation)
- `src/App.tsx.backup` (legacy implementation)

**Actions:**
- [ ] Search for all instances of `console.log('🔄 [NEW IMPLEMENTATION]`
- [ ] Identify which hooks/components are generating these messages
- [ ] Determine if these logs are conditional on environment or feature flags
- [ ] Map the call flow that leads to these repeated messages

**Expected findings:**
- Exact location of the problematic logging statements
- Understanding of why they're firing so frequently (likely on every hook call/re-render)

### 2.2 Review Feature Flag Implementation
**Files to check:**
- `src/lib/flags/` (directory)
- Any files importing `FLAGS`
- Code that references `FLAGS.USE_NEW_AUTH_HOOKS`

**Actions:**
- [ ] Examine how feature flags are defined and set
- [ ] Check if `FLAGS.USE_NEW_AUTH_HOOKS` is enabled in production
- [ ] Verify if logging is properly conditional on both flags AND environment
- [ ] Review flag management for production vs development

**Expected findings:**
- Current state of feature flags in production
- Whether logging is properly gated by environment checks

## Phase 3: Implement Logging Controls

### 3.1 Update Logger Utility
**File to modify:** `src/lib/logger.ts`

**Actions:**
- [ ] Enhance logger to support different log levels (DEBUG, INFO, WARN, ERROR)
- [ ] Add environment-based filtering (suppress DEBUG/INFO in production)
- [ ] Create specific methods for development-only logging
- [ ] Ensure production only shows WARN and ERROR levels

**Implementation approach:**
```typescript
// Example structure
const logger = {
  debug: (message: string, data?: any) => {
    if (isDevelopment()) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    if (isDevelopment() || isInfoLoggingEnabled()) {
      console.info(`[INFO] ${message}`, data);
    }
  },
  // ... etc
};
```

### 3.2 Replace Direct Console.log Calls
**Files to modify:**
- All files containing `console.log('🔄 [NEW IMPLEMENTATION]`
- Any other development-specific console.log statements

**Actions:**
- [ ] Replace `console.log('🔄 [NEW IMPLEMENTATION] ...')` with `logger.debug('...')`
- [ ] Add environment checks where logger isn't used
- [ ] Ensure all debug logging goes through controlled channels
- [ ] Remove or gate any other verbose development logging

### 3.3 Update Vite Build Configuration
**File to modify:** `vite.config.ts`

**Actions:**
- [ ] Configure Terser/minifier to drop console statements in production
- [ ] Add build-time environment variable replacement
- [ ] Ensure proper tree-shaking of development-only code
- [ ] Test that debug logs are stripped from production builds

**Implementation approach:**
```typescript
// Example Vite config additions
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
```

