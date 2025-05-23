-- =====================================================
-- PROFILE MANAGEMENT DATABASE SETUP - MIGRATION
-- Option A: Simple Migration for Existing Users
-- =====================================================

-- This script creates profiles for existing users with auto-assigned usernames
-- Run this AFTER creating the profiles table and storage bucket

-- =====================================================
-- MIGRATION FOR EXISTING USERS
-- =====================================================

-- Create profiles for existing users who don't have profiles yet
INSERT INTO public.profiles (id, username)
SELECT 
    id,
    COALESCE(
        raw_user_meta_data->>'preferred_username',
        raw_user_meta_data->>'name',
        split_part(email, '@', 1)
    ) as username
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Handle any username conflicts that might occur
-- This will update conflicting usernames by appending a number
DO $$
DECLARE
    conflict_record RECORD;
    new_username TEXT;
    counter INTEGER;
BEGIN
    -- Find any users who still don't have profiles (due to username conflicts)
    FOR conflict_record IN 
        SELECT id, email, raw_user_meta_data
        FROM auth.users 
        WHERE id NOT IN (SELECT id FROM public.profiles)
    LOOP
        -- Generate a base username
        new_username := COALESCE(
            conflict_record.raw_user_meta_data->>'preferred_username',
            conflict_record.raw_user_meta_data->>'name',
            split_part(conflict_record.email, '@', 1)
        );
        
        -- Find an available username by appending numbers
        counter := 1;
        WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username || '_' || counter::text) LOOP
            counter := counter + 1;
        END LOOP;
        
        -- Insert the profile with the unique username
        INSERT INTO public.profiles (id, username)
        VALUES (conflict_record.id, new_username || '_' || counter::text);
    END LOOP;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check how many profiles were created
-- SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check how many users have profiles vs total users
-- SELECT 
--     (SELECT COUNT(*) FROM auth.users) as total_users,
--     (SELECT COUNT(*) FROM public.profiles) as total_profiles,
--     (SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles)) as users_without_profiles;

-- View the created profiles
-- SELECT id, username, created_at FROM public.profiles ORDER BY created_at;

-- =====================================================
-- CLEANUP (Optional)
-- =====================================================

-- If you need to start over, uncomment and run these:
-- DELETE FROM public.profiles;
-- This will remove all profiles and let the trigger recreate them for new signups 