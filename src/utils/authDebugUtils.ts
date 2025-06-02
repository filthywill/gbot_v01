import { supabase } from '../lib/supabase';
import logger from '../lib/logger';
import useAuthStore from '../store/useAuthStore';

/**
 * Debug utility to clear all authentication state and force refresh
 * Use this when experiencing JWT signature issues
 */
export const clearAuthState = async (): Promise<void> => {
  try {
    logger.info('Starting auth state cleanup...');
    
    // 1. Sign out from Supabase (this should invalidate server-side session)
    await supabase.auth.signOut();
    
    // 2. Clear all Supabase-related localStorage
    const keysToRemove = [
      'gbot_supabase_auth',
      'gbot-preferences',
      'supabase.auth.token',
      'sb-auth-token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      logger.debug(`Removed localStorage key: ${key}`);
    });
    
    // 3. Clear sessionStorage
    sessionStorage.clear();
    
    // 4. Clear any cached user data from stores
    const authStore = useAuthStore.getState();
    authStore.clearSession();
    authStore.resetError();
    
    logger.info('Auth state cleanup completed');
    
    // 5. Force page refresh to reinitialize everything
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
  } catch (error) {
    logger.error('Error during auth state cleanup:', error);
    throw error;
  }
};

/**
 * Debug function to check current auth state
 */
export const debugAuthState = async () => {
  try {
    logger.info('=== AUTH DEBUG INFO ===');
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    logger.info('Current session:', { 
      hasSession: !!session,
      sessionError,
      userId: session?.user?.id,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
    });
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    logger.info('Current user:', {
      hasUser: !!user,
      userError,
      userId: user?.id,
      email: user?.email
    });
    
    // Check localStorage
    const authData = localStorage.getItem('gbot_supabase_auth');
    logger.info('LocalStorage auth data:', {
      hasAuthData: !!authData,
      dataLength: authData?.length || 0
    });
    
    // Test connection to Supabase
    try {
      const { data: testData, error: testError } = await supabase
        .from('presets')
        .select('count')
        .limit(1);
      
      logger.info('Supabase connection test:', {
        success: !testError,
        error: testError?.message
      });
    } catch (connError) {
      logger.error('Supabase connection test failed:', connError);
    }
    
    logger.info('=== END AUTH DEBUG ===');
    
  } catch (error) {
    logger.error('Error during auth debug:', error);
  }
};

/**
 * Force refresh the current session
 */
export const forceRefreshSession = async (): Promise<boolean> => {
  try {
    logger.info('Forcing session refresh...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('Session refresh failed:', error);
      return false;
    }
    
    logger.info('Session refresh successful:', {
      hasSession: !!data.session,
      hasUser: !!data.user
    });
    
    return true;
  } catch (error) {
    logger.error('Error during session refresh:', error);
    return false;
  }
};

/**
 * Validate environment configuration
 */
export const validateEnvironment = (): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    issues.push('VITE_SUPABASE_URL is missing');
  } else if (!supabaseUrl.includes('supabase.co')) {
    issues.push('VITE_SUPABASE_URL format appears incorrect');
  }
  
  if (!supabaseKey) {
    issues.push('VITE_SUPABASE_ANON_KEY is missing');
  } else if (supabaseKey.length < 100) {
    issues.push('VITE_SUPABASE_ANON_KEY appears too short');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Development-only exports
if (import.meta.env.DEV) {
  // Make these available in browser console for debugging
  (window as any).authDebug = {
    clearAuthState,
    debugAuthState,
    forceRefreshSession,
    validateEnvironment
  };
  
  logger.info('Auth debug utilities available at window.authDebug');
} 