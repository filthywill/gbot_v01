/**
 * Selective hook for GraffitiDisplay component state management
 * Uses useShallow to prevent unnecessary re-renders by selecting only required state
 * Part of Phase 3.1 - State Management Optimization
 */

import { useShallow } from 'zustand/react/shallow';
import { useGraffitiStore } from '../store/useGraffitiStore';
import { CustomizationOptions, ProcessedSvg, HistoryState } from '../types';

export interface UseGraffitiDisplayReturn {
  // Display state
  isGenerating: boolean;
  processedSvgs: ProcessedSvg[];
  positions: number[];
  contentWidth: number;
  contentHeight: number;
  containerScale: number;
  customizationOptions: CustomizationOptions;
  
  // History state  
  customizationHistory: HistoryState[];
  currentHistoryIndex: number;
  
  // Input text
  displayInputText: string;
  
  // Actions
  handleUndoRedo: (newIndex: number) => void;
}

/**
 * Optimized selector for GraffitiDisplay component
 * Selects only the state needed for graffiti display and history management
 */
export const useGraffitiDisplay = (): UseGraffitiDisplayReturn => {
  return useGraffitiStore(
    useShallow((state) => ({
      // Display state - what's needed to render the graffiti
      isGenerating: state.isGenerating,
      processedSvgs: state.processedSvgs,
      positions: state.positions,
      contentWidth: state.contentWidth,
      contentHeight: state.contentHeight,
      containerScale: state.containerScale,
      customizationOptions: state.customizationOptions,
      
      // History state - for undo/redo functionality
      customizationHistory: state.history,
      currentHistoryIndex: state.currentHistoryIndex,
      
      // Input text for display
      displayInputText: state.displayInputText,
      
      // Actions - only the ones needed for display component
      handleUndoRedo: state.handleUndoRedo,
    }))
  );
}; 