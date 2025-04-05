# OTP Verification Testing Guide

This guide provides detailed instructions for testing the OTP verification flow implemented in GraffitiSOFT. It covers every aspect of the verification process to ensure full functionality.

## Prerequisites

Before testing, ensure:
- You have access to the Supabase dashboard
- You have properly configured the email template in Supabase (see `OTP_VERIFICATION_SETUP.md`)
- You have access to the email account you'll use for testing

## 1. Basic Verification Flow

### 1.1 Sign-Up Process
1. Open the application in a clean browser session (or use incognito mode)
2. Click "Sign Up" to open the authentication modal
3. Enter a valid email and password
4. Submit the form
5. Verify that:
   - The modal transitions to the verification code input screen
   - The email field shows the correct email address
   - The UI indicates that a code has been sent

### 1.2 Email Receipt
1. Check the inbox of the email you used
2. Verify that:
   - The verification email arrives promptly
   - The email contains a clear 6-digit verification code
   - The email follows the design template (with proper styling)
   - The code is easily selectable/copyable

### 1.3 Code Verification
1. Enter the 6-digit code in the verification input field
2. Verify that:
   - The input accepts only digits
   - The UI shows a "Verifying..." state during verification
   - Upon success, you are logged in automatically
   - The verification modal closes after successful verification

## 2. Testing UI Components

### 2.1 Verification Input Component

#### Input Field Behavior
1. Try typing non-digit characters (letters, symbols)
   - Should only accept digits (0-9)
2. Verify the 6-digit limit is enforced
   - Should not allow more than 6 digits
3. Test keyboard navigation:
   - Try pressing Enter when code is complete (should trigger verification)
   - Try pressing Enter with incomplete code (should do nothing)

#### Paste Functionality
1. Copy the verification code from the email
2. Click the "Paste" button in the verification UI
3. Verify that:
   - The code is correctly pasted into the input field
   - If a complete 6-digit code is pasted, auto-verification begins
   - The paste button is disabled during verification

### 2.2 Error States
1. Enter an incorrect 6-digit code 
2. Verify that:
   - An appropriate error message is displayed
   - The "Verify" button becomes active again after error
   - You can try again with a new code

2. Test network disconnection:
   - Disconnect from the internet
   - Try to verify a code
   - Verify that an appropriate network error message is shown

### 2.3 Verification Banner

1. After initiating signup, close the verification modal without completing verification
2. Refresh the page
3. Verify that:
   - A banner appears at the top of the page
   - The banner shows the correct email address
   - The banner shows a countdown timer (if applicable)
   - The "Resume Verification" button is visible and clickable

4. Click "Resume Verification"
5. Verify that:
   - The verification modal reopens
   - The email is pre-filled correctly
   - You can continue the verification process

6. Test banner dismissal:
   - Click the "X" on the banner
   - Verify that the banner disappears
   - Refresh the page to confirm it stays dismissed in this session

## 3. Testing Edge Cases

### 3.1 Verification State Persistence

1. Start the signup process but close the browser before verification
2. Reopen the application
3. Verify that:
   - The verification banner appears
   - The stored verification state is correctly loaded

### 3.2 Code Expiration

1. Initiate a verification process
2. Wait for 30 minutes (or modify the code to use a shorter timeout for testing)
3. Try to verify with the code
4. Verify that:
   - An appropriate "expired code" message is shown
   - The banner no longer appears after expiration

### 3.3 Multiple Devices/Tabs

1. Start verification on one device/browser tab
2. Open the application in another device/tab with the same account
3. Verify that:
   - The verification state is consistent across devices/tabs
   - Completing verification on one device updates state on other devices

### 3.4 Resend Functionality

1. Click the "Resend Code" button
2. Verify that:
   - A new code is sent to your email
   - The UI indicates that a new code has been sent
   - The old code becomes invalid (optional, depending on implementation)

### 3.5 Authentication Status

1. Complete verification successfully
2. Verify that:
   - You are properly authenticated
   - The verification banner no longer appears
   - The auth state persists across page refreshes

2. Log out and log back in without verification
3. Verify that:
   - The verification banner does not appear for already-verified accounts

## 4. Cross-Browser Testing

Repeat the key tests above in:
- Chrome
- Firefox 
- Safari
- Edge
- Mobile browsers (if applicable)

Verify consistent behavior across all platforms.

## 5. Stress Testing

### 5.1 Rapid Actions
1. Quickly click buttons (verify, paste, resend) multiple times
2. Verify no strange behavior or UI glitches occur

### 5.2 Multiple Accounts
1. Create several accounts in succession
2. Verify that verification states don't conflict

## 6. Common Issues and Solutions

### No Code Received
- Check spam/junk folder
- Verify Supabase email service configuration
- Ensure SMTP settings are correct in Supabase

### Verification Fails with Valid Code
- Check browser console for specific errors
- Verify the code is being sent correctly to the API
- Ensure no whitespace or invisible characters in the code

### Banner Not Showing
- Check localStorage for verification state
- Verify the visibility logic in VerificationBanner.tsx
- Make sure you're not already authenticated

### Multiple Attempts Required
- Check for rate limiting in Supabase
- Verify network connectivity
- Look for CORS issues in the browser console

## 7. Reporting Issues

When reporting issues with the verification system, include:
1. Browser and version
2. Device information
3. Clear steps to reproduce
4. Error messages from console
5. Timestamp of the occurrence
6. Screenshots if applicable 