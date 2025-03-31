import { useCallback } from 'react';
import { CustomizationOptions, HistoryState } from '../types';
import { useGraffitiStore } from '../store/useGraffitiStore';

/**
 * A custom hook for standardized history tracking across the application.
 * Provides consistent methods for handling temporary state changes and
 * adding entries to the history stack.
 */
export const useHistoryTracking = () => {
  // Get the necessary state and actions from the Zustand store
  const { 
    addToHistory, 
    handleUndoRedo: storeHandleUndoRedo, 
    inputText, 
    customizationOptions
  } = useGraffitiStore();

  /**
   * Updates state without creating a history entry.
   * Use this for temporary changes during user interaction (e.g., dragging a slider).
   * 
   * @param updates Partial customization options to update
   * @returns The updated options with the __skipHistory flag
   */
  const updateWithoutHistory = useCallback((updates: Partial<CustomizationOptions>) => {
    // Apply the flag to skip history
    return { ...updates, __skipHistory: true };
  }, []);

  /**
   * Updates state and creates a history entry.
   * Use this for final changes when user interaction is complete.
   * 
   * @param updates Partial customization options to update
   * @param presetId Optional preset ID if this change came from applying a preset
   * @returns The updated options without the __skipHistory flag
   */
  const updateWithHistory = useCallback((
    updates: Partial<CustomizationOptions>, 
    presetId?: string
  ) => {
    // If a preset ID is provided, include it in the update
    if (presetId) {
      return { ...updates, __presetId: presetId };
    }
    
    // Return without any special flags - will create a history entry
    return updates;
  }, []);

  /**
   * Manually creates a history entry with the current state and any updates.
   * Use this when you need direct control over history creation.
   * 
   * @param updates Optional updates to apply before creating the history entry
   * @param presetId Optional preset ID if this change came from applying a preset
   */
  const createHistoryEntry = useCallback((
    updates?: Partial<CustomizationOptions>,
    presetId?: string
  ) => {
    // Merge the current options with any updates
    const mergedOptions = {
      ...customizationOptions,
      ...(updates || {})
    };

    // Create a new history state
    const newHistoryState: HistoryState = {
      inputText,
      options: mergedOptions,
      presetId
    };

    // Add to history
    addToHistory(newHistoryState);
  }, [customizationOptions, inputText, addToHistory]);

  /**
   * Standard handler for undo/redo operations.
   * 
   * @param newIndex The target history index to navigate to
   * @param onComplete Optional callback to run after state is restored
   */
  const handleUndoRedo = useCallback((
    newIndex: number,
    onComplete?: () => void
  ) => {
    // Call the store's undo/redo function
    storeHandleUndoRedo(newIndex);

    // Execute the callback after a short delay to ensure state is updated
    if (onComplete) {
      setTimeout(onComplete, 0);
    }
  }, [storeHandleUndoRedo]);

  return {
    updateWithoutHistory,
    updateWithHistory,
    createHistoryEntry,
    handleUndoRedo
  };
}; 