// src/hooks/useGraffitiGenerator.ts
import { useState, useCallback, useMemo, useRef } from 'react';
import { ProcessedSvg } from '../types';
import { useSvgCache } from './useSvgCache';
import { getLetterSvg, fetchSvg, shouldUseAlternate, getLetterRotation } from '../utils/letterUtils';
import { findOptimalOverlap, createSpaceSvg, processSvg } from '../utils/svgUtils';
import { letterSvgs } from '../data/letterMappings';

export const useGraffitiGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [processedSvgs, setProcessedSvgs] = useState<ProcessedSvg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('straight');
  
  // Reference to track the most recent generation request to prevent race conditions
  const latestRequestId = useRef(0);
  
  const { getCachedSvg, cacheSvg } = useSvgCache();
  
  // Calculate letter positions based on processed SVGs with improved positioning
  const { positions, contentWidth, contentHeight, containerScale } = useMemo(() => {
    if (!processedSvgs.length) {
      return {
        positions: [] as number[],
        contentWidth: 0,
        contentHeight: 0,
        containerScale: 1
      };
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
      const letterLeft = (positions[i] + svg.bounds.left) * svg.scale;
      const letterRight = (positions[i] + svg.bounds.right) * svg.scale;
      const letterTop = svg.bounds.top * svg.scale;
      const letterBottom = svg.bounds.bottom * svg.scale;

      groupMinX = Math.min(groupMinX, letterLeft);
      groupMaxX = Math.max(groupMaxX, letterRight);
      groupMinY = Math.min(groupMinY, letterTop);
      groupMaxY = Math.max(groupMaxY, letterBottom);
    });

    const contentWidth = Math.max(groupMaxX - groupMinX, 1); // Avoid division by zero
    const contentHeight = Math.max(groupMaxY - groupMinY, 1);

    // 3) Adjust positions so the group's left edge is 0
    const adjustedPositions = positions.map((pos, i) =>
      (pos * processedSvgs[i].scale) - groupMinX
    );

    // 4) Compute a default container scale (actual scaling will be handled by GraffitiDisplay)
    const containerScale = 1;

    return {
      positions: adjustedPositions,
      contentWidth,
      contentHeight,
      containerScale
    };
  }, [processedSvgs]);
  
  // Fetch and process a single letter SVG with error handling
  const processLetterSvg = useCallback(async (
    letter: string,
    isFirst: boolean,
    isLast: boolean,
    isAlternate: boolean,
    prevLetter: string | null
  ): Promise<ProcessedSvg> => {
    // Generate a cache key for this letter configuration
    const cacheKey = `${letter}_${isFirst ? 'first' : ''}${isLast ? 'last' : ''}${isAlternate ? 'alt' : ''}_${selectedStyle}`;
    
    // Check if we already have this letter in the cache
    const cachedSvg = getCachedSvg(cacheKey);
    if (cachedSvg) {
      // Apply rotation to the cached SVG
      const rotation = prevLetter ? getLetterRotation(letter, prevLetter) : 0;
      return { ...cachedSvg, rotation };
    }
    
    // Try to get and process the SVG with graceful fallbacks
    try {
      // First attempt: Try to get the appropriate SVG based on position and style
      let svgPath: string;
      try {
        svgPath = await getLetterSvg(letter, isAlternate, isFirst, isLast, selectedStyle);
      } catch (err) {
        // If that fails, try the standard version as fallback
        if (letterSvgs[letter]) {
          svgPath = letterSvgs[letter];
        } else {
          // If we truly don't have this letter, create a placeholder
          const fallbackSvg = createPlaceholderSvg(letter);
          const processed = await processSvg(fallbackSvg, letter);
          const rotation = prevLetter ? getLetterRotation(letter, prevLetter) : 0;
          return { ...processed, rotation };
        }
      }
      
      // Fetch and process the SVG
      try {
        const svgText = await fetchSvg(svgPath);
        const processed = await processSvg(svgText, letter);
        const rotation = prevLetter ? getLetterRotation(letter, prevLetter) : 0;
        
        // Cache the processed SVG
        cacheSvg(cacheKey, processed);
        
        return { ...processed, rotation };
      } catch (fetchErr) {
        // If fetching fails, try one more time with the standard version
        if (svgPath !== letterSvgs[letter] && letterSvgs[letter]) {
          const standardSvgText = await fetchSvg(letterSvgs[letter]);
          const processed = await processSvg(standardSvgText, letter);
          const rotation = prevLetter ? getLetterRotation(letter, prevLetter) : 0;
          return { ...processed, rotation };
        }
        throw fetchErr;
      }
    } catch (err) {
      // Log the error but don't let it crash the app
      console.warn(`Could not process letter '${letter}', using placeholder:`, err);
      
      // Create a simple placeholder as last resort
      const fallbackSvg = createPlaceholderSvg(letter);
      const processed = await processSvg(fallbackSvg, letter);
      return { ...processed, rotation: 0 };
    }
  }, [selectedStyle, getCachedSvg, cacheSvg]);
  
  // Create a placeholder SVG for missing letters
  const createPlaceholderSvg = (letter: string): string => {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect x="50" y="50" width="100" height="100" fill="#f0f0f0" stroke="#ccc" stroke-width="2" rx="10" />
      <text x="100" y="120" font-family="Arial" font-size="60" text-anchor="middle" fill="#999">${letter}</text>
    </svg>`;
  };
  
  // Main function to generate graffiti from input text
  const generateGraffiti = useCallback(async (text: string) => {
    if (!text.trim() || isGenerating) return;
    
    // Create a unique ID for this request to handle race conditions
    const requestId = ++latestRequestId.current;
    
    setIsGenerating(true);
    setError(null);

    try {
      // Clean and validate input
      const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      if (!cleanText) throw new Error('Please enter at least one character (a-z, 0-9)');
      if (cleanText.replace(/\s/g, '').length > 18)
        throw new Error('Maximum 18 characters allowed (excluding spaces)');
      
      console.log(`Generating graffiti for text: "${cleanText}"`);
      
      // Check for missing letters
      const missingLetters = cleanText.split('').filter(
        char => char !== ' ' && !letterSvgs[char]
      );
      
      if (missingLetters.length > 0) {
        console.warn(`The following characters are not available: ${missingLetters.join(', ')}`);
      }

      const letters = cleanText.split('');
      const nonSpaceLetters = letters.filter(char => char !== ' ');
      
      // Process each letter in parallel
      const processedLetters = await Promise.all(
        letters.map(async (letter, index) => {
          if (letter === ' ') return createSpaceSvg();
          
          const isFirst =
            selectedStyle !== 'straight' &&
            nonSpaceLetters[0] === letter &&
            letters.slice(0, index).filter(c => c !== ' ').length === 0;

          const isLast =
            selectedStyle !== 'straight' &&
            nonSpaceLetters[nonSpaceLetters.length - 1] === letter &&
            letters.slice(index + 1).filter(c => c !== ' ').length === 0;
          
          const isAlternate = shouldUseAlternate(letter, index, letters);
          const prevLetter = index > 0 ? letters[index - 1] : null;
          
          return processLetterSvg(letter, isFirst, isLast, isAlternate, prevLetter);
        })
      );
      
      // Check if this is still the most recent request
      if (requestId !== latestRequestId.current) {
        console.log('Ignoring stale request result');
        return;
      }
      
      console.log(`Setting processed SVGs: ${processedLetters.map(svg => svg.letter).join('')}`);
      setProcessedSvgs(processedLetters);
      setInputText(text);
    } catch (err) {
      console.error('Error generating graffiti:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate graffiti');
      // Don't clear processedSvgs on error to preserve the previous state
    } finally {
      if (requestId === latestRequestId.current) {
        setIsGenerating(false);
      }
    }
  }, [isGenerating, selectedStyle, processLetterSvg]);
  
  return {
    inputText,
    setInputText,
    isGenerating,
    error,
    selectedStyle,
    setSelectedStyle,
    processedSvgs,
    generateGraffiti,
    positions,
    contentWidth,
    contentHeight,
    containerScale
  };
};