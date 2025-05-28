// Development configuration utilities
// This file leverages the existing __DEV__ environment variable

declare const __DEV__: boolean;

export const DEV_CONFIG = {
  // Only available in development builds (using existing __DEV__ variable)
  RUNTIME_OVERLAP_AVAILABLE: __DEV__,
  
  // Check if runtime overlap calculation is currently enabled
  getRuntimeOverlapEnabled: (): boolean => {
    return __DEV__ && 
           localStorage.getItem('dev-runtime-overlap') === 'true';
  },
  
  // Set runtime overlap calculation mode
  setRuntimeOverlapEnabled: (enabled: boolean): void => {
    if (__DEV__) {
      localStorage.setItem('dev-runtime-overlap', enabled.toString());
    }
  }
};

// Type declaration for global environment variable (already exists in your system)
declare global {
  const __DEV__: boolean;
} 