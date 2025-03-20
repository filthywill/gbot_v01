/**
 * LRU (Least Recently Used) Cache implementation for SVG content
 */
var LRUCache = /** @class */ (function () {
    function LRUCache(maxSize) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    LRUCache.prototype.get = function (key) {
        var value = this.cache.get(key);
        if (value) {
            // Refresh the entry by removing and re-adding it
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    };
    LRUCache.prototype.set = function (key, value) {
        // If key exists, refresh it
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // If cache is full, remove oldest entry
        else if (this.cache.size >= this.maxSize) {
            var firstKey = Array.from(this.cache.keys())[0];
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        // Add new entry
        this.cache.set(key, value);
    };
    LRUCache.prototype.has = function (key) {
        return this.cache.has(key);
    };
    LRUCache.prototype.clear = function () {
        this.cache.clear();
    };
    LRUCache.prototype.size = function () {
        return this.cache.size;
    };
    return LRUCache;
}());
export { LRUCache };
// Create a singleton instance for SVG content caching
export var svgMemoryCache = new LRUCache(100); // Cache up to 100 SVGs
// Helper function to generate consistent cache keys
export var generateSvgCacheKey = function (url) {
    return "svg-content-".concat(url.replace(/[^a-zA-Z0-9]/g, '-'));
};

// Cache for storing processed SVGs
const svgCache = new Map();

// Function to get a cached SVG
export const getCachedSvg = (key) => {
  return svgCache.get(key);
};

// Function to store an SVG in the cache
export const cacheSvg = (key, svg) => {
  svgCache.set(key, svg);
};

// Function to clear the entire cache
export const clearCache = () => {
  svgCache.clear();
};

// Function to check if an SVG exists in the cache
export const hasCachedSvg = (key) => {
  return svgCache.has(key);
};

// Function to get the size of the cache
export const getCacheSize = () => {
  return svgCache.size;
};

// Function to remove a specific SVG from the cache
export const removeCachedSvg = (key) => {
  return svgCache.delete(key);
};

// Function to get all cached keys
export const getCachedKeys = () => {
  return Array.from(svgCache.keys());
};

// Function to generate a cache key for a letter with specific settings
export const generateCacheKey = (letter, settings = {}) => {
  const settingsStr = JSON.stringify(settings);
  return `${letter}_${settingsStr}`;
};

// Export the cache instance for direct access if needed
export default svgCache;
