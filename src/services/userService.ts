import { supabase } from '../lib/supabase';

/**
 * Get user feature access levels
 */
export const getUserFeatureAccess = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_feature_access')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Convert to a map for easier lookup
    const featureAccessMap = data?.reduce((acc, item) => {
      acc[item.feature] = {
        accessLevel: item.access_level,
        expirationDate: item.expiration_date ? new Date(item.expiration_date) : null,
      };
      return acc;
    }, {} as Record<string, { accessLevel: string; expirationDate: Date | null }>);
    
    return featureAccessMap || {};
  } catch (error) {
    console.error('Error getting user feature access:', error);
    return {};
  }
};

/**
 * Check if a user has access to a specific feature
 * @param userId The user ID
 * @param feature The feature to check access for
 * @param requiredLevel The minimum required access level ('free', 'premium', 'admin')
 */
export const hasFeatureAccess = async (
  userId: string,
  feature: string,
  requiredLevel: 'free' | 'premium' | 'admin' = 'free'
): Promise<boolean> => {
  try {
    // Free users have access to free features
    if (requiredLevel === 'free') return true;
    
    const { data, error } = await supabase
      .from('user_feature_access')
      .select('*')
      .eq('user_id', userId)
      .eq('feature', feature)
      .single();
      
    if (error) {
      // If no record found, user doesn't have access beyond free
      return false;
    }
    
    // Check if the feature access is expired
    if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
      return false;
    }
    
    // Check access level
    if (requiredLevel === 'premium') {
      return ['premium', 'admin'].includes(data.access_level);
    } else if (requiredLevel === 'admin') {
      return data.access_level === 'admin';
    }
    
    return true;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
};

/**
 * Get user action statistics
 */
export const getUserActionStats = async (userId: string) => {
  try {
    // Use a custom query to get counts by action type
    const { data, error } = await supabase
      .from('user_actions')
      .select('action_type, id')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Manually calculate the counts by action type
    const counts = data.reduce((acc, item) => {
      acc[item.action_type] = (acc[item.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to the expected format
    return Object.entries(counts).map(([action_type, count]) => ({
      action_type,
      count
    }));
  } catch (error) {
    console.error('Error getting user action stats:', error);
    return [];
  }
}; 