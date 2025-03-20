import { create } from 'zustand';
import { ProcessedSvg, CustomizationOptions, HistoryState, OverlapRule } from '../types';
import { GRAFFITI_STYLES } from '../data/styles';
import { findOptimalOverlap } from '../utils/svgUtils';
import { LETTER_OVERLAP_RULES, DEFAULT_OVERLAP, overlapExceptions, LETTER_ROTATION_RULES } from '../data/letterRules';
import { DEFAULT_CUSTOMIZATION_OPTIONS } from '../data/stylePresets';

interface GraffitiState {
  // Input and display state
  inputText: string;
  displayInputText: string;
  selectedStyle: string;
  
  // Processing state
  isGenerating: boolean;
  error: string | null;
  processedSvgs: ProcessedSvg[];
  
  // Layout calculations
  positions: number[];
  contentWidth: number;
  contentHeight: number;
  containerScale: number;
  
  // History state for undo/redo
  history: HistoryState[];
  currentHistoryIndex: number;
  isUndoRedoOperation: boolean;
  hasInitialGeneration: boolean;
  
  // Customization options
  customizationOptions: CustomizationOptions;

  // Overlap rules
  overlapRules: Record<string, OverlapRule>;
  defaultOverlap: OverlapRule;
  overlapExceptions: Record<string, string[]>;
  rotationRules: Record<string, Record<string, number>>;
  
  // Actions
  setInputText: (text: string) => void;
  setDisplayInputText: (text: string) => void;
  setSelectedStyle: (styleId: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  setProcessedSvgs: (svgs: ProcessedSvg[]) => void;
  updatePositions: () => void;
  setCustomizationOptions: (options: Partial<CustomizationOptions>) => void;
  
  // History actions
  addToHistory: (newState: HistoryState) => void;
  handleUndoRedo: (newIndex: number) => void;
  
  // Overlap rule actions
  updateOverlapRule: (letter: string, rule: Partial<OverlapRule>) => void;
  updateSpecialCase: (letter: string, targetLetter: string, overlap: number) => void;
  
  // Reset state
  resetState: () => void;
}

// Default customization options (CLASSIC preset)
const defaultCustomizationOptions: CustomizationOptions = {
  ...DEFAULT_CUSTOMIZATION_OPTIONS as CustomizationOptions
};

export const useGraffitiStore = create<GraffitiState>((set, get) => ({
  // Initial state
  inputText: '',
  displayInputText: '',
  selectedStyle: 'straight',
  isGenerating: false,
  error: null,
  processedSvgs: [],
  positions: [],
  contentWidth: 0,
  contentHeight: 0,
  containerScale: 1,
  history: [],
  currentHistoryIndex: -1,
  isUndoRedoOperation: false,
  hasInitialGeneration: false,
  customizationOptions: defaultCustomizationOptions,
  
  // Initialize overlap rules from letterRules.ts
  overlapRules: LETTER_OVERLAP_RULES,
  defaultOverlap: DEFAULT_OVERLAP,
  overlapExceptions: overlapExceptions,
  rotationRules: LETTER_ROTATION_RULES,
  
  // Actions
  setInputText: (text) => set({ inputText: text }),
  
  setDisplayInputText: (text) => set({ displayInputText: text }),
  
  setSelectedStyle: (styleId) => set({ selectedStyle: styleId }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  setError: (error) => set({ error }),
  
  setProcessedSvgs: (svgs) => {
    set({ processedSvgs: svgs });
    get().updatePositions();
  },
  
  updatePositions: () => {
    const { processedSvgs, overlapRules, defaultOverlap, overlapExceptions } = get();
    
    if (!processedSvgs.length) {
      set({
        positions: [],
        contentWidth: 0,
        contentHeight: 0,
        containerScale: 1
      });
      return;
    }

    // 1) Compute raw x-positions using overlap
    const positions: number[] = [];
    let currentX = 0;
    positions.push(currentX - processedSvgs[0].bounds.left);
    
    for (let i = 1; i < processedSvgs.length; i++) {
      const prev = processedSvgs[i - 1];
      const curr = processedSvgs[i];
      const prevLetterWidth = prev.bounds.right - prev.bounds.left;
      
      // Get overlap value and ensure it's within valid range
      const overlap = Math.min(Math.max(
        findOptimalOverlap(prev, curr, overlapRules, defaultOverlap, overlapExceptions),
        0
      ), 1);
      
      currentX += prevLetterWidth * (1 - overlap);
      positions.push(currentX - curr.bounds.left);
    }

    // 2) Compute global bounding box
    let groupMinX = Infinity, groupMaxX = -Infinity;
    let groupMinY = Infinity, groupMaxY = -Infinity;

    processedSvgs.forEach((svg, i) => {
      const x = positions[i];
      const minX = x + svg.bounds.left;
      const maxX = x + svg.bounds.right;
      const minY = svg.bounds.top;
      const maxY = svg.bounds.bottom;
      
      groupMinX = Math.min(groupMinX, minX);
      groupMaxX = Math.max(groupMaxX, maxX);
      groupMinY = Math.min(groupMinY, minY);
      groupMaxY = Math.max(groupMaxY, maxY);
    });

    // 3) Calculate content dimensions
    const contentWidth = groupMaxX - groupMinX;
    const contentHeight = groupMaxY - groupMinY;
    
    // 4) Calculate container scale (for responsive sizing)
    const containerScale = Math.min(1, 1000 / contentWidth);

    // 5) Update state with new values
    set({ 
      positions, 
      contentWidth, 
      contentHeight, 
      containerScale 
    });
  },
  
  setCustomizationOptions: (options) => {
    set((state) => ({
      customizationOptions: {
        ...state.customizationOptions,
        ...options
      }
    }));
  },
  
  addToHistory: (newState) => {
    const { history, currentHistoryIndex, isUndoRedoOperation } = get();
    
    // Skip if this is an undo/redo operation
    if (isUndoRedoOperation) {
      set({ isUndoRedoOperation: false });
      return;
    }
    
    // Create a new history array by removing any future states
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    
    // Add the new state
    newHistory.push(newState);
    
    // Update the history and current index
    set({
      history: newHistory,
      currentHistoryIndex: newHistory.length - 1
    });
  },
  
  handleUndoRedo: (newIndex) => {
    const { history, currentHistoryIndex } = get();
    
    // Validate the new index
    if (newIndex < 0 || newIndex >= history.length || newIndex === currentHistoryIndex) {
      console.log('Invalid undo/redo index:', { newIndex, historyLength: history.length, currentHistoryIndex });
      return;
    }
    
    // Get the state to restore
    const stateToRestore = history[newIndex];
    if (!stateToRestore) {
      console.error('State to restore is undefined:', { newIndex, historyLength: history.length });
      return;
    }
    
    // Mark this as an undo/redo operation to prevent adding to history
    set({ isUndoRedoOperation: true });
    
    try {
      console.log('Restoring state:', {
        fromIndex: currentHistoryIndex,
        toIndex: newIndex,
        inputText: stateToRestore.inputText,
        presetId: stateToRestore.presetId || 'custom state'
      });
      
      // Restore the state
      set({
        inputText: stateToRestore.inputText,
        displayInputText: stateToRestore.inputText,
        customizationOptions: { ...stateToRestore.options },
        currentHistoryIndex: newIndex
      });
    } catch (error) {
      console.error('Error during undo/redo operation:', error);
      // Reset the undo/redo flag in case of error
      set({ isUndoRedoOperation: false });
    } finally {
      // Always reset the undo/redo flag to prevent it from getting stuck
      setTimeout(() => {
        set({ isUndoRedoOperation: false });
      }, 0);
    }
    
    // Note: You'll need to call generateGraffiti separately after this
  },
  
  resetState: () => {
    set({
      inputText: '',
      displayInputText: '',
      selectedStyle: 'straight',
      isGenerating: false,
      error: null,
      processedSvgs: [],
      positions: [],
      contentWidth: 0,
      contentHeight: 0,
      containerScale: 1,
      history: [],
      currentHistoryIndex: -1,
      isUndoRedoOperation: false,
      hasInitialGeneration: false,
      customizationOptions: defaultCustomizationOptions,
      
      // Initialize overlap rules from letterRules.ts
      overlapRules: LETTER_OVERLAP_RULES,
      defaultOverlap: DEFAULT_OVERLAP,
      overlapExceptions: overlapExceptions,
      rotationRules: LETTER_ROTATION_RULES
    });
  },
  
  // Update overlap rule for a letter
  updateOverlapRule: (letter: string, rule: Partial<OverlapRule>) => {
    set((state) => {
      // Get the current rule or create a new one with default values
      const currentRule = state.overlapRules[letter] || { 
        minOverlap: state.defaultOverlap.minOverlap,
        maxOverlap: state.defaultOverlap.maxOverlap,
        specialCases: {}
      };

      // Create the updated rule, ensuring specialCases is preserved
      const updatedRule = {
        ...currentRule,
        ...rule,
        specialCases: {
          ...currentRule.specialCases,
          ...(rule.specialCases || {})
        }
      };

      // Create new overlapRules object with the updated rule
      const newOverlapRules = {
        ...state.overlapRules,
        [letter]: updatedRule
      };

      return {
        overlapRules: newOverlapRules
      };
    });

    // Trigger position recalculation
    get().updatePositions();
  },

  // Update special case overlap for a specific letter pair
  updateSpecialCase: (letter: string, targetLetter: string, overlap: number) => {
    set((state) => {
      // Get the current rule or create a new one with default values
      const currentRule = state.overlapRules[letter] || {
        minOverlap: state.defaultOverlap.minOverlap,
        maxOverlap: state.defaultOverlap.maxOverlap,
        specialCases: {}
      };

      // Create the updated rule with the new special case
      const updatedRule = {
        ...currentRule,
        specialCases: {
          ...currentRule.specialCases,
          [targetLetter]: overlap
        }
      };

      return {
        overlapRules: {
          ...state.overlapRules,
          [letter]: updatedRule
        }
      };
    });

    // Trigger position recalculation
    get().updatePositions();
  }
})); 