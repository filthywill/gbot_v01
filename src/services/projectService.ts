import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { CustomizationOptions } from '../types';
import { generateThumbnail, deleteThumbnail } from './thumbnailService';

// Simple project limits
const PROJECT_LIMITS = {
  FREE_USER_MAX: 10, // Adjust as needed
  PREMIUM_USER_MAX: 200 // Future premium feature
};

type ProjectRow = Database['public']['Tables']['projects']['Row'];

export interface SavedProject {
  id: string;
  name: string;
  inputText: string;
  styleId: string;
  customizationOptions: CustomizationOptions;
  thumbnailUrl: string | null;
  createdAt: string;
}

export const checkProjectLimit = async (userId: string): Promise<{ canSave: boolean; count: number; limit: number }> => {
  try {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    const currentCount = count || 0;
    const limit = PROJECT_LIMITS.FREE_USER_MAX; // Can be enhanced with user tier check
    
    return {
      canSave: currentCount < limit,
      count: currentCount,
      limit
    };
  } catch (error) {
    console.error('Error checking project limit:', error);
    return { canSave: false, count: 0, limit: PROJECT_LIMITS.FREE_USER_MAX };
  }
};

export const saveProject = async (
  userId: string,
  inputText: string,
  styleId: string,
  customizationOptions: CustomizationOptions,
  thumbnailOptions?: any
) => {
  try {
    // Check project limit first
    const { canSave, count, limit } = await checkProjectLimit(userId);
    if (!canSave) {
      throw new Error(`Project limit reached (${count}/${limit}). Please delete some projects first.`);
    }
    
    // Generate simple project name without date
    const name = inputText.substring(0, 30);
    
    // Generate thumbnail if options provided
    let thumbnailUrl = null;
    if (thumbnailOptions) {
      thumbnailUrl = await generateThumbnail({ ...thumbnailOptions, userId });
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        input_text: inputText,
        style_id: styleId,
        customization_options: customizationOptions as any,
        thumbnail_url: thumbnailUrl
      })
      .select()
      .single();
    
    if (error) {
      if (thumbnailUrl) await deleteThumbnail(thumbnailUrl);
      throw error;
    }
    
    return transformProject(data);
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const getUserProjects = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(transformProject);
  } catch (error) {
    console.error('Error loading projects:', error);
    throw error;
  }
};

export const updateProjectName = async (projectId: string, userId: string, newName: string) => {
  try {
    // Validate name
    const trimmedName = newName.trim();
    if (!trimmedName) {
      throw new Error('Project name cannot be empty');
    }
    if (trimmedName.length > 50) {
      throw new Error('Project name cannot exceed 50 characters');
    }
    
    const { data, error } = await supabase
      .from('projects')
      .update({ name: trimmedName })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformProject(data);
  } catch (error) {
    console.error('Error updating project name:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string, userId: string) => {
  try {
    // Get thumbnail URL for cleanup
    const { data: project } = await supabase
      .from('projects')
      .select('thumbnail_url')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();
    
    // Delete from database
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Clean up thumbnail
    if (project?.thumbnail_url) {
      await deleteThumbnail(project.thumbnail_url);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Helper function to clean project names by removing date suffixes
const cleanProjectName = (name: string): string => {
  // Remove common date patterns from the end of project names
  // Matches patterns like: " 12/25/2023", " 2023-12-25", " Dec 25, 2023", etc.
  const datePatterns = [
    / \d{1,2}\/\d{1,2}\/\d{4}$/,        // " 12/25/2023"
    / \d{4}-\d{1,2}-\d{1,2}$/,          // " 2023-12-25"
    / \w{3} \d{1,2}, \d{4}$/,           // " Dec 25, 2023"
    / \d{1,2}-\d{1,2}-\d{4}$/,          // " 12-25-2023"
    / \d{1,2}\.\d{1,2}\.\d{4}$/,        // " 12.25.2023"
  ];
  
  let cleanedName = name;
  for (const pattern of datePatterns) {
    cleanedName = cleanedName.replace(pattern, '');
  }
  
  return cleanedName.trim();
};

function transformProject(data: ProjectRow): SavedProject {
  return {
    id: data.id,
    name: cleanProjectName(data.name), // Clean the name automatically
    inputText: data.input_text,
    styleId: data.style_id,
    customizationOptions: data.customization_options as unknown as CustomizationOptions,
    thumbnailUrl: data.thumbnail_url,
    createdAt: data.created_at || new Date().toISOString()
  };
}

// Optional: Function to permanently clean up project names in the database
export const cleanupProjectNames = async (userId: string) => {
  try {
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId);
    
    if (fetchError) throw fetchError;
    
    const updates = projects
      ?.filter(project => {
        const cleaned = cleanProjectName(project.name);
        return cleaned !== project.name; // Only update if name actually changed
      })
      .map(project => ({
        id: project.id,
        name: cleanProjectName(project.name)
      })) || [];
    
    if (updates.length > 0) {
      // Update projects one by one to avoid conflicts
      for (const update of updates) {
        await supabase
          .from('projects')
          .update({ name: update.name })
          .eq('id', update.id)
          .eq('user_id', userId);
      }
      
      console.log(`Cleaned up ${updates.length} project names`);
      return updates.length;
    }
    
    return 0;
  } catch (error) {
    console.error('Error cleaning up project names:', error);
    throw error;
  }
}; 