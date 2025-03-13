// src/utils/simpleSvgCache.ts
// This is a simple utility to cache SVG customizations without changing your existing code

// Create a simple in-memory cache
const svgCache = new Map<string, string>();

/**
 * A wrapper for your existing customizeSvg function that adds caching
 */
export function getCachedCustomSvg(
  originalCustomizeFn: (svg: string, isSpace: boolean | undefined, options: any) => string,
  svg: string,
  isSpace: boolean | undefined,
  options: any
): string {
  // Skip caching for spaces
  if (isSpace) {
    return originalCustomizeFn(svg, isSpace, options);
  }
  
  // Create a simple cache key from the first 20 chars of SVG and the letter
  // This avoids the issue of incorrect caching between different letters
  const letter = options.letter || '';
  const cacheKey = `${letter}_${svg.slice(0, 20)}_${JSON.stringify(options).slice(0, 50)}`;
  
  // Check if we have a cached version
  if (svgCache.has(cacheKey)) {
    console.log(`Cache hit for ${letter || 'unknown'}`);
    return svgCache.get(cacheKey)!;
  }
  
  // If not cached, call the original function
  console.log(`Cache miss for ${letter || 'unknown'}, processing SVG`);
  const result = originalCustomizeFn(svg, isSpace, options);
  
  // Cache the result
  svgCache.set(cacheKey, result);
  
  return result;
}

// Helper function to clear the cache
export function clearSvgCache(): void {
  svgCache.clear();
  console.log('SVG cache cleared');
}