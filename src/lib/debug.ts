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
  // Debug logs for initialization
  console.log('Debug initialization:', {
    'import.meta.env.PROD': import.meta.env.PROD,
    'isDevelopment()': isDevelopment(),
    'current DEBUG_CONFIG': { ...DEBUG_CONFIG }
  });

  // Force production mode when PROD flag is true
  if (import.meta.env.PROD === true) {
    console.log('Forcing production mode (PROD === true)');
    Object.assign(DEBUG_CONFIG, {
      enableConsoleLogging: false,
      enableDebugPanels: false,
      enableValueOverlays: false,
    });
    return; // Skip development settings
  }
  
  if (isDevelopment()) {
    console.log('Enabling development debug features');
    // Only enable debug features in development
    Object.assign(DEBUG_CONFIG, {
      enableConsoleLogging: true,
      enableDebugPanels: true,
      enableValueOverlays: false, // Default to false, can be toggled by UI
    });
  }

  // Log final debug configuration
  console.log('Final DEBUG_CONFIG:', { ...DEBUG_CONFIG });
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