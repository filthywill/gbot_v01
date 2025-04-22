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

## How It Works

1. **User Requests Password Reset:** When a user clicks "Forgot Password", they enter their email and we send a reset email using Supabase's `resetPasswordForEmail` method.

2. **Email Delivery:** Supabase sends an email with a secure link containing authentication tokens. The link directs to our `/auth/reset-password` route.

3. **Password Reset Form:** When the user clicks the link, they're taken to a form where they can create a new password. The component automatically extracts the token from the URL.

4. **Password Update:** After the user submits a new password, we call Supabase's `updateUser` method, which verifies the token and updates the password.

5. **Completion:** After successful password reset, the user is redirected to the login page with a success message.

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

## Debugging Steps

If users report issues:

1. Check Supabase Auth logs in the dashboard
2. Verify the correct email template is being used
3. Test with different email providers (Gmail, Outlook, etc.)
4. Check browser console for any JavaScript errors
5. Verify that the token is properly extracted from the URL

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Deliverability Best Practices](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Auth Troubleshooting](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV) 