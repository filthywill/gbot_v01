
```markdown
# Supabase Auth Session Loss Between Tab Switches

## Issue Summary
When logging in with Google and switching between tabs, the authentication session is lost and the user is logged out upon returning to the application tab. This happens despite having the "Remember me" preference enabled.

## Root Cause Analysis

### Browser Storage Partition Issue
- Browsers sometimes use different storage partitions for different tabs, especially in production environments
- This behavior is more common with third-party cookies being restricted in modern browsers
- The session data appears to exist but user data can't be retrieved after tab switching

### Authentication Flow Diagnosis
- Console logs show `getSession() session from storage {"subtype":"null","type":"object","value":null"}`
- Error logs reveal multiple failed user retrieval attempts: `Error getting current user (attempt 1/3)`
- Warning appears: `[Warning] Auth state change with session but no user data`

### Session Storage Implementation
The custom storage implementation in `supabase.ts` uses the `rememberMe` preference from localStorage to determine whether to return stored session data:

```typescript
storage: {
  async getItem(key: string) {
    try {
      // Always get from localStorage first to check preferences
      const preferences = JSON.parse(localStorage.getItem('gbot-preferences') || '{}');
      const rememberMe = preferences?.state?.rememberMe ?? false;
      
      if (!rememberMe && key === 'gbot_supabase_auth') {
        logger.debug('Not returning stored session due to rememberMe=false');
        return null;
      }
      
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      logger.error('Error reading from storage:', error);
      return null;
    }
  }
}
```

## Solution Recommendations

### 1. Improve Session Storage Implementation

Update the storage implementation to handle social login sessions differently, ensuring Google auth sessions are always preserved:

```typescript
storage: {
  async getItem(key: string) {
    try {
      // Always get from localStorage first to check preferences
      const preferences = JSON.parse(localStorage.getItem('gbot-preferences') || '{}');
      const rememberMe = preferences?.state?.rememberMe ?? true; // Default to true
      
      // Get the value from storage
      const value = localStorage.getItem(key);
      
      // For Google auth specifically, always return the stored session
      if (key === 'gbot_supabase_auth') {
        const sessionData = value ? JSON.parse(value) : null;
        const isGoogleAuth = sessionData?.provider === 'google' || 
                            (sessionData?.user?.app_metadata?.provider === 'google');
        
        // Always maintain Google auth sessions, regardless of rememberMe
        if (isGoogleAuth) return value;
        
        // For other auth types, respect rememberMe setting
        if (!rememberMe) {
          logger.debug('Not returning stored session due to rememberMe=false');
          return null;
        }
      }
      
      return value;
    } catch (error) {
      logger.error('Error reading from storage:', error);
      return null;
    }
  }
}
```

### 2. Implement Cross-Tab Communication

Add communication between tabs to ensure authentication state stays in sync:

```typescript
// Add to src/lib/supabase.ts
let authChannel: BroadcastChannel | null = null;

try {
  authChannel = new BroadcastChannel('auth_channel');
  
  // Listen for auth events from other tabs
  authChannel.onmessage = (event) => {
    if (event.data.type === 'AUTH_STATE_CHANGE') {
      // Force refresh the auth state in this tab
      const authStore = useAuthStore.getState();
      authStore.initialize();
    }
  };
} catch (e) {
  // Fallback for browsers that don't support BroadcastChannel
  logger.warn('BroadcastChannel not supported, cross-tab sync disabled');
}

// Modify the auth state change handler to broadcast changes
supabase.auth.onAuthStateChange((event, session) => {
  // Existing code...
  
  // Broadcast auth state change to other tabs
  if (authChannel && ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(event)) {
    authChannel.postMessage({ type: 'AUTH_STATE_CHANGE', event });
  }
});
```

### 3. Enhance Session Recovery

Improve the user data retrieval process to better handle recovery scenarios:

```typescript
// In getCurrentUser function
export const getCurrentUser = async (maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) return null;
      
      // Try to get user with session
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      return data?.user || null;
    } catch (error) {
      retries++;
      logger.error(`[Error] Error getting current user (attempt ${retries}/${maxRetries}):`, error);
      
      // On last retry, try refreshing the token first
      if (retries === maxRetries - 1) {
        try {
          await supabase.auth.refreshSession();
        } catch (refreshError) {
          logger.error('Failed to refresh session:', refreshError);
        }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return null;
};
```

## Conclusion

The issue is not with the "Remember me" preference implementation but rather with how browser tab switching affects session storage and retrieval in production environments. The solutions above will make your authentication system more resilient to tab switching and ensure Google authentication sessions are preserved regardless of the "Remember me" setting.

For additional protection, consider implementing session refresh mechanisms and more robust error handling throughout your authentication flow to prevent users from being unexpectedly logged out.
```
