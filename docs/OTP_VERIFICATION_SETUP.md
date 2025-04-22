# Setting Up OTP Verification in Supabase

This guide will help you set up code-based (OTP) verification for your app, which replaces the link-based verification.

## Benefits of Code-Based Verification

- **No Browser Redirects**: Users stay in your app through the entire verification process
- **More Reliable**: Eliminates issues with SPA routing and redirect handling
- **Better User Experience**: Familiar verification approach used by many popular services
- **Simpler Implementation**: No need for complex callback routes or URL parameter handling
- **Enhanced Security**: Uses PKCE flow for improved security
- **Persistent Verification**: Remembers verification state across page refreshes

## Setup Instructions

### 1. Update Supabase Email Template

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication** → **Email Templates**
3. Select the **Confirm signup** template
4. Replace the HTML code with the template from `docs/VERIFICATION_EMAIL_TEMPLATE.html`
5. Save the changes

### 2. Configure Site URL

1. In the Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Make sure your **Site URL** is set to your production domain
3. For local development, you can add `http://localhost:3000` (or your local port) to the additional redirect URLs

### 3. Configure PKCE Flow

1. Make sure your Supabase client is set up with PKCE flow:
```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    // Other auth options...
  }
});
```

2. This enhances security for the authentication flow, including OTP verification

### 4. Implement Verification State Persistence

1. After initiating signup, store verification state:
```typescript
// Store verification state for persistence
const verificationState = {
  email: email,
  startTime: Date.now(),
  attempted: true
};
localStorage.setItem('verificationState', JSON.stringify(verificationState));
localStorage.setItem('verificationEmail', email);
```

2. This allows users to continue verification even after closing the browser or refreshing the page

### 5. Test the Flow

1. Open your application
2. Go through the signup process
3. Check your email for the verification code
4. Enter the code in the verification screen
5. You should be automatically logged in after successful verification
6. Try refreshing the page during verification to test state persistence

## Timeout and Expiration Handling

- Verification codes expire after 30 minutes
- The verification banner shows a countdown timer
- After expiration, users need to request a new code
- Implement timeout handling for verification requests:

```typescript
// Create a timeout promise to handle potential hanging requests
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    reject(new Error('Verification request timed out. Please try again.'));
  }, 10000); // 10 second timeout
});

// Race the verification against the timeout
const result = await Promise.race([
  supabase.auth.verifyOtp({ email, token, type: 'signup' }),
  timeoutPromise
]);
```

## Troubleshooting

### Code Not Arriving

1. Check your spam/junk folder
2. Verify that your Supabase email service is correctly set up
3. Try the "Resend Code" button
4. Ensure your Supabase project has proper email delivery setup (consider using custom SMTP)

### Verification Errors

If you encounter errors during verification:

1. Make sure you're entering the exact code from the email
2. Codes expire after 30 minutes (not 24 hours as previously documented)
3. Check browser console for specific error messages
4. Ensure you're not rate-limited (too many attempts)

### State Persistence Issues

1. Check localStorage access (private browsing might block it)
2. Verify that the verification state is being properly stored
3. Check for any localStorage errors in the console

### Still Having Issues?

- Ensure you have the latest version of the app code
- Clear browser localStorage and try again
- Check Supabase logs for authentication errors
- Verify you're using PKCE flow for enhanced security

## Technical Details

The OTP verification flow works by:

1. Calling `supabase.auth.signUp()` with `emailRedirectTo: undefined` to disable link-based verification
2. Sending a verification code to the user's email
3. User enters the code in the app
4. App calls `supabase.auth.verifyOtp()` to verify the code
5. Upon successful verification, the user is automatically signed in
6. Verification state is persisted in localStorage
7. A verification banner component monitors this state
8. Timeouts ensure the verification process doesn't hang

## Need More Help?

Contact support or open an issue on GitHub if you encounter any problems with this implementation. 