import { isDevelopment } from '../lib/env';

// Simplified avatar cache - only store what we need
interface CachedAvatar {
  url: string;
  timestamp: number;
}

export const avatarCache = new Map<string, CachedAvatar>();
export const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_CACHE_SIZE = 50; // Limit cache size

// Optimized cache cleanup - only when needed
const cleanupAvatarCache = () => {
  const now = Date.now();
  
  // Remove expired entries
  for (const [key, cached] of avatarCache.entries()) {
    if (now - cached.timestamp > CACHE_EXPIRY_MS) {
      avatarCache.delete(key);
    }
  }
  
  // Remove oldest entries if cache is full
  if (avatarCache.size >= MAX_CACHE_SIZE) {
    const entries = Array.from(avatarCache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)
      .slice(0, avatarCache.size - MAX_CACHE_SIZE + 1);
    
    for (const [key] of entries) {
      avatarCache.delete(key);
    }
  }
};

// Get cached avatar if available and not expired
export const getCachedAvatar = (cacheKey: string): string | null => {
  const cached = avatarCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
    return cached.url;
  }
  
  // Remove expired entry
  if (cached) {
    avatarCache.delete(cacheKey);
  }
  
  return null;
};

// Preload and cache an image - simplified
export const preloadAndCacheAvatar = async (url: string, cacheKey: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Cleanup before adding new entry
      cleanupAvatarCache();
      
      // Cache only the URL and timestamp
      avatarCache.set(cacheKey, {
        url,
        timestamp: Date.now()
      });
      
      resolve(url);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load avatar: ${url}`));
    };
    
    img.src = url;
  });
};

// Generate a stable cache key for a user
export const generateAvatarCacheKey = (userId: string, userMetadata?: any, email?: string): string => {
  const avatarSource = userMetadata?.avatar_url || userMetadata?.picture || email || 'fallback';
  return `${userId}-${avatarSource}`;
};

// Development helpers - minimal and only when needed
export const clearAvatarCache = (): void => {
  avatarCache.clear();
  if (isDevelopment()) {
    console.log('🗑️ Avatar cache cleared');
  }
};

export const getCacheSize = (): number => avatarCache.size; 