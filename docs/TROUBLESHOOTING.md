# Stizack Troubleshooting Guide

This guide addresses common issues you might encounter while developing, testing, or using the Stizack application.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [SVG Processing Issues](#svg-processing-issues)
- [Customization Problems](#customization-problems)
- [Performance Concerns](#performance-concerns)
- [Environment Setup](#environment-setup)
- [Build and Deployment](#build-and-deployment)

## Authentication Issues

### OTP Verification Not Working

**Symptoms:**
- Verification emails not being received
- OTP codes not being accepted
- Verification banner not showing up

**Solutions:**
1. **Email not received**
   - Check spam/junk folders
   - Verify Supabase email templates are properly configured
   - Review Supabase logs for email sending errors

2. **OTP code not accepted**
   - Ensure code is entered correctly (6 digits)
   - Check if verification has expired (30-minute limit)
   - Verify that `verifyOtp` is being called with correct parameters

3. **Verification banner issues**
   - Check localStorage for verification state
   - Ensure banner component is properly mounted in App.tsx
   - Verify CSS styles aren't hiding the banner

### Tab Switching Authentication Loss

**Problem**: Users are logged out when switching browser tabs and returning to the application.

**Symptoms**:
- Authentication works properly after page refresh
- Tab switching works after refresh but fails on initial load
- Browser console shows repeated auth hook re-renders
- Multiple simultaneous requests to Supabase user endpoint

**Root Causes**:
- Race conditions in tab visibility handling
- Multiple concurrent auth state checks
- getCurrentUser function failures despite successful API calls
- State synchronization issues

**Solutions**:

1. **Verify Latest Implementation**: Ensure you're using the enhanced tab visibility handling:
   ```typescript
   // Check AuthProvider.tsx for debounced visibility handling
   const visibilityChangeInProgressRef = useRef(false);
   
   // Verify debounced tab visibility changes with 500ms delay
   debounceTimeout = setTimeout(async () => {
     // Enhanced visibility change logic
   }, 500);
   ```

2. **Check getCurrentUser Function**: Verify the enhanced implementation with retry logic:
   ```typescript
   // Should include user data caching and retry logic
   const user = await getCurrentUser(AUTH_CONFIG.maxUserFetchRetries);
   ```

3. **Monitor Browser Console**: Look for these specific log patterns:
   ```
   ✅ Good: "Using cached user data (visible tab with recent cache)"
   ⚠️  Warning: "Error getting current user (attempt X/4)"
   ❌ Error: "Auth state change with session but no user data"
   ```

4. **Verify Configuration**: Check AUTH_CONFIG values are appropriate:
   ```typescript
   // Production-optimized values
   stateTransitionDelay: 300,
   retryDelay: 6000,
   userFetchTimeout: 8000,
   maxUserFetchRetries: 3
   ```

### getCurrentUser Function Errors

**Problem**: getCurrentUser function fails repeatedly despite successful network requests.

**Symptoms**:
- Console shows retry attempts: "Error getting current user (attempt X/4)"
- Network tab shows successful 200 responses from `/auth/v1/user`
- Authentication state becomes inconsistent

**Debugging Steps**:

1. **Check Network vs Application State**:
   ```bash
   # In browser console, check if API calls succeed
   fetch('/auth/v1/user', { headers: { Authorization: 'Bearer ' + session.access_token }})
   ```

2. **Verify Cache State**:
   ```typescript
   // Check if cached user data is being used
   console.log('Cache TTL:', USER_CACHE_TTL);
   console.log('Last fetch time:', lastUserFetchTime);
   ```

3. **Monitor Timeout Issues**:
   ```typescript
   // Check if timeouts are appropriate for your environment
   const timeoutMs = document.hidden ? 8000 : (import.meta.env.PROD ? 5000 : 3000);
   ```

**Solutions**:

1. **Increase Timeout Values**: For slower networks, increase timeouts in AUTH_CONFIG
2. **Check Background Tab Behavior**: Verify longer timeouts for hidden tabs
3. **Verify Fallback Logic**: Ensure cached data is used when fresh requests fail
4. **Network Connectivity**: Check for intermittent connectivity issues

### Session Persistence Issues

**Problem**: Sessions don't persist across browser restarts or tab switches.

**Symptoms**:
- Users need to sign in again after closing browser
- "Remember Me" functionality not working
- Session data lost during tab switches

**Solutions**:

1. **Check Storage Implementation**:
   ```typescript
   // Verify custom storage adapter in supabase.ts
   storage: {
     async getItem(key: string) {
       // Should prioritize valid sessions and handle "Remember Me"
     }
   }
   ```

2. **Verify localStorage Access**:
   ```javascript
   // Test localStorage functionality
   try {
     localStorage.setItem('test', 'value');
     localStorage.removeItem('test');
   } catch (e) {
     console.error('localStorage not available:', e);
   }
   ```

3. **Check Session Configuration**:
   ```typescript
   // Verify Supabase client configuration
   auth: {
     persistSession: true,
     autoRefreshToken: true,
     detectSessionInUrl: true,
   }
   ```

### Authentication State Inconsistencies

**Problem**: Authentication state becomes inconsistent, showing conflicting information.

**Symptoms**:
- User object exists but session is null (or vice versa)
- isAuthenticated returns different values than expected
- Loading states stuck in loading position

**Debugging**:

1. **Check State Consistency**:
   ```typescript
   const authState = useAuthStore.getState();
   console.log('Auth State:', {
     user: authState.user,
     session: authState.session,
     status: authState.status,
     isSessionLoading: authState.isSessionLoading,
     isUserDataLoading: authState.isUserDataLoading
   });
   ```

2. **Verify Initialization**:
   ```typitten
   // Check if auth has been properly initialized
   if (!authState.hasInitialized()) {
     await authState.initialize();
   }
   ```

**Solutions**:

1. **Force Re-initialization**: Call `initialize()` to reset auth state
2. **Clear Cached Data**: Clear localStorage and session storage
3. **Check for Race Conditions**: Ensure only one initialization happens at a time

### OTP Verification Issues

**Problem**: OTP codes not working or verification failing.

**Common Issues**:
- Code expired before entry
- Incorrect code format
- Network issues during verification
- Multiple verification attempts

**Solutions**:

1. **Check Code Format**: Ensure 6-digit numeric codes
2. **Verify Timing**: Check if code was entered within expiration window
3. **Network Connectivity**: Ensure stable connection during verification
4. **Resend Logic**: Implement proper resend functionality with rate limiting

### Google OAuth Issues

**Problem**: Google OAuth sign-in fails or redirects incorrectly.

**Common Causes**:
- Incorrect OAuth configuration
- Invalid redirect URLs
- Missing or expired credentials

**Solutions**:

1. **Verify OAuth Configuration**:
   ```typescript
   // Check Google OAuth setup in Supabase dashboard
   // Ensure redirect URLs match your application URLs
   ```

2. **Check Credentials**: Verify Google OAuth client ID and secret
3. **Test Redirect URLs**: Ensure all redirect URLs are properly configured

## SVG Processing Issues

### SVGs Not Rendering Properly

**Symptoms:**
- Empty spaces where letters should appear
- Distorted or misaligned letters 
- Error messages in console

**Solutions:**
1. **Missing SVGs**
   - Check network requests to verify SVG paths
   - Ensure letterSvgs mapping has correct file paths
   - Verify SVG files exist in the assets directory

2. **Positioning problems**
   - Check overlap calculations in letterUtils.js
   - Review density data in letterDensity.js
   - Try adjusting containerScale value

3. **SVG rendering errors**
   - Check for malformed SVG content
   - Verify SVG sanitization isn't removing critical elements
   - Look for browser compatibility issues

### Rate Limiting Triggered

**Symptoms:**
- "Please wait before generating more graffiti" message
- Generation stops working temporarily
- Warning toasts appearing

**Solutions:**
1. Review `lib/rateLimit.ts` configuration
2. Slow down operation frequency in development
3. Clear rate limit data from localStorage during testing

## Customization Problems

### Customization Not Applied

**Symptoms:**
- Changes to controls don't affect rendered output
- Customization state resets unexpectedly
- History tracking not working

**Solutions:**
1. **Changes not applied**
   - Check control component props in component hierarchy
   - Verify handleCustomizationChange is properly connected
   - Inspect Zustand store for state changes

2. **State resets**
   - Look for component unmounting issues
   - Check for interference with history management
   - Verify no duplicate state updates are occurring

3. **History tracking**
   - Ensure history entries are being created
   - Check if `updateWithHistory` is called on final state changes
   - Verify `isUndoRedoOperation` flag during operations

## Performance Concerns

### Slow Rendering

**Symptoms:**
- UI freezes during generation
- Slow response when applying customizations
- Lag when entering text or changing styles

**Solutions:**
1. **Generation performance**
   - Check batch size in useGraffitiGeneratorWithZustand.ts
   - Verify SVG caching is working properly
   - Look for unnecessary re-renders

2. **UI responsiveness**
   - Use React DevTools Profiler to identify bottlenecks
   - Check for missing memoization with useCallback or useMemo
   - Verify large component trees aren't re-rendering unnecessarily

3. **Memory issues**
   - Watch for memory leaks in useEffect cleanup
   - Check for accumulating SVG data in cache
   - Monitor large object creation during customization

## Environment Setup

### Missing Environment Variables

**Symptoms:**
- Application crashes on startup
- Authentication features don't work
- "Missing Supabase environment variables" errors

**Solutions:**
1. Copy `.env.example` to `.env` or `.env.local`
2. Populate all required variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```
3. Restart the development server after adding variables

### Development Server Issues

**Symptoms:**
- "npm run dev" fails to start
- Server starts but application doesn't load
- Module not found errors

**Solutions:**
1. **Server won't start**
   - Check for port conflicts (default 3000)
   - Verify node_modules is properly installed
   - Check for Node.js version compatibility

2. **Application doesn't load**
   - Check browser console for errors
   - Verify Vite configuration in vite.config.ts
   - Clear browser cache and reload

## Build and Deployment

### Build Failures

**Symptoms:**
- "npm run build" command fails
- TypeScript errors during build
- Missing dependencies

**Solutions:**
1. **TypeScript errors**
   - Address all type issues before building
   - Check tsconfig.json configuration
   - Verify third-party library types are installed

2. **Build process fails**
   - Check for environment variables needed during build
   - Verify build scripts in package.json
   - Look for path resolution issues

### Vercel Deployment Problems

**Symptoms:**
- Deployment succeeds but site doesn't work
- Authentication fails in production but works locally
- Missing assets or styles

**Solutions:**
1. **Environment variables**
   - Verify all required variables are set in Vercel dashboard
   - Use production values not development ones
   - Check CORS and domain configuration

2. **Build configuration**
   - Verify build output directory matches Vercel configuration
   - Check build command in Vercel settings
   - Review Vercel build logs for errors

## Common Error Messages

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Failed to sign in" | Authentication credentials issue | Check email/password, verify Supabase configuration |
| "Please wait a moment before generating more graffiti" | Rate limiting triggered | Wait for cooldown or adjust rate limits |
| "Failed to fetch SVG" | Network or asset path issue | Check SVG paths, network connection, CORS settings |
| "Verification failed" | OTP code invalid or expired | Request new code, check email for latest code |
| "Cannot read properties of undefined" | Object access before initialization | Check component rendering order, add null checks |

## Debug Mode

To enable enhanced debugging:

1. Set environment to development mode:
   ```
   VITE_APP_ENV=development
   ```

2. Use browser developer tools:
   - Network tab for API and SVG requests
   - Console for detailed error messages
   - Application tab to inspect localStorage

3. Enable debug overlays in the application:
   - Value overlays for state inspection
   - Debug panel for overlap calculations
   - Color panel for theme inspection

## Getting Further Help

If the solutions above don't resolve your issue:

1. Check the GitHub Issues for similar problems and solutions
2. Search the codebase for error messages or related functionality
3. Create a detailed bug report including:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details
   - Console logs or screenshots 