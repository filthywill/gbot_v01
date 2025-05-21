# Authentication Implementation

## Overview

This document outlines the current implementation of authentication in our React+Vite application using Supabase Auth. The implementation focuses on client-side authentication with robust error handling and session persistence across tab switches.

## Current Implementation

### Architecture

- **Client-side Authentication**: Using Supabase's JavaScript client with localStorage-based session storage
- **State Management**: Zustand store (`useAuthStore`) for managing auth state
- **Session Handling**: Enhanced with custom caching for resilient tab switching

### Key Components

1. **AuthProvider.tsx**
   - Initializes authentication
   - Handles tab visibility changes
   - Caches session data for restoration when switching tabs

2. **Supabase Client Configuration**
   - Custom storage implementation
   - Session caching for improved reliability
   - Token refresh handling with retry logic

3. **User Data Management**
   - In-memory caching to reduce API calls
   - Fallback strategies for background tabs
   - Exponential backoff for failures

## Tab Visibility Issue Solution

We've implemented a multi-layered approach to handle authentication persistence when switching between browser tabs:

1. **Session Reference Caching**: Maintains a reference to the last known good session
2. **User Data Caching**: Caches user data with TTL to avoid unnecessary API calls
3. **Visibility Event Handler**: Refreshes authentication state when a tab becomes visible again
4. **Enhanced Storage Implementation**: Prioritizes returning valid sessions regardless of tab state
5. **Token Refresh Optimization**: Special handling for background tabs

## Future Considerations

While our current implementation effectively addresses our immediate needs, it's worth noting that Supabase is evolving toward server-side authentication approaches:

> **Future Migration Note**: Consider migrating to Supabase's server-side authentication approach using the `@supabase/ssr` package if transitioning to a server-rendered framework (like Next.js). The server-side approach offers improved security by using HTTP-only cookies instead of localStorage and provides better integration with server components.

This migration would be appropriate when:
- Moving to a server-rendered framework like Next.js, SvelteKit, etc.
- Looking to improve security by using HTTP-only cookies
- Needing to access authentication data directly in server components

## Best Practices

1. Always refresh user data after token refresh
2. Handle background tab authentication gracefully
3. Implement proper error handling with retries
4. Keep authentication state non-blocking for UI rendering
5. Maintain clear separation between authentication logic and UI components

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [PKCE Flow in Supabase](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Troubleshooting Auth Issues](https://supabase.com/docs/guides/troubleshooting) 