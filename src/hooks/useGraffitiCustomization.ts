/**
 * Selective hook for CustomizationToolbar component state management
 * Uses useShallow to prevent unnecessary re-renders by selecting only customization state
 * Part of Phase 3.3 - State Management Optimization
 */

import { useShallow } from 'zustand/react/shallow';
import { useGraffitiStore } from '../store/useGraffitiStore';
import { CustomizationOptions } from '../types';

export interface UseGraffitiCustomizationReturn {
  // Customization state
  customizationOptions: CustomizationOptions;
  
  // Actions
  setCustomizationOptions: (options: Partial<CustomizationOptions>) => void;
}

/**
 * Optimized selector for CustomizationToolbar component
 * Selects only the state needed for customization handling
 */
export const useGraffitiCustomization = (): UseGraffitiCustomizationReturn => {
  return useGraffitiStore(
    useShallow((state) => ({
      // Customization state - what's needed for the customization toolbar
      customizationOptions: state.customizationOptions,
      
      // Actions - only the customization-related actions
      setCustomizationOptions: state.setCustomizationOptions,
    }))
  );
}; 