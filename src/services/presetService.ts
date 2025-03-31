import { supabase } from '../lib/supabase';
import { CustomizationOptions } from '../types';
import { trackCreatePreset } from '../utils/analytics';

/**
 * Save a preset to Supabase
 */
export const savePreset = async (
  userId: string,
  presetName: string,
  description: string | null,
  options: CustomizationOptions,
  isPublic: boolean = false
) => {
  try {
    const { data, error } = await supabase
      .from('presets')
      .insert({
        user_id: userId,
        name: presetName,
        description,
        options,
        is_public: isPublic,
      })
      .select('id')
      .single();
      
    if (error) throw error;
    
    // Track the preset creation
    if (data?.id) {
      await trackCreatePreset(presetName, data.id);
    }
    
    return data;
  } catch (error) {
    console.error('Error saving preset:', error);
    throw error;
  }
};

/**
 * Get all presets for a user
 */
export const getUserPresets = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error getting user presets:', error);
    throw error;
  }
};

/**
 * Get public presets (can be used by anyone)
 */
export const getPublicPresets = async () => {
  try {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error getting public presets:', error);
    throw error;
  }
};

/**
 * Update an existing preset
 */
export const updatePreset = async (
  presetId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string | null;
    options?: CustomizationOptions;
    is_public?: boolean;
  }
) => {
  try {
    // Security check: Only update if user owns the preset
    const { error: checkError, count } = await supabase
      .from('presets')
      .select('id', { count: 'exact', head: true })
      .eq('id', presetId)
      .eq('user_id', userId);
      
    if (checkError) throw checkError;
    
    // If user doesn't own this preset, don't allow update
    if (count === 0) {
      throw new Error('You do not have permission to update this preset');
    }
    
    const { data, error } = await supabase
      .from('presets')
      .update(updates)
      .eq('id', presetId)
      .eq('user_id', userId) // Double security check
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating preset:', error);
    throw error;
  }
};

/**
 * Delete a preset
 */
export const deletePreset = async (presetId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('presets')
      .delete()
      .eq('id', presetId)
      .eq('user_id', userId); // Security check: Only delete if user owns the preset
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting preset:', error);
    throw error;
  }
}; 