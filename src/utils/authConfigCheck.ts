/**
 * Functions to check and verify Supabase Auth settings using MCP
 */

// Define types for MCP functions
declare global {
  interface Window {
    mcp_supabase_list_projects: () => Promise<{data: any[]}>;
    mcp_supabase_get_project: (params: {id: string}) => Promise<{data: any}>;
  }
}

/**
 * Checks the current Supabase Auth password policies
 * This is used to ensure our front-end validation matches backend requirements
 */
export const checkAuthSettings = async () => {
  try {
    // List all projects to identify our project ID
    const { data: projects } = await window.mcp_supabase_list_projects();
    
    if (!projects || projects.length === 0) {
      console.error('No Supabase projects found');
      return null;
    }
    
    const projectId = projects[0].id;  // Assuming the first project is ours
    
    // Get project details
    const { data: project } = await window.mcp_supabase_get_project({ id: projectId });
    
    if (!project) {
      console.error('Failed to fetch project details');
      return null;
    }
    
    console.log('Current auth settings:', project.auth_settings);
    
    // Return the auth settings
    return {
      projectId,
      authSettings: project.auth_settings
    };
  } catch (error) {
    console.error('Error checking auth settings:', error);
    return null;
  }
};

/**
 * Verifies that our application's password validation requirements
 * match or exceed the Supabase Auth settings
 */
export const verifyPasswordRequirements = (authSettings: any) => {
  // Our app's password requirements
  const appRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true
  };
  
  // Extract Supabase password requirements
  const supabaseRequirements = {
    minLength: authSettings?.password_min_length || 6,
    requireUppercase: authSettings?.password_require_uppercase || false,
    requireLowercase: authSettings?.password_require_lowercase || false,
    requireNumber: authSettings?.password_require_number || false,
    requireSpecialChar: authSettings?.password_require_special_char || false
  };
  
  // Check if our app requirements meet or exceed Supabase settings
  const meetsRequirements = 
    appRequirements.minLength >= supabaseRequirements.minLength &&
    (!supabaseRequirements.requireUppercase || appRequirements.requireUppercase) &&
    (!supabaseRequirements.requireLowercase || appRequirements.requireLowercase) &&
    (!supabaseRequirements.requireNumber || appRequirements.requireNumber) &&
    (!supabaseRequirements.requireSpecialChar || appRequirements.requireSpecialChar);
  
  return {
    appRequirements,
    supabaseRequirements,
    meetsRequirements,
    recommendations: !meetsRequirements ? 
      'Application password requirements should be updated to match Supabase settings' : 
      'Password requirements match Supabase settings'
  };
}; 