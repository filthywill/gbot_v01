/**
 * Selective hook for InputForm and StyleSelector components state management
 * Uses useShallow to prevent unnecessary re-renders by selecting only required state
 * Part of Phase 3.2 - State Management Optimization
 */

import { useShallow } from 'zustand/react/shallow';
import { useGraffitiStore } from '../store/useGraffitiStore';
import { GraffitiStyle } from '../types';

export interface UseGraffitiControlsReturn {
  // Input state
  displayInputText: string;
  isGenerating: boolean;
  error: string | null;
  
  // Style state
  selectedStyle: string;
  
  // Actions
  setInputText: (text: string) => void;
  handleStyleChange: (styleId: string) => void;
  generateGraffiti: (text: string) => Promise<void>;
}

/**
 * Optimized selector for InputForm and StyleSelector components
 * Selects only the state needed for input handling and style selection
 */
export const useGraffitiControls = (
  styles: GraffitiStyle[],
  onGenerate: (text: string) => Promise<void>
): UseGraffitiControlsReturn => {
  return useGraffitiStore(
    useShallow((state) => ({
      // Input state - what's needed for the input form
      displayInputText: state.displayInputText,
      isGenerating: state.isGenerating,
      error: state.error,
      
      // Style state - what's needed for style selection
      selectedStyle: state.selectedStyle,
      
      // Actions - only the ones needed for input and style controls
      setInputText: state.setDisplayInputText,
      handleStyleChange: state.setSelectedStyle,
      generateGraffiti: onGenerate, // Pass through the generation function
    }))
  );
}; 