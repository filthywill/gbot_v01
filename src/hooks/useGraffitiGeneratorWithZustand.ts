import { useCallback, useEffect, useRef } from 'react';
import { ProcessedSvg, HistoryState } from '../types';
import { useSvgCache } from './useSvgCache';
import { getLetterSvg, fetchSvg, shouldUseAlternate, getLetterRotation } from '../utils/letterUtils';
import { createSpaceSvg, processSvg } from '../utils/svgUtils';
import { letterSvgs } from '../data/letterMappings';
import { useGraffitiStore } from '../store/useGraffitiStore';

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
    handleUndoRedo,
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
  
  // Process a batch of letters in parallel with optimized caching
  const processBatch = async (letters: { letter: string, index: number, text: string }[]): Promise<ProcessedSvg[]> => {
    return Promise.all(letters.map(async ({ letter, index, text }) => {
      // For spaces, create a simple space SVG
      if (letter === ' ') {
        return createSpaceSvg();
      }
      
      // Determine if we should use an alternate version
      const useAlternate = shouldUseAlternate(letter, index, text.split(''));
      const isFirst = index === 0;
      const isLast = index === text.length - 1;
      
      // Create a cache key for this letter
      const cacheKey = `${letter}-${useAlternate ? 'alt' : 'std'}-${isFirst ? 'first' : ''}-${isLast ? 'last' : ''}-${selectedStyle}`;
      
      // Check if we have this letter in the cache
      const cachedSvg = getCachedSvg(cacheKey);
      if (cachedSvg) {
        return cachedSvg;
      }
      
      try {
        // Get the appropriate SVG path for this letter
        const svgPath = await getLetterSvg(letter, useAlternate, isFirst, isLast, selectedStyle);
        
        try {
          // Try to fetch the SVG content
          const svgContent = await fetchSvg(svgPath);
          
          // Process the SVG to extract bounds and other data
          const prevLetter = index > 0 ? text[index - 1] : null;
          const rotation = getLetterRotation(letter, prevLetter);
          
          // Process the SVG content
          const processed = await processSvg(svgContent, letter, rotation);
          
          // Cache the processed SVG
          cacheSvg(cacheKey, processed);
          
          // Add to processed set
          processedLettersRef.current.add(cacheKey);
          
          return processed;
        } catch (err) {
          console.warn(`Error with SVG for letter '${letter}', using placeholder:`, err);
          const svgContent = createPlaceholderSvg(letter);
          return processSvg(svgContent, letter, 0);
        }
      } catch (err) {
        console.warn(`Error getting SVG for letter '${letter}', using placeholder:`, err);
        const svgContent = createPlaceholderSvg(letter);
        return processSvg(svgContent, letter, 0);
      }
    }));
  };
  
  // Generate graffiti from text input
  const generateGraffiti = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }
    
    try {
      // Clear any previous errors
      setError(null);
      
      // Set generating state to true
      setIsGenerating(true);
      
      // Normalize text
      const normalizedText = text.trim().toLowerCase();
      
      // Prepare letter data for batch processing
      const letterData = normalizedText.split('').map((letter, index) => ({
        letter,
        index,
        text: normalizedText
      })).filter(item => letterSvgs[item.letter] || item.letter === ' ');
      
      // Process all letters in parallel batches
      const batchSize = 5; // Process 5 letters at a time
      const processedLetters: ProcessedSvg[] = [];
      
      // Process all batches before updating the UI
      for (let i = 0; i < letterData.length; i += batchSize) {
        const batch = letterData.slice(i, i + batchSize);
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
      setError('Failed to generate graffiti. Please try again.');
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
    // Update the customization options in the store
    setCustomizationOptions(newOptions);
    
    // Add to history if this isn't marked to skip history
    if (!newOptions.__skipHistory) {
      const newHistoryState: HistoryState = {
        inputText,
        options: { ...customizationOptions, ...newOptions }
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