import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UseProfileManagementReturn {
  // State
  profile: Profile | null;
  isLoading: boolean;
  isSaving: boolean;
  isUploading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  uploadAvatar: (file: File, userId: string) => Promise<string | null>;
  validateUsername: (username: string) => Promise<{ isValid: boolean; error?: string }>;
  deleteAvatar: (userId: string) => Promise<boolean>;
  
  // Utils
  clearError: () => void;
}

export const useProfileManagement = (): UseProfileManagementReturn => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, this is okay for new users
          setProfile(null);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateUsername = useCallback(async (username: string): Promise<{ isValid: boolean; error?: string }> => {
    if (!username || username.trim().length === 0) {
      return { isValid: false, error: 'Username is required' };
    }

    if (username.length < 2) {
      return { isValid: false, error: 'Username must be at least 2 characters long' };
    }

    if (username.length > 50) {
      return { isValid: false, error: 'Username must be less than 50 characters' };
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, dots, dashes, and underscores' };
    }

    // Check if username is already taken
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .neq('id', profile?.id || ''); // Exclude current user's profile

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        return { isValid: false, error: 'Username is already taken' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating username:', error);
      return { isValid: false, error: 'Unable to validate username. Please try again.' };
    }
  }, [profile?.id]);

  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<boolean> => {
    if (!profile) {
      setError('No profile to update');
      return false;
    }

    // Validate username if it's being updated
    if (updates.username !== undefined && updates.username !== null) {
      const validation = await validateUsername(updates.username);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid username');
        return false;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profile, validateUsername]);

  const uploadAvatar = useCallback(async (file: File, userId: string): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size must be less than 5MB');
      }

      // Create file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true, // Replace existing file
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const updateSuccess = await updateProfile({ avatar_url: publicUrl });
      
      if (!updateSuccess) {
        throw new Error('Failed to update profile with new avatar');
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload avatar');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [updateProfile]);

  const deleteAvatar = useCallback(async (userId: string): Promise<boolean> => {
    if (!profile?.avatar_url) {
      return true; // Nothing to delete
    }

    setIsSaving(true);
    setError(null);

    try {
      // Extract file path from URL
      const urlParts = profile.avatar_url.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get last two parts: userId/filename

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Error deleting file from storage:', deleteError);
        // Continue anyway - we'll update the profile
      }

      // Update profile to remove avatar URL
      const updateSuccess = await updateProfile({ avatar_url: null });
      
      return updateSuccess;
    } catch (error) {
      console.error('Error deleting avatar:', error);
      setError('Failed to delete avatar');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profile?.avatar_url, updateProfile]);

  return {
    // State
    profile,
    isLoading,
    isSaving,
    isUploading,
    error,
    
    // Actions
    fetchProfile,
    updateProfile,
    uploadAvatar,
    validateUsername,
    deleteAvatar,
    
    // Utils
    clearError,
  };
}; 