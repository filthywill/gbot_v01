-- =====================================================
-- PROFILE MANAGEMENT DATABASE SETUP - PHASE 1.2
-- Supabase Storage Bucket Setup for Avatars
-- =====================================================

-- Create avatars bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Policy 1: Avatar images are publicly accessible (for viewing)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Policy 2: Users can upload their own avatar
-- Path structure: avatars/{user_id}/avatar.{ext}
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy 3: Users can update their own avatar (overwrite existing)
CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy 4: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if bucket was created
-- SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';

-- Check storage policies
-- SELECT policyname, permissive, roles, cmd, qual 
-- FROM pg_policies WHERE tablename = 'objects' AND qual LIKE '%avatars%';

-- =====================================================
-- HELPER FUNCTIONS (Optional)
-- =====================================================

-- Function to get public URL for avatar (for use in application)
CREATE OR REPLACE FUNCTION public.get_avatar_url(avatar_path text)
RETURNS text AS $$
BEGIN
    IF avatar_path IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Return full public URL for the avatar
    -- Note: Replace 'your-project-ref' with your actual Supabase project reference
    RETURN 'https://your-project-ref.supabase.co/storage/v1/object/public/avatars/' || avatar_path;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORAGE CONFIGURATION NOTES
-- =====================================================

-- File size limits (configure in Supabase Dashboard):
-- - Max file size: 5MB per file
-- - Allowed file types: image/jpeg, image/png, image/webp, image/gif
-- - File naming convention: {user_id}/avatar.{ext}

-- To configure file upload limits:
-- 1. Go to Supabase Dashboard > Storage > Settings
-- 2. Set file size limit to 5MB
-- 3. Set allowed MIME types: image/jpeg, image/png, image/webp, image/gif 