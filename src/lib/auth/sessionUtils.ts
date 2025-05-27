import { supabase } from '../supabase';
import useAuthStore from '../../store/useAuthStore';

/**
 * Refreshes the user session after sensitive operations like password changes
 * This helps mitigate session hijacking risks by rotating tokens
 * @returns {Promise<boolean>} Success status of the refresh operation
 */
export const refreshSessionAfterSensitiveOperation = async (): Promise<boolean> => {
  try {
    console.info('Refreshing session after sensitive operation');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
    
    if (data.session) {
      // Update auth store with new session
      const authStore = useAuthStore.getState();
      authStore.setSession(data.session);
      console.info('Session successfully refreshed after sensitive operation');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Exception refreshing session:', error);
    return false;
  }
};

/**
 * Performs a secure sign-out with proper cleanup
 * This function ensures all sensitive data is cleared from memory
 * @returns {Promise<boolean>} Success status of the sign-out operation
 */
export const secureSignOut = async (): Promise<boolean> => {
  try {
    console.info('Performing secure sign-out with cleanup');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error during sign-out:', error);
      return false;
    }
    
    // Clear auth store
    const authStore = useAuthStore.getState();
    authStore.clearSession();
    
    // Clear any session storage items that may contain sensitive data
    sessionStorage.clear();
    
    // Clear sensitive data from localStorage (without removing items needed for app function)
    // You may need to customize this list based on your app's storage usage
    const sensitiveKeys = [
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'supabase.auth.user',
      'userSession',
      'authUser'
    ];
    
    sensitiveKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
    
    console.info('Secure sign-out completed');
    return true;
  } catch (error) {
    console.error('Exception during secure sign-out:', error);
    return false;
  }
}; 