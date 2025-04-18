# Password Reset Flow Setup for GraffitiSOFT

This document outlines how to correctly configure and test the password reset flow using Supabase Auth.

## Email Template Configuration in Supabase

### Reset Password Email Template

When setting up your email template in Supabase Dashboard (Authentication > Email Templates > Reset Password), use the following configuration:

```html
<h2>Reset Your Password</h2>
<p>Click the button below to reset your password:</p>
<a href="https://gbot-v01.vercel.app/auth/reset-password?token={{ .TokenHash }}&type=recovery#recovery">Reset Password</a>

<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p>https://gbot-v01.vercel.app/auth/reset-password?token={{ .TokenHash }}&type=recovery#recovery</p>

<p>If you're having trouble, you can also use this code to reset your password manually:</p>
<p><strong>{{ .Token }}</strong></p>

<p>If you didn't request a password reset, you can safely ignore this email.</p>
```

> **Important Note:** Make sure your router implementation can handle both `/reset-password` and `/auth/reset-password` paths. Our application router has been updated to support both, but if you change the URL in the email template, ensure the router is updated accordingly.

## Common Issues and Solutions

### 1. Email Prefetching

**Problem**: Some email security systems prefetch links in emails, which consumes your one-time token.

**Solution**: Our implementation provides a fallback method of manually entering the token, which is included in the email body. We also recommend setting up a custom SMTP provider that has better deliverability rates.

### 2. Enterprise Email Security

**Problem**: Enterprise email systems may scan and click links in emails before users can access them.

**Solution**: The manual token entry feature allows users to bypass this issue by copying the token text and entering it directly in the form.

### 3. Email Delivery Issues

**Problem**: Users not receiving reset password emails.

**Solutions**:
- Set up a custom SMTP provider (see below)
- Check Supabase Auth logs for errors
- Ask users to check spam folders
- Ensure email domain is properly configured with DKIM, SPF, and DMARC

### 4. Blank Page Issues

**Problem**: Users click on the reset password link but see a blank page.

**Solutions**:
- Ensure your routing logic handles the exact path from the email template
- Check browser console for JavaScript errors
- Verify that the reset password component is being loaded
- Test the link in different browsers

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

If using Gmail SMTP, follow these steps:
1. Use a Google Workspace account
2. Enable 2FA on the account
3. Create an app password for SMTP
4. Use the admin email as the sender
5. Use smtp.gmail.com with port 465 or 587

## Testing the Reset Password Flow

1. Request a password reset using the "Forgot Password" link
2. Check the email (including spam folder)
3. Click the reset link or use the manual token if needed
4. Create a new password that meets strength requirements
5. Verify you can log in with the new password

## Debugging Steps

If users report issues:

1. Check Supabase Auth logs in the dashboard
2. Verify the correct email template is being used
3. Test with different email providers (Gmail, Outlook, etc.)
4. Check if the user's email system is blocking the emails
5. Try the manual token entry method

## Additional Resources

- [Supabase Auth Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email Deliverability Best Practices](https://supabase.com/docs/guides/auth/auth-smtp) 