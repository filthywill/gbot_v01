import { isDevelopment, isProduction } from './env';

// Log levels with TypeScript enum
enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// Sanitize sensitive data from logs
const sanitizeData = (data: unknown): unknown => {
  if (!data) return data;
  
  // If it's an object, create a new object with sanitized values
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = { ...data as Record<string, unknown> };
    
    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  return data;
};

// Production-safe logger
const logger = {
  error: (message: string, error?: unknown) => {
    if (isProduction()) {
      // In production, only log essential error information
      console.error(`[Error] ${message}`);
      // Optionally send to error tracking service here
    } else {
      console.error(`[Error] ${message}`, error || '');
    }
  },

  warn: (message: string, data?: unknown) => {
    if (isProduction()) {
      // In production, only log essential warning information
      console.warn(`[Warning] ${message}`);
    } else {
      console.warn(`[Warning] ${message}`, sanitizeData(data) || '');
    }
  },

  info: (message: string, data?: unknown) => {
    if (!isProduction()) {
      console.info(`[Info] ${message}`, sanitizeData(data) || '');
    }
    // Production info logging could be sent to analytics service
  },

  debug: (message: string, data?: unknown) => {
    if (isDevelopment()) {
      console.log(`[Debug] ${message}`, sanitizeData(data) || '');
    }
  }
};

// Freeze the logger to prevent modifications
Object.freeze(logger);

export default logger; 