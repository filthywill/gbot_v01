import type { ProcessedSvg } from '../types';

/**
 * Production-safe SVG processing module
 * 
 * In development: Full runtime processing with processSvg()
 * In production: Lookup-only implementation, no runtime processing
 */

// Development-only imports (tree-shaken in production)
let devProcessSvg: ((svgText: string, letter: string, resolution?: number) => Promise<ProcessedSvg>) | null = null;

if (__DEV_SVG_PROCESSING__) {
  // Dynamic import only in development to avoid bundling in production
  devProcessSvg = (await import('../utils/dev/svgProcessing')).processSvg;
}

/**
 * Runtime SVG processing (development only)
 * In production builds, this throws an error since we should only use lookups
 */
export const processSvg = async (
  svgText: string, 
  letter: string, 
  resolution: number = 200
): Promise<ProcessedSvg> => {
  if (__PROD_LOOKUP_ONLY__) {
    // Production: Should never be called
    throw new Error(
      `[PRODUCTION] Runtime SVG processing not available. ` +
      `Letter '${letter}' should use lookup table. ` +
      `This indicates a missing lookup entry or development code in production build.`
    );
  }
  
  if (__DEV_SVG_PROCESSING__ && devProcessSvg) {
    // Development: Use runtime processing
    console.log(`[DEV] Processing SVG for letter '${letter}' at runtime`);
    return devProcessSvg(svgText, letter, resolution);
  }
  
  throw new Error(`SVG processing not available for letter '${letter}'`);
};

/**
 * Check if runtime processing is available
 */
export const isRuntimeProcessingAvailable = (): boolean => {
  return __DEV_SVG_PROCESSING__ && devProcessSvg !== null;
};

/**
 * Check if we're in lookup-only mode (production)
 */
export const isLookupOnlyMode = (): boolean => {
  return __PROD_LOOKUP_ONLY__;
};

/**
 * Get processing mode information
 */
export const getProcessingMode = () => {
  return {
    isProduction: __PROD_LOOKUP_ONLY__,
    isDevelopment: __DEV_SVG_PROCESSING__,
    runtimeProcessingAvailable: isRuntimeProcessingAvailable(),
    lookupOnlyMode: isLookupOnlyMode()
  };
}; 