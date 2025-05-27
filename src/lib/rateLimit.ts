import logger from './logger';
import { showWarning } from './toast';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum number of requests allowed in the window
  warningThreshold?: number; // Optional: Show warning when this many requests remain
}

interface RateLimitStore {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private store: Map<string, RateLimitStore>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.store = new Map();
    this.config = config;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now - value.timestamp > this.config.windowMs) {
        this.store.delete(key);
      }
    }
  }

  check(key: string): boolean {
    this.cleanup();
    
    const now = Date.now();
    const record = this.store.get(key);

    if (!record) {
      this.store.set(key, { timestamp: now, count: 1 });
      return true;
    }

    if (now - record.timestamp > this.config.windowMs) {
      this.store.set(key, { timestamp: now, count: 1 });
      return true;
    }

    if (record.count >= this.config.maxRequests) {
      const timeLeft = Math.ceil((record.timestamp + this.config.windowMs - now) / 1000);
      showWarning(`Rate limit reached. Please wait ${timeLeft} seconds before trying again.`);
      logger.warn('Rate limit exceeded', { key, count: record.count });
      return false;
    }

    // Show warning when approaching limit
    if (this.config.warningThreshold && 
        record.count === this.config.maxRequests - this.config.warningThreshold) {
      showWarning(`You're generating designs quickly! You have ${this.config.warningThreshold} more tries before a short cooldown.`);
    }

    record.count += 1;
    return true;
  }

  // Get remaining requests in current window
  getRemainingRequests(key: string): number {
    const record = this.store.get(key);
    if (!record) return this.config.maxRequests;
    
    const now = Date.now();
    if (now - record.timestamp > this.config.windowMs) return this.config.maxRequests;
    
    return Math.max(0, this.config.maxRequests - record.count);
  }
}

// Create rate limiters with different configurations
export const generalLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  warningThreshold: 10
});

// More generous SVG generation limit (60 per minute, warning at 10 remaining)
export const svgLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,  // Doubled from 30 to 60
  warningThreshold: 10
});

// Keep export limit conservative to prevent abuse
export const exportLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  warningThreshold: 2
});

// Strict rate limiter for password changes to prevent abuse
export const passwordChangeLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3, // Only 3 password changes per 15 minutes
  warningThreshold: 1 // Warn when 1 attempt remaining
});

// Helper function to check rate limits
export const checkRateLimit = (key: string, type: 'general' | 'svg' | 'export' | 'password'): boolean => {
  const limiter = type === 'svg' ? svgLimiter : 
                 type === 'export' ? exportLimiter : 
                 type === 'password' ? passwordChangeLimiter :
                 generalLimiter;
  
  return limiter.check(key);
}; 