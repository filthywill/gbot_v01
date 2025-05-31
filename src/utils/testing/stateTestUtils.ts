import { HistoryState, CustomizationOptions } from '../../types';

/**
 * Validates the integrity of the history state array and current index
 */
export const validateHistoryIntegrity = (
  history: HistoryState[], 
  currentIndex: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check basic constraints
  if (currentIndex < -1) {
    errors.push(`Current index ${currentIndex} cannot be less than -1`);
  }

  if (currentIndex >= history.length) {
    errors.push(`Current index ${currentIndex} exceeds history length ${history.length}`);
  }

  // Check if history is empty but index is not -1
  if (history.length === 0 && currentIndex !== -1) {
    errors.push('History is empty but current index is not -1');
  }

  // Check if history exists but index is -1
  if (history.length > 0 && currentIndex === -1) {
    errors.push('History exists but current index is -1');
  }

  // Validate each history state
  history.forEach((state, index) => {
    if (!state.inputText && state.inputText !== '') {
      errors.push(`History state at index ${index} missing inputText`);
    }

    if (!state.options) {
      errors.push(`History state at index ${index} missing options`);
    }

    // Validate customization options structure
    if (state.options) {
      const requiredOptions = [
        'backgroundEnabled',
        'backgroundColor',
        'fillEnabled',
        'fillColor',
        'strokeEnabled',
        'strokeColor',
        'strokeWidth'
      ];

      requiredOptions.forEach(option => {
        if (!(option in state.options)) {
          errors.push(`History state at index ${index} missing option: ${option}`);
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Tests undo/redo operations for correctness
 */
export const testUndoRedoOperation = (
  store: any, 
  expectedStates: HistoryState[]
): { success: boolean; errors: string[] } => {
  const errors: string[] = [];

  try {
    const initialState = store.getState();
    const initialHistory = [...initialState.history];
    const initialIndex = initialState.currentHistoryIndex;

    // Validate initial state
    const initialValidation = validateHistoryIntegrity(initialHistory, initialIndex);
    if (!initialValidation.isValid) {
      errors.push('Initial state validation failed: ' + initialValidation.errors.join(', '));
      return { success: false, errors };
    }

    // Test undo operations
    for (let i = initialIndex; i >= 0; i--) {
      const stateBefore = store.getState();
      
      // Perform undo
      store.getState().handleUndoRedo(i);
      
      const stateAfter = store.getState();
      
      // Validate the undo operation
      if (stateAfter.currentHistoryIndex !== i) {
        errors.push(`Undo failed: expected index ${i}, got ${stateAfter.currentHistoryIndex}`);
      }

      // Validate state restoration
      const expectedState = stateAfter.history[i];
      if (expectedState) {
        if (stateAfter.inputText !== expectedState.inputText) {
          errors.push(`Undo failed: input text mismatch at index ${i}`);
        }

        // Check key customization options
        const currentOptions = stateAfter.customizationOptions;
        const expectedOptions = expectedState.options;
        
        if (currentOptions.fillColor !== expectedOptions.fillColor) {
          errors.push(`Undo failed: fillColor mismatch at index ${i}`);
        }
      }
    }

    // Test redo operations
    for (let i = 0; i <= initialIndex; i++) {
      const stateBefore = store.getState();
      
      // Perform redo
      store.getState().handleUndoRedo(i);
      
      const stateAfter = store.getState();
      
      // Validate the redo operation
      if (stateAfter.currentHistoryIndex !== i) {
        errors.push(`Redo failed: expected index ${i}, got ${stateAfter.currentHistoryIndex}`);
      }
    }

    return { success: errors.length === 0, errors };
  } catch (error) {
    errors.push(`Undo/Redo test crashed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, errors };
  }
};

/**
 * Validates that a state change doesn't break undo/redo functionality
 */
export const validateStateChangeImpact = (
  store: any,
  beforeState: any,
  afterState: any
): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];

  // Check if history structure changed unexpectedly
  if (beforeState.history.length !== afterState.history.length) {
    if (afterState.isUndoRedoOperation) {
      // This is expected during undo/redo
    } else if (afterState.history.length === beforeState.history.length + 1) {
      // This is expected when adding to history
    } else {
      warnings.push('Unexpected history length change');
    }
  }

  // Check if current index changed appropriately
  const indexDiff = afterState.currentHistoryIndex - beforeState.currentHistoryIndex;
  if (Math.abs(indexDiff) > 1 && !afterState.isUndoRedoOperation) {
    warnings.push('Current history index changed by more than 1 in non-undo/redo operation');
  }

  // Validate that existing history entries weren't modified
  const minLength = Math.min(beforeState.history.length, afterState.history.length);
  for (let i = 0; i < minLength; i++) {
    const beforeEntry = beforeState.history[i];
    const afterEntry = afterState.history[i];
    
    if (beforeEntry !== afterEntry) {
      // Deep comparison for critical fields
      if (beforeEntry.inputText !== afterEntry.inputText ||
          beforeEntry.options.fillColor !== afterEntry.options.fillColor) {
        warnings.push(`History entry at index ${i} was modified`);
      }
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
};

/**
 * Performance measurement utility for state operations
 */
export const measureStateOperationPerformance = <T>(
  operation: () => T,
  operationName: string
): { result: T; duration: number; memoryUsage?: number } => {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize;

  const result = operation();

  const endTime = performance.now();
  const endMemory = (performance as any).memory?.usedJSHeapSize;

  const duration = endTime - startTime;
  const memoryUsage = startMemory && endMemory ? endMemory - startMemory : undefined;

  console.log(`${operationName} took ${duration.toFixed(2)}ms`, 
    memoryUsage ? `and used ${memoryUsage} bytes` : '');

  return {
    result,
    duration,
    memoryUsage
  };
};

/**
 * Utility to create test history states for validation
 */
export const createTestHistoryState = (
  inputText: string,
  customizations: Partial<CustomizationOptions> = {},
  presetId?: string
): HistoryState => {
  const defaultOptions: CustomizationOptions = {
    backgroundEnabled: false,
    backgroundColor: '#ffffff',
    fillEnabled: true,
    fillColor: '#000000',
    strokeEnabled: false,
    strokeColor: '#000000',
    strokeWidth: 2,
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    shadowBlur: 4,
    stampEnabled: false,
    stampColor: '#000000',
    stampWidth: 3,
    shineEnabled: false,
    shineColor: '#ffffff',
    shineOpacity: 0.3,
    shadowEffectEnabled: false,
    shadowEffectOffsetX: 5,
    shadowEffectOffsetY: 5,
    shieldEnabled: false,
    shieldColor: '#000000',
    shieldWidth: 8
  };

  return {
    inputText,
    options: { ...defaultOptions, ...customizations },
    presetId
  };
}; 