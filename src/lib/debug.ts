import { isDevelopment } from './env';
import logger from './logger';

interface DebugConfig {
  readonly enableConsoleLogging: boolean;
  readonly enableDebugPanels: boolean;
  readonly enableValueOverlays: boolean;
}

// Debug configuration with secure defaults
const DEBUG_CONFIG: DebugConfig = {
  enableConsoleLogging: false,
  enableDebugPanels: false,
  enableValueOverlays: false,
};

// Initialize debug settings based on environment
const initializeDebugConfig = () => {
  // Force production mode when PROD flag is true
  if (import.meta.env.PROD === true) {
    Object.assign(DEBUG_CONFIG, {
      enableConsoleLogging: false,
      enableDebugPanels: false,
      enableValueOverlays: false,
    });
    return; // Skip development settings
  }
  
  if (isDevelopment()) {
    // Only enable debug features in development
    Object.assign(DEBUG_CONFIG, {
      enableConsoleLogging: true,
      enableDebugPanels: true,
      enableValueOverlays: false,
    });
  }
};

// Run initialization
initializeDebugConfig();

// Freeze the config to prevent runtime modifications
Object.freeze(DEBUG_CONFIG);

// Safe debug feature check functions
export const isDebugLoggingEnabled = () => DEBUG_CONFIG.enableConsoleLogging;
export const isDebugPanelEnabled = () => DEBUG_CONFIG.enableDebugPanels;
export const isValueOverlayEnabled = () => DEBUG_CONFIG.enableValueOverlays;

// Type-safe debug logger that only logs in development
export const debugLog = (message: string, data?: unknown) => {
  if (isDebugLoggingEnabled()) {
    logger.debug(message, data);
  }
}; 