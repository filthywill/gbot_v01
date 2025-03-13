import { useRef, useCallback } from 'react';
import { ProcessedSvg, SvgCacheItem } from '../types';

// Cache expiration time in milliseconds (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// Map to track which SVGs are currently being preloaded
const preloadingMap = new Map<string, Promise<void>>();

// Global cache to persist across component remounts
const globalCache: Record<string, SvgCacheItem> = {};

export const useSvgCache = () => {
  // Using a ref that points to the global cache
  const cacheRef = useRef<Record<string, SvgCacheItem>>(globalCache);
  
  const getCachedSvg = (key: string): ProcessedSvg | null => {
    const now = Date.now();
    const cachedItem = cacheRef.current[key];
    
    if (!cachedItem) return null;
    
    // Check if cached item has expired
    if (now - cachedItem.timestamp > CACHE_EXPIRATION) {
      delete cacheRef.current[key];
      return null;
    }
    
    return cachedItem.svg;
  };
  
  const cacheSvg = (key: string, svg: ProcessedSvg): void => {
    cacheRef.current[key] = {
      svg,
      timestamp: Date.now()
    };
  };
  
  const clearCache = useCallback((style?: string): void => {
    // If style is provided, only clear that style's cache entries
    if (style) {
      Object.keys(cacheRef.current).forEach(key => {
        if (key.includes(`-${style}`)) {
          delete cacheRef.current[key];
        }
      });
    } else {
      // Clear all cache entries
      Object.keys(cacheRef.current).forEach(key => {
        delete cacheRef.current[key];
      });
    }
  }, []);
  
  // Preload an SVG in the background without blocking UI
  const preloadSvg = useCallback(async (letter: string, svgPath: string, style: string): Promise<void> => {
    // Create a cache key for standard version of this letter
    const cacheKey = `${letter}-std-false-false-${style}`;
    
    // Skip if already cached or currently preloading
    if (getCachedSvg(cacheKey) || preloadingMap.has(cacheKey)) {
      return;
    }
    
    // Create a promise for this preload operation
    const preloadPromise = (async () => {
      try {
        // Import dynamically to avoid circular dependencies
        const { fetchSvg } = await import('../utils/letterUtils');
        const { processSvg } = await import('../utils/svgUtils');
        
        // Fetch and process the SVG in the background
        const svgContent = await fetchSvg(svgPath);
        
        // Use lower resolution for preloading to improve performance
        const processed = await processSvg(svgContent, letter, 0, 100);
        
        // Cache the processed SVG
        cacheSvg(cacheKey, processed);
      } catch (err) {
        // Silently fail for preloading
        console.debug(`Preload failed for ${letter}:`, err);
      } finally {
        // Remove from preloading map when done
        preloadingMap.delete(cacheKey);
      }
    })();
    
    // Add to preloading map
    preloadingMap.set(cacheKey, preloadPromise);
    
    // Don't await the promise - let it run in the background
  }, []);
  
  return {
    getCachedSvg,
    cacheSvg,
    clearCache,
    preloadSvg
  };
};