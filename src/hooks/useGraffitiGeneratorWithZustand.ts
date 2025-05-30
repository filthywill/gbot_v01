import { useCallback, useEffect, useRef } from 'react';
import { ProcessedSvg, HistoryState } from '../types';
import { useSvgCache } from './useSvgCache';
import { getLetterSvg, fetchSvg, shouldUseAlternate } from '../utils/letterUtils';
import { createSpaceSvg, processSvg } from '../utils/svgUtils';
import { letterSvgs } from '../data/letterMappings';
import { useGraffitiStore } from '../store/useGraffitiStore';
import { checkRateLimit } from '../lib/rateLimit';
import logger from '../lib/logger';
import { showError, showWarning } from '../lib/toast';
import { getProcessedSvgFromLookupTable, isLookupAvailable } from '../utils/svgLookup';

const BATCH_SIZE = 5; // Process 5 letters at a time

export const useGraffitiGeneratorWithZustand = () => {
  // Get state and actions from the Zustand store
  const {
    inputText,
    setInputText,
    displayInputText,
    setDisplayInputText,
    isGenerating,
    setIsGenerating,
    error,
    setError,
    selectedStyle,
    setSelectedStyle,
    processedSvgs,
    setProcessedSvgs,
    positions,
    contentWidth,
    contentHeight,
    containerScale,
    customizationOptions,
    setCustomizationOptions,
    history,
    currentHistoryIndex,
    isUndoRedoOperation,
    hasInitialGeneration,
    addToHistory,
    handleUndoRedo: storeHandleUndoRedo,
    updatePositions
  } = useGraffitiStore();

  // Use the SVG cache hook
  const { getCachedSvg, cacheSvg, preloadSvg, clearCache } = useSvgCache();
  
  // Keep track of letters we've already processed to avoid redundant work
  const processedLettersRef = useRef(new Set<string>());
  
  // Preload common letters when the component mounts or style changes
  useEffect(() => {
    // Clear the processed letters set when style changes
    processedLettersRef.current.clear();
    
    // Preload common letters in the background
    const preloadCommonLetters = async () => {
      // Common letters to preload - prioritize most common English letters
      const commonLetters = 'etaoinsrhdlucmfywgpbvkjxqz';
      
      // Preload in the background without blocking UI
      for (const letter of commonLetters) {
        if (letterSvgs[letter]) {
          try {
            // Create standard and alternate versions
            const standardSvgPath = await getLetterSvg(letter, false, false, false, selectedStyle);
            const alternateSvgPath = await getLetterSvg(letter, true, false, false, selectedStyle);
            
            // Preload both versions
            preloadSvg(letter, standardSvgPath, selectedStyle);
            preloadSvg(letter, alternateSvgPath, selectedStyle);
            
            // Add to processed set
            processedLettersRef.current.add(`${letter}-std-false-false-${selectedStyle}`);
            processedLettersRef.current.add(`${letter}-alt-false-false-${selectedStyle}`);
          } catch (err) {
            // Silently continue if preloading fails
            console.debug(`Preload failed for letter ${letter}:`, err);
          }
        }
      }
    };
    
    preloadCommonLetters();
    
    // Clear cache when style changes to prevent stale data
    return () => {
      // Only clear cache when style changes, not on component unmount
      if (selectedStyle) {
        clearCache(selectedStyle);
      }
    };
  }, [selectedStyle, preloadSvg, clearCache]);
  
  // Create a placeholder SVG for missing letters
  const createPlaceholderSvg = (letter: string): string => {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
        <rect x="10" y="10" width="80" height="80" fill="#ffeeee" stroke="#ff0000" stroke-width="3"/>
        <text x="50" y="55" font-family="Arial" font-size="40" text-anchor="middle" fill="#ff0000">${letter}</text>
      </svg>
    `;
  };
  
  // Check if lookup is available for current style
  const isLookupEnabled = isLookupAvailable(selectedStyle);
  
  // Process a single letter using lookup or fallback
  const processLetter = async (
    letter: string,
    index: number,
    text: string,
    useAlternate: boolean,
    isFirst: boolean,
    isLast: boolean
  ): Promise<ProcessedSvg> => {
    // Handle spaces
    if (letter === ' ') {
      return createSpaceSvg();
    }

    // Determine variant
    const variant = useAlternate ? 'alternate' : (isFirst ? 'first' : (isLast ? 'last' : 'standard')) as 'standard' | 'alternate' | 'first' | 'last';
    
    // Try lookup first if available
    if (isLookupEnabled) {
      try {
        const lookupResult = await getProcessedSvgFromLookupTable(letter, selectedStyle, variant, 0, {
          logPerformance: false // Reduce log noise during generation
        });
        
        if (lookupResult) {
          return lookupResult;
        }
      } catch (error) {
        console.warn(`🔍 Lookup failed for '${letter}', falling back to runtime:`, error);
      }
    }

    // Fallback to runtime processing
    const cacheKey = `${letter}-${variant}-${selectedStyle}`;
    const cachedSvg = getCachedSvg(cacheKey);
    if (cachedSvg) {
      return cachedSvg;
    }

    try {
      const svgPath = await getLetterSvg(letter, useAlternate, isFirst, isLast, selectedStyle);
      const svgContent = await fetchSvg(svgPath);
      const processed = await processSvg(svgContent, letter, 0);
      
      // Cache for future use
      cacheSvg(cacheKey, processed);
      return processed;
    } catch (error) {
      console.warn(`Error processing letter '${letter}', using placeholder:`, error);
      const svgContent = createPlaceholderSvg(letter);
      return processSvg(svgContent, letter, 0);
    }
  };
  
  // Process a batch of letters in parallel with optimized caching
  const processBatch = async (letters: { letter: string, index: number, text: string }[]): Promise<ProcessedSvg[]> => {
    const startTime = performance.now();
    const method = isLookupEnabled ? 'Lookup System' : 'Runtime Processing';
    
    console.log(`🚀 Processing ${letters.length} letters using: ${method}`);
    
    const results: ProcessedSvg[] = [];
    
    // Process letters in smaller chunks to avoid overwhelming the browser
    for (let i = 0; i < letters.length; i += BATCH_SIZE) {
      const batch = letters.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async ({ letter, index, text }) => {
        // Determine letter variants
        const useAlternate = shouldUseAlternate(letter, index, text.split(''));
        const isFirst = index === 0;
        const isLast = index === text.length - 1;
        
        return processLetter(letter, index, text, useAlternate, isFirst, isLast);
      });

      // Wait for all letters in this batch to be processed
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to prevent UI blocking
      if (i + BATCH_SIZE < letters.length) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }
    
    // Track performance
    trackProcessingTime(startTime, method, letters.length);

    return results;
  };
  
  // Generate graffiti from text input
  const generateGraffiti = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('Please enter some text');
      showWarning('Please enter some text to generate');
      return;
    }
    
    // Check rate limit before proceeding
    if (!checkRateLimit('graffiti_generation', 'svg')) {
      logger.warn('SVG generation rate limit exceeded');
      setError('Please wait a moment before generating more graffiti');
      // Toast message is now handled by the rate limiter
      return;
    }
    
    try {
      // Clear any previous errors
      setError(null);
      
      // Set generating state to true
      setIsGenerating(true);
      
      // Normalize text
      const normalizedText = text.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
      
      // Prepare letter data for batch processing
      const letterData = normalizedText.split('').map((letter, index) => ({
        letter,
        index,
        text: normalizedText
      })).filter(item => letterSvgs[item.letter] || item.letter === ' ');
      
      // Process all letters in parallel batches
      const processedLetters: ProcessedSvg[] = [];
      
      // Process all batches before updating the UI
      for (let i = 0; i < letterData.length; i += BATCH_SIZE) {
        const batch = letterData.slice(i, i + BATCH_SIZE);
        const batchResults = await processBatch(batch);
        processedLetters.push(...batchResults);
      }
      
      // Update the store in a specific order to minimize visual glitches
      // 1. Set the processed SVGs
      setProcessedSvgs(processedLetters);
      
      // 2. Calculate positions based on the new SVGs
      updatePositions();
      
      // 3. Update display text
      setDisplayInputText(text);
      
      // 4. Add to history if needed
      if (!isUndoRedoOperation && text !== displayInputText) {
        addToHistory({
          inputText: text,
          options: { ...customizationOptions }
        });
      }
      
      // 5. Set initial generation flag if needed
      if (!hasInitialGeneration) {
        useGraffitiStore.setState({ hasInitialGeneration: true });
      }
      
      // 6. Finally, set generating to false
      setIsGenerating(false);
      
      // 7. Pre-process next potential letters
      // Predict what the user might type next and preload those letters
      if (text.length > 0) {
        const lastLetter = text[text.length - 1].toLowerCase();
        const commonFollowingLetters: Record<string, string> = {
          'e': 'rndsalm', 't': 'hoiearu', 'a': 'nrltscb', 'o': 'nrufmwp',
          'i': 'ntscdlm', 'n': 'gdeotsc', 's': 'teopiau', 'h': 'eaiotur',
          'r': 'eaoisy', 'd': 'eiaosu', 'l': 'eiaouly', 'u': 'rnsltcpm',
          'c': 'oeahktu', 'm': 'aeiopbu', 'f': 'oiraule', 'w': 'aioehns',
          'g': 'aeorihlu', 'p': 'aeorplu', 'b': 'eaolury', 'v': 'eaiouy',
          'k': 'eiasnl', 'j': 'aeouir', 'x': 'ptaiec', 'q': 'u', 'z': 'eaio',
          ' ': 'tasiwcbpfm'
        };
        
        // Get common letters that follow the last letter
        const followingLetters = commonFollowingLetters[lastLetter] || 'etaoinsrh';
        
        // Preload these letters in the background
        setTimeout(() => {
          for (const nextLetter of followingLetters.split('')) {
            if (letterSvgs[nextLetter]) {
              try {
                // Get the appropriate SVG path for this letter
                getLetterSvg(nextLetter, false, false, false, selectedStyle)
                  .then(svgPath => preloadSvg(nextLetter, svgPath, selectedStyle))
                  .catch(() => {/* Silently ignore preload failures */});
              } catch (err) {
                // Silently ignore preload failures
              }
            }
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('Error generating graffiti:', error);
      const errorMessage = 'Failed to generate graffiti. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
      setIsGenerating(false);
    }
  }, [
    selectedStyle,
    customizationOptions,
    isUndoRedoOperation,
    displayInputText,
    hasInitialGeneration,
    setError,
    setIsGenerating,
    setProcessedSvgs,
    setDisplayInputText,
    addToHistory,
    getCachedSvg,
    cacheSvg,
    updatePositions,
    preloadSvg
  ]);
  
  // Handle input text changes with predictive preloading
  const handleInputTextChange = useCallback((text: string) => {
    setDisplayInputText(text);
    
    // Predictively preload the current text in the background
    if (text.trim()) {
      setTimeout(() => {
        const normalizedText = text.trim().toLowerCase();
        
        // Preload the last few letters the user typed
        const lastFewLetters = normalizedText.slice(-3);
        
        for (const letter of lastFewLetters) {
          if (letterSvgs[letter]) {
            try {
              // Get the appropriate SVG path for this letter
              getLetterSvg(letter, false, false, false, selectedStyle)
                .then(svgPath => preloadSvg(letter, svgPath, selectedStyle))
                .catch(() => {/* Silently ignore preload failures */});
            } catch (err) {
              // Silently ignore preload failures
            }
          }
        }
      }, 50);
    }
  }, [setDisplayInputText, selectedStyle, preloadSvg]);
  
  // Handle customization changes
  const handleCustomizationChange = useCallback((newOptions: Partial<typeof customizationOptions>) => {
    // Extract the preset ID if present
    const { __presetId, __skipHistory, ...cleanOptions } = newOptions as any;
    
    // Update the customization options in the store
    setCustomizationOptions(cleanOptions);
    
    // Add to history if this isn't marked to skip history
    if (!__skipHistory) {
      // Create merged options for the history state
      const mergedOptions = { ...customizationOptions, ...cleanOptions };
      
      // If this change came from applying a preset, log it
      if (__presetId) {
        console.log(`Adding history entry for preset: ${__presetId}`);
      }
      
      const newHistoryState: HistoryState = {
        inputText,
        options: mergedOptions,
        // Include the preset ID if this change came from applying a preset
        presetId: __presetId
      };
      
      addToHistory(newHistoryState);
    }
  }, [customizationOptions, inputText, addToHistory, setCustomizationOptions]);
  
  // Handle style changes
  const handleStyleChange = useCallback((styleId: string) => {
    setSelectedStyle(styleId);
    
    // Regenerate with the new style if we have text
    if (inputText) {
      generateGraffiti(inputText);
    }
  }, [inputText, setSelectedStyle, generateGraffiti]);
  
  // Handle undo/redo operations
  const handleUndoRedo = useCallback((newIndex: number) => {
    // First, call the store's handleUndoRedo function to restore the state
    storeHandleUndoRedo(newIndex);
    
    // After the state is restored, we need to regenerate the graffiti
    // Get the updated state after the undo/redo operation
    const { inputText, isUndoRedoOperation } = useGraffitiStore.getState();
    
    console.log('After undo/redo, regenerating graffiti with:', {
      inputText,
      isUndoRedoOperation,
      newIndex
    });
    
    // Regenerate the graffiti with the restored text
    if (inputText) {
      // We need to wait for the state update to complete
      setTimeout(() => {
        generateGraffiti(inputText);
      }, 0);
    }
  }, [generateGraffiti, storeHandleUndoRedo]);
  
  // Performance tracking
  const trackProcessingTime = (startTime: number, method: string, letterCount: number) => {
    const duration = performance.now() - startTime;
    const perLetter = duration / letterCount;
    console.log(`🎯 ${method}: ${duration.toFixed(2)}ms total, ${perLetter.toFixed(2)}ms/letter`);
    return { duration, perLetter };
  };
  
  return {
    // State
    inputText,
    displayInputText,
    isGenerating,
    error,
    selectedStyle,
    processedSvgs,
    positions,
    contentWidth,
    contentHeight,
    containerScale,
    customizationOptions,
    history,
    currentHistoryIndex,
    
    // Actions
    setInputText,
    setDisplayInputText,
    generateGraffiti,
    handleCustomizationChange,
    handleInputTextChange,
    handleStyleChange,
    handleUndoRedo
  };
}; 