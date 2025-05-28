
# Authentication Tab Visibility Issue: Implementation Plan

## Overview

This document outlines the implementation steps to address the session persistence issue when switching between browser tabs. The plan includes three key solutions:

1. Add tab visibility event handling
2. Improve token refresh handling
3. Fix custom storage implementation

## Implementation Steps

### 1. Add Tab Visibility Event Handler

**File:** `src/components/Auth/AuthProvider.tsx`

```tsx
// Add this effect to the AuthProvider component
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (!document.hidden) {
      logger.debug('Tab became visible, refreshing auth state');
      try {
        // Force refresh the session when tab becomes visible
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          // Update store if needed
          const currentState = useAuthStore.getState();
          if (!currentState.session || currentState.session.expires_at !== data.session.expires_at) {
            logger.debug('Refreshing auth state after tab visibility change');
            currentState.setSession(data.session);
            // Also refresh user data
            const user = await getCurrentUser();
            if (user) currentState.setUser(user);
          }
        }
      } catch (err) {
        logger.error('Error refreshing session on visibility change:', err);
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

**How to implement:**
1. Open `src/components/Auth/AuthProvider.tsx`
2. Import `getCurrentUser` from `'../../lib/supabase'` if not already imported
3. Add the new effect after the existing useEffect statements
4. Test by logging in and switching between tabs

### 2. Improve Token Refresh Handling

**File:** `src/lib/supabase.ts`

```tsx
// Enhance TOKEN_REFRESHED handler
else if (event === 'TOKEN_REFRESHED') {
  logger.debug('Auth token refreshed');
  
  // After token refresh, update user data with retries
  let retryCount = 0;
  const maxRetries = AUTH_CONFIG.maxUserFetchRetries;
  
  const updateUserData = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        // Direct access to the store
        authStore.setUser(data.user);
        logger.debug('Updated user data after token refresh');
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to update user data after token refresh:', err);
      return false;
    }
  };
  
  const retryUpdateUserData = async () => {
    const success = await updateUserData();
    if (!success && retryCount < maxRetries) {
      retryCount++;
      logger.debug(`Retrying user data update after token refresh (attempt ${retryCount}/${maxRetries})`);
      setTimeout(retryUpdateUserData, AUTH_CONFIG.tokenExchangeRetryDelay);
    }
  };
  
  setTimeout(retryUpdateUserData, AUTH_CONFIG.stateTransitionDelay);
}
```

**How to implement:**
1. Open `src/lib/supabase.ts`
2. Find the `TOKEN_REFRESHED` case in the `onAuthStateChange` event handler
3. Replace the existing implementation with the enhanced version above
4. Test token refresh by staying logged in for extended periods

### 3. Fix Custom Storage Implementation

**File:** `src/lib/supabase.ts`

```tsx
// Update the custom storage implementation
storage: {
  async getItem(key: string) {
    try {
      // Always get from localStorage first
      const value = localStorage.getItem(key);
      
      // If this is a session key and tab is visible, prioritize returning the value
      if (key === 'gbot_supabase_auth' && !document.hidden) {
        // Check if it's a valid session before returning
        try {
          if (value) {
            const session = JSON.parse(value);
            const now = Math.floor(Date.now() / 1000);
            
            // If session exists and not expired, return it regardless of rememberMe
            if (session && session.expires_at && session.expires_at > now) {
              if (import.meta.env.DEV) {
                logger.debug('Auth storage getItem: returning valid session from visible tab');
              }
              return value;
            }
          }
        } catch (parseError) {
          logger.error('Error parsing session data:', parseError);
        }
      }
      
      // After handling visibility, apply remember me logic
      const preferences = JSON.parse(localStorage.getItem('gbot-preferences') || '{}');
      const rememberMe = preferences?.state?.rememberMe ?? false;
      
      if (import.meta.env.DEV) {
        logger.debug('Auth storage getItem:', { key, rememberMe });
      }
      
      // If remember me is false, don't return any stored session
      if (!rememberMe && key === 'gbot_supabase_auth') {
        logger.debug('Not returning stored session due to rememberMe=false');
        return null;
      }
      
      return value;
    } catch (error) {
      logger.error('Error reading from storage:', error);
      return null;
    }
  },
  
  // Keep the other methods unchanged
  setItem: /* existing implementation */,
  removeItem: /* existing implementation */
}
```

**How to implement:**
1. Open `src/lib/supabase.ts`
2. Find the `storage` object in the Supabase client initialization
3. Replace the `getItem` method with the enhanced version above
4. Keep the existing `setItem` and `removeItem` methods unchanged
5. Test by toggling "Remember Me" and switching between tabs

## Testing Plan

1. **Basic Authentication Flow:**
   - Sign in with valid credentials
   - Verify successful authentication
   - Sign out and verify session cleared

2. **Tab Switching Test:**
   - Sign in with valid credentials
   - Switch to another tab for at least 30 seconds
   - Return to the application tab
   - Verify the session is maintained

3. **Remember Me Test:**
   - Sign in with "Remember Me" unchecked
   - Close the browser and reopen
   - Verify you are prompted to sign in again
   - Sign in with "Remember Me" checked
   - Close the browser and reopen
   - Verify you remain signed in

4. **Long Session Test:**
   - Sign in and keep the tab open for extended periods
   - Periodically interact with the application
   - Verify the session is maintained and token refreshes work correctly

## Implementation Completion Checklist

- [ ] Add tab visibility event handler to `AuthProvider.tsx`
- [ ] Enhance token refresh handling in `supabase.ts`
- [ ] Fix custom storage implementation in `supabase.ts`
- [ ] Complete all testing scenarios
- [ ] Verify no regression in existing authentication flows
- [ ] Deploy changes to production environment
- [ ] Monitor for any session-related issues in production
