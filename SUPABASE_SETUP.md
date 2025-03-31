# Supabase Setup Guide for GraffitiSOFT

## Prerequisites
- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm installed

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

### For Google Authentication:

1. Go to Settings > Authentication in your Supabase dashboard
2. Under "External OAuth Providers", find Google
3. Enable Google auth
4. Follow the instructions to create OAuth credentials in Google Cloud Console
5. Add your authorized domain and redirect URLs as instructed
6. Save the Client ID and Client Secret from Google in Supabase

### For Email Authentication:

1. Go to Settings > Authentication in your Supabase dashboard
2. Under "Email Auth", make sure it's enabled
3. Configure as needed (confirm emails, password recovery, etc.)

## Step 6: Test Your Setup

1. Restart your development server
2. Try signing in with Google and/or email
3. Test creating and retrieving presets
4. Verify that user actions are being tracked

## Troubleshooting

- **Auth Errors**: Check that your redirect URLs are correctly configured
- **Database Errors**: Verify your RLS policies and table structure
- **Type Errors**: Make sure your TypeScript types match your database schema 