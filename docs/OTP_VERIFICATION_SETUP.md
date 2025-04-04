# Setting Up OTP Verification in Supabase

This guide will help you set up code-based (OTP) verification for your app, which replaces the link-based verification.

## Benefits of Code-Based Verification

- **No Browser Redirects**: Users stay in your app through the entire verification process
- **More Reliable**: Eliminates issues with SPA routing and redirect handling
- **Better User Experience**: Familiar verification approach used by many popular services
- **Simpler Implementation**: No need for complex callback routes or URL parameter handling

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

### 3. Test the Flow

1. Open your application
2. Go through the signup process
3. Check your email for the verification code
4. Enter the code in the verification screen
5. You should be automatically logged in after successful verification

## Troubleshooting

### Code Not Arriving

1. Check your spam/junk folder
2. Verify that your Supabase email service is correctly set up
3. Try the "Resend Code" button

### Verification Errors

If you encounter errors during verification:

1. Make sure you're entering the exact code from the email
2. Codes expire after 24 hours
3. Check browser console for specific error messages

### Still Having Issues?

- Ensure you have the latest version of the app code
- Clear browser localStorage and try again
- Check Supabase logs for authentication errors

## Technical Details

The OTP verification flow works by:

1. Calling `supabase.auth.signUp()` with `emailRedirectTo: undefined` to disable link-based verification
2. Sending a verification code to the user's email
3. User enters the code in the app
4. App calls `supabase.auth.verifyOtp()` to verify the code
5. Upon successful verification, the user is automatically signed in

## Need More Help?

Contact support or open an issue on GitHub if you encounter any problems with this implementation. 