/**
 * LRU (Least Recently Used) Cache implementation for SVG content
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  
  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Refresh the entry by removing and re-adding it
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // If key exists, refresh it
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // If cache is full, remove oldest entry
    else if (this.cache.size >= this.maxSize) {
      const firstKey = Array.from(this.cache.keys())[0];
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    // Add new entry
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Create a singleton instance for SVG content caching
export const svgMemoryCache = new LRUCache<string, string>(100); // Cache up to 100 SVGs

// Helper function to generate consistent cache keys
export const generateSvgCacheKey = (url: string): string => {
  return `svg-content-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;
}; 