# Password Reset Flow Setup for GraffitiSOFT

This document outlines how to correctly configure and test the password reset flow using Supabase Auth with the Direct Link approach.

## Email Template Configuration in Supabase

### Reset Password Email Template

When setting up your email template in Supabase Dashboard (Authentication > Email Templates > Reset Password), use the following configuration:

```html
<h2>Reset Your Password</h2>
<p>Click the button below to reset your password:</p>
<a href="{{ .SiteURL }}/auth/reset-password#access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&expires_in={{ .ExpiresIn }}&token_type=bearer&type=recovery">Reset Password</a>

<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p>{{ .SiteURL }}/auth/reset-password#access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&expires_in={{ .ExpiresIn }}&token_type=bearer&type=recovery</p>

<p>If you're having trouble, please contact support.</p>
```

> **Important Note:** Make sure your router implementation can handle the `/auth/reset-password` path. Our application router has been updated to support this path.

## PKCE Flow Integration

Our password reset flow is integrated with PKCE (Proof Key for Code Exchange) authentication flow for enhanced security:

```typescript
// In src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    flowType: 'pkce', // Enhanced security flow
    // Other options...
  }
});
```

The PKCE flow provides additional security for the token-based authentication used in the password reset process by:
- Preventing token interception
- Ensuring that only the client that initiated the reset can complete it
- Protecting against cross-site request forgery

## How It Works

1. **User Requests Password Reset:** When a user clicks "Forgot Password", they enter their email and we send a reset email using Supabase's `resetPasswordForEmail` method.

2. **Email Delivery:** Supabase sends an email with a secure link containing authentication tokens. The link directs to our `/auth/reset-password` route.

3. **Password Reset Form:** When the user clicks the link, they're taken to a form where they can create a new password. The component automatically extracts the token from the URL.

4. **Password Update:** After the user submits a new password, we call Supabase's `updateUser` method, which verifies the token and updates the password.

5. **Completion:** After successful password reset, the user is redirected to the login page with a success message.

## Implementation Details

### Request Password Reset

```typescript
const handleResetPassword = async (email: string) => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Get the current hostname for the redirect URL
    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/reset-password`;
    
    logger.info('Sending password reset email with direct link', { email, redirectUrl: redirectTo });
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });
    
    if (error) throw error;
    
    setResetEmailSent(true);
    logger.info('Password reset email sent successfully');
  } catch (error) {
    logger.error('Password reset error:', error);
    setError(error instanceof Error ? error.message : 'Failed to send password reset email');
  } finally {
    setIsLoading(false);
  }
};
```

### Extract Tokens From URL

```typescript
// In the ResetPasswordPage component
useEffect(() => {
  // Extract token from URL hash fragment
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const token = hashParams.get('access_token');
  
  if (!token) {
    setError('Invalid or missing reset token');
    logger.error('Password reset attempted without valid token');
    return;
  }
  
  // Set the session with the token
  const setSession = async () => {
    try {
      const refreshToken = hashParams.get('refresh_token') || '';
      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken
      });
      
      if (error) throw error;
      if (!data.session) throw new Error('No session created');
      
      setIsSessionSet(true);
    } catch (error) {
      logger.error('Error setting session for password reset:', error);
      setError('Invalid reset link or link has expired');
    }
  };
  
  setSession();
}, []);
```

### Update Password

```typescript
const handleUpdatePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }
  
  try {
    setIsLoading(true);
    setError(null);
    
    // Update the user's password
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    if (error) throw error;
    
    // Show success state and prepare for redirect
    setIsSuccessful(true);
    
    // Redirect to login after delay
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  } catch (error) {
    logger.error('Error updating password:', error);
    setError(error instanceof Error ? error.message : 'Failed to update password');
  } finally {
    setIsLoading(false);
  }
};
```

## Improved Error Handling

Our password reset flow includes comprehensive error handling at each stage:

### Email Request Errors
- Email not found
- Rate limiting
- Network errors
- Invalid email format

### Token Validation Errors
- Missing or invalid token
- Expired token
- Token already used
- Malformed URL

### Password Update Errors
- Password too weak
- Password policy violations
- Token expired during form completion
- Session errors

Each error is handled with user-friendly messages and detailed logging to help troubleshoot issues.

## Common Issues and Solutions

### 1. Email Prefetching

**Problem**: Some email security systems prefetch links in emails, which consumes your one-time token.

**Solution**: Our implementation properly extracts tokens from the URL hash instead of query parameters, which prevents prefetching systems from consuming the token.

### 2. Enterprise Email Security

**Problem**: Enterprise email systems may scan and click links in emails before users can access them.

**Solution**: The token is in the URL hash (fragment) which is not sent to the server during prefetching.

### 3. Email Delivery Issues

**Problem**: Users not receiving reset password emails.

**Solutions**:
- Set up a custom SMTP provider (see below)
- Check Supabase Auth logs for errors
- Ask users to check spam folders
- Ensure email domain is properly configured with DKIM, SPF, and DMARC

### 4. Password Requirements Issues

**Problem**: Users unable to set a new password due to strength requirements.

**Solution**: 
- We provide a password strength meter during reset
- Clear error messages explain requirements
- Validation occurs in real-time before submission

## Custom SMTP Setup (Recommended)

We strongly recommend setting up a custom SMTP provider for improved deliverability:

1. Go to Supabase Dashboard > Authentication > Email Templates
2. Click "Email Settings"
3. Enable "Custom SMTP"
4. Enter your SMTP credentials:
   - Host (e.g., smtp.sendgrid.net)
   - Port (usually 587 or 465)
   - Username and Password
   - Sender Name and Email

### Recommended SMTP Providers:
- SendGrid
- Mailgun
- Resend
- Amazon SES
- Postmark

## Testing the Reset Password Flow

1. Request a password reset using the "Forgot Password" link
2. Check the email (including spam folder)
3. Click the reset link
4. Create a new password that meets strength requirements
5. Verify you can log in with the new password
6. Test with different browsers to ensure cross-browser compatibility
7. Test with various email providers (Gmail, Outlook, corporate email, etc.)

## Debugging Steps

If users report issues:

1. Check Supabase Auth logs in the dashboard
2. Verify the correct email template is being used
3. Test with different email providers (Gmail, Outlook, etc.)
4. Check browser console for any JavaScript errors
5. Verify that the token is properly extracted from the URL
6. Check network requests for any API errors
7. Test in incognito/private browsing mode to rule out browser extensions

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Deliverability Best Practices](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Auth Troubleshooting](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV) 