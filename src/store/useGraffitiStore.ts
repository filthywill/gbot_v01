import { create } from 'zustand';
import { ProcessedSvg, CustomizationOptions, HistoryState } from '../types';
import { GRAFFITI_STYLES } from '../data/styles';
import { findOptimalOverlap } from '../utils/svgUtils';

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
  
  // Reset state
  resetState: () => void;
}

// Default customization options (CLASSIC preset)
const defaultCustomizationOptions: CustomizationOptions = {
  // Background options
  backgroundEnabled: false,
  backgroundColor: '#ffffff',
  
  // Fill options
  fillEnabled: true,
  fillColor: '#ffffff',
  
  // Stroke options (legacy, now disabled by default)
  strokeEnabled: false,
  strokeColor: '#ff0000',
  strokeWidth: 45,
  
  // Shadow options (legacy, now disabled by default)
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowOpacity: 1,
  shadowOffsetX: -400,
  shadowOffsetY: 5,
  shadowBlur: 0,
  
  // Path expansion options (formerly STAMP)
  stampEnabled: true,            // Enable by default
  stampColor: '#000000',         // Black expansion by default
  stampWidth: 60,                // CLASSIC preset uses width 60
  
  // Shine effect options
  shineEnabled: false,
  shineColor: '#ffffff',
  shineOpacity: 1,
  
  // Shadow effect options (using the paths in the SVG)
  shadowEffectEnabled: true,     // CLASSIC preset has shadow enabled
  shadowEffectOffsetX: -8,       // CLASSIC preset shadow X offset
  shadowEffectOffsetY: 2,        // CLASSIC preset shadow Y offset

  // Shield effect options
  shieldEnabled: true,           // CLASSIC preset has shield enabled
  shieldColor: '#f00000',        // CLASSIC preset uses red shield
  shieldWidth: 40,               // CLASSIC preset shield width
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
    const { processedSvgs } = get();
    
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
      const overlap = findOptimalOverlap(prev, curr);
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

    set({ positions, contentWidth, contentHeight, containerScale });
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
      return;
    }
    
    // Get the state to restore
    const stateToRestore = history[newIndex];
    
    // Mark this as an undo/redo operation to prevent adding to history
    set({ isUndoRedoOperation: true });
    
    // Restore the state
    set({
      inputText: stateToRestore.inputText,
      displayInputText: stateToRestore.inputText,
      customizationOptions: stateToRestore.options,
      currentHistoryIndex: newIndex
    });
    
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
      customizationOptions: defaultCustomizationOptions
    });
  }
})); 