// SVG Lookup Integration - Development + Production
// This file provides a unified interface for SVG processing with lookup tables

import { ProcessedSvg } from '../types';
import { getProcessedSvgFromLookup, isLookupTableAvailable } from '../data/generated';
import { processSvg } from './dev/svgProcessing';
import { getLetterSvg } from './letterUtils';

// Development flag - will be replaced by build system
declare const __DEV_SVG_PROCESSING__: boolean;

// Configuration for lookup behavior
interface LookupConfig {
  enableFallback: boolean;       // Whether to fall back to runtime processing
  validateBounds: boolean;       // Whether to validate lookup results
  logPerformance: boolean;       // Whether to log performance metrics
  cacheResults: boolean;         // Whether to cache converted results
}

const DEFAULT_CONFIG: LookupConfig = {
  enableFallback: typeof __DEV_SVG_PROCESSING__ !== 'undefined' && __DEV_SVG_PROCESSING__,
  validateBounds: true,
  logPerformance: true,
  cacheResults: true
};

// Cache for converted lookup results
const processedSvgCache = new Map<string, ProcessedSvg>();

/**
 * Convert ProcessedSvgData to ProcessedSvg format
 * Note: Lookup data doesn't include pixel analysis, so we need to handle this appropriately
 */
function convertLookupToProcessedSvg(
  lookupData: any
): ProcessedSvg {
  // For now, we'll use simplified pixel data until we can implement proper conversion
  // In a full implementation, we would either:
  // 1. Include pixel data in the lookup table (larger file size)
  // 2. Generate pixel data on-demand (performance cost)
  // 3. Use approximated pixel data based on bounds (current approach)
  
  const { width, height, bounds } = lookupData;
  
  // Create simplified pixel data based on bounds
  const pixelData: boolean[][] = Array(200).fill(null).map(() => Array(200).fill(false));
  const verticalPixelRanges: { top: number; bottom: number; density: number }[] = Array(200).fill(null);
  
  // Fill pixel data based on bounds (approximation)
  for (let y = bounds.top; y <= bounds.bottom; y++) {
    for (let x = bounds.left; x <= bounds.right; x++) {
      if (y >= 0 && y < 200 && x >= 0 && x < 200) {
        pixelData[y][x] = true;
      }
    }
  }
  
  // Create vertical pixel ranges based on bounds
  for (let x = 0; x < 200; x++) {
    if (x >= bounds.left && x <= bounds.right) {
      verticalPixelRanges[x] = {
        top: bounds.top,
        bottom: bounds.bottom,
        density: 0.8 // Approximated density
      };
    } else {
      verticalPixelRanges[x] = { top: 0, bottom: 199, density: 0 };
    }
  }

  return {
    svg: lookupData.svgContent,
    width: lookupData.width,
    height: lookupData.height,
    bounds: lookupData.bounds,
    pixelData,
    verticalPixelRanges,
    scale: 1,
    letter: lookupData.letter
  };
}

/**
 * Main lookup function - replaces processSvg() in production
 */
export const getProcessedSvgFromLookupTable = async (
  letter: string,
  style: string = 'straight',
  variant: 'standard' | 'alternate' | 'first' | 'last' = 'standard',
  config: Partial<LookupConfig> = {}
): Promise<ProcessedSvg> => {
  const startTime = performance.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Create cache key
  const cacheKey = `${letter}-${style}-${variant}`;
  
  // Check cache first
  if (finalConfig.cacheResults && processedSvgCache.has(cacheKey)) {
    const cached = processedSvgCache.get(cacheKey)!;
    if (finalConfig.logPerformance) {
      const duration = performance.now() - startTime;
      console.log(`🚀 Lookup cache hit for '${letter}': ${duration.toFixed(2)}ms`);
    }
    return cached;
  }

  try {
    // Try lookup table first
    if (isLookupTableAvailable(style)) {
      const lookupData = getProcessedSvgFromLookup(letter, style, variant);
      
      if (lookupData) {
        const processed = convertLookupToProcessedSvg(lookupData);
        
        // Cache the result
        if (finalConfig.cacheResults) {
          processedSvgCache.set(cacheKey, processed);
        }
        
        if (finalConfig.logPerformance) {
          const duration = performance.now() - startTime;
          console.log(`⚡ Lookup success for '${letter}': ${duration.toFixed(2)}ms`);
        }
        
        return processed;
      }
    }

    // Fallback to runtime processing (development only)
    if (finalConfig.enableFallback) {
      console.warn(`📋 Lookup failed for '${letter}', falling back to runtime processing`);
      
      // Get SVG content
      const svgPath = await getLetterSvg(letter, variant === 'alternate', 
        variant === 'first', variant === 'last', style);
      
      if (!svgPath) {
        throw new Error(`No SVG content found for letter '${letter}'`);
      }

      // Fetch SVG content if it's a URL
      let svgContent = svgPath;
      if (svgPath.startsWith('/') || svgPath.startsWith('http')) {
        const response = await fetch(svgPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.statusText}`);
        }
        svgContent = await response.text();
      }

      // Process using development function
      const processed = await processSvg(svgContent, letter);
      
      // Cache the result
      if (finalConfig.cacheResults) {
        processedSvgCache.set(cacheKey, processed);
      }
      
      if (finalConfig.logPerformance) {
        const duration = performance.now() - startTime;
        console.log(`🔧 Runtime fallback for '${letter}': ${duration.toFixed(2)}ms`);
      }
      
      return processed;
    }

    // No fallback available - return placeholder
    throw new Error(`Letter '${letter}' not found in lookup table and fallback disabled`);
    
  } catch (error) {
    console.error(`💥 Failed to get processed SVG for '${letter}':`, error);
    
    // Return a simple placeholder
    const placeholder: ProcessedSvg = {
      svg: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
              <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" 
                    font-family="Arial" font-size="48" fill="#374151">${letter}</text>
            </svg>`,
      width: 200,
      height: 200,
      bounds: { left: 0, right: 200, top: 0, bottom: 200 },
      pixelData: Array(200).fill(null).map(() => Array(200).fill(false)),
      verticalPixelRanges: Array(200).fill({ top: 0, bottom: 199, density: 0 }),
      scale: 1,
      letter
    };
    
    return placeholder;
  }
};

/**
 * Space character helper
 */
export const createSpaceSvg = (): ProcessedSvg => {
  return {
    svg: '<svg width="50" height="200" xmlns="http://www.w3.org/2000/svg"></svg>',
    width: 50,
    height: 200,
    bounds: { left: 0, right: 50, top: 0, bottom: 200 },
    pixelData: Array(200).fill(null).map(() => Array(50).fill(false)),
    verticalPixelRanges: Array(50).fill({ top: 0, bottom: 199, density: 0 }),
    scale: 1,
    letter: ' '
  };
};

/**
 * Check if lookup is available for a style
 */
export const isLookupAvailable = (style: string): boolean => {
  return isLookupTableAvailable(style);
};

/**
 * Get lookup performance statistics
 */
export const getLookupStats = () => {
  return {
    cacheSize: processedSvgCache.size,
    availableStyles: isLookupTableAvailable('straight') ? ['straight'] : [],
    fallbackEnabled: DEFAULT_CONFIG.enableFallback
  };
};

/**
 * Clear lookup cache (development only)
 */
export const clearLookupCache = () => {
  processedSvgCache.clear();
  console.log('🧹 Cleared lookup cache');
}; 