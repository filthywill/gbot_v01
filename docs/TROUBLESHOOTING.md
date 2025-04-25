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

### Google Sign-In Problems

**Symptoms:**
- "Invalid credentials" errors
- Google button not rendering
- Authentication flow not completing

**Solutions:**
1. **Button not rendering**
   - Check browser console for Google SDK loading errors
   - Verify Google Client ID is correctly set in environment variables
   - Ensure `window.google` object is available

2. **Authentication fails**
   - Verify Authorized JavaScript origins in Google Cloud Console
   - Check Supabase OAuth provider configuration
   - Look for CORS issues in browser console

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