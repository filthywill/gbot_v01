-- =====================================================
-- PROFILE MANAGEMENT DATABASE SETUP - PHASE 1.1
-- Profiles Table Creation with RLS and Triggers
-- =====================================================

-- Create profiles table (minimal fields)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT,
    
    -- Simple username constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 2 AND char_length(username) <= 50),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_.-]+$')
);

-- Create index for better performance on username lookups
CREATE INDEX profiles_username_idx ON public.profiles(username);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Policy 1: Users can view all profiles (for public profile viewing)
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Users can delete their own profile (optional, for account deletion)
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- TRIGGER FUNCTION FOR AUTO-PROFILE CREATION
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'preferred_username',
            new.raw_user_meta_data->>'name',
            split_part(new.email, '@', 1)
        )
    );
    RETURN new;
EXCEPTION
    WHEN unique_violation THEN
        -- If username exists, append random number (1-999)
        INSERT INTO public.profiles (id, username)
        VALUES (
            new.id,
            COALESCE(
                new.raw_user_meta_data->>'preferred_username',
                new.raw_user_meta_data->>'name',
                split_part(new.email, '@', 1)
            ) || '_' || floor(random() * 1000)::text
        );
        RETURN new;
    WHEN OTHERS THEN
        -- If all else fails, create profile without username
        INSERT INTO public.profiles (id, username)
        VALUES (new.id, NULL);
        RETURN new;
END;
$$ language plpgsql security definer;

-- =====================================================
-- TRIGGER FOR NEW USER REGISTRATION
-- =====================================================

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if table was created successfully
-- SELECT COUNT(*) as profile_count FROM public.profiles;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies WHERE tablename = 'profiles';

-- Check trigger exists
-- SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'public.profiles'::regclass; 