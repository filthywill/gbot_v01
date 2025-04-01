# Supabase Setup Guide for GraffitiSOFT

## Prerequisites
- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm installed
- A Google Cloud Platform account (for Google authentication)

## Step 1: Create a Supabase Project

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Enter a name for your project (e.g., "graffitisoft")
4. Set a secure database password (save this somewhere safe)
5. Choose a region closest to your users
6. Click "Create new project"

## Step 2: Get Your API Keys

1. Once your project is created, go to the project dashboard
2. In the left sidebar, click on "Settings" (gear icon) and then "API"
3. You will see your API URL and anon/public key
4. Copy these values - you'll need them for the next step

## Step 3: Configure Environment Variables

1. In your project root directory, create or edit the `.env` file:
2. Add the following entries, replacing the values with your own:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Step 4: Create Database Tables

Run the following SQL commands in your Supabase SQL Editor (Database > SQL Editor):

```sql
-- Create presets table
CREATE TABLE public.presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    options JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false NOT NULL
);

-- Create user_actions table for analytics
CREATE TABLE public.user_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    metadata JSONB
);

-- Create user_feature_access table for premium features
CREATE TABLE public.user_feature_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    access_level TEXT NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
-- Preset policies
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- Users can read their own presets
CREATE POLICY "Users can read their own presets" ON public.presets
    FOR SELECT USING (auth.uid() = user_id);
    
-- Users can read public presets
CREATE POLICY "Anyone can read public presets" ON public.presets
    FOR SELECT USING (is_public = true);
    
-- Users can insert their own presets
CREATE POLICY "Users can insert their own presets" ON public.presets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
-- Users can update their own presets
CREATE POLICY "Users can update their own presets" ON public.presets
    FOR UPDATE USING (auth.uid() = user_id);
    
-- Users can delete their own presets
CREATE POLICY "Users can delete their own presets" ON public.presets
    FOR DELETE USING (auth.uid() = user_id);

-- User actions policies
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own actions
CREATE POLICY "Users can insert their own actions" ON public.user_actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
-- Users can read their own actions
CREATE POLICY "Users can read their own actions" ON public.user_actions
    FOR SELECT USING (auth.uid() = user_id);

-- User feature access policies
ALTER TABLE public.user_feature_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own feature access
CREATE POLICY "Users can read their own feature access" ON public.user_feature_access
    FOR SELECT USING (auth.uid() = user_id);
```

## Step 5: Configure Authentication Providers

### For Google Authentication (Direct Token Approach):

1. Go to Google Cloud Console (https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add your application's domain and local development URLs to "Authorized JavaScript origins"
   - Development: `http://localhost:5173` (or your Vite port)
   - Production: `https://your-domain.com`
7. You do not need to add redirect URIs for the direct token approach
8. Copy your "Client ID" (you'll need it for Supabase and your .env file)

9. Now, go to Supabase Dashboard:
   - Navigate to Authentication > Providers
   - Find Google in the list and enable it
   - Paste your Google Client ID
   - You can leave the Client Secret and other fields empty (not needed for direct token approach)
   - Save changes

10. Add your Google Client ID to your environment variables:
    ```
    VITE_GOOGLE_CLIENT_ID=your-google-client-id
    ```

### For Email Authentication:

1. Go to Settings > Authentication in your Supabase dashboard
2. Under "Email Auth", make sure it's enabled
3. Configure as needed (confirm emails, password recovery, etc.)

## Step 6: Configure Google OAuth Consent Screen

1. In Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have Google Workspace)
3. Fill in the required information:
   - App name: "GraffitiSOFT" (or your application name)
   - User support email: Your email address
   - Developer contact information: Your email address
4. Add the scopes you need:
   - `email` 
   - `profile`
5. Add test users if you're still in testing mode
6. Review and publish your app

## Step 7: Test Your Setup

1. Restart your development server
2. Try signing in with Google using the new direct token approach:
   - The Google sign-in button should show up
   - Clicking it should open a Google popup
   - After signing in with Google, you should be authenticated in the app
3. Try signing in with email/password
4. Test creating and retrieving presets
5. Verify that user actions are being tracked

## Troubleshooting

### Google Authentication Issues

- **Error 400: redirect_uri_mismatch**: This error is usually seen with OAuth redirect flow, but not with the direct token approach. If you still see this:
  - Ensure you're using the `GoogleSignInButton` component which implements the direct token approach
  - Check that your JavaScript origins in Google Cloud match your application URLs exactly

- **Google Button Not Loading**: 
  - Check browser console for script loading errors
  - Verify the Google Client ID in your environment variables
  - Ensure the Google Identity Services script is loading properly
  
- **Invalid Client ID**: 
  - Double-check that the Client ID in your .env file matches the one in Google Cloud
  - Make sure you're using the Web application client ID, not the Android or iOS one

- **Token Validation Failures**: 
  - Ensure both Supabase and your app are configured with the same Google Client ID
  - Check that your application's domain is properly authorized in Google Cloud

### Other Common Issues

- **Database Errors**: Verify your RLS policies and table structure
- **Type Errors**: Make sure your TypeScript types match your database schema
- **CORS Errors**: Add your domain to the allowed origins in Supabase settings

## Verification Steps

To confirm your setup is working correctly:

1. **Authentication Flow**: Complete a sign-in process and verify the user appears in the Supabase Auth dashboard
2. **Database Access**: Create a preset and verify it appears in the Supabase database with the correct user_id
3. **RLS Policies**: Try accessing another user's private data (should be blocked) 