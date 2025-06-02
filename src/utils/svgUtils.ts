import { ProcessedSvg, OverlapRule } from '../types';
import { DEV_CONFIG } from './devConfig';
import { getOverlapValue, COMPLETE_OVERLAP_LOOKUP } from '../data/generatedOverlapLookup';
import { getLetterSvg } from './letterUtils';

// Create a space SVG object with valid SVG content
export function createSpaceSvg(): ProcessedSvg {
  const spaceWidth = 70;
  const blankSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"></svg>`;
  
  return {
    svg: blankSvg,
    width: spaceWidth,
    height: 200,
    bounds: { left: 0, right: spaceWidth, top: 0, bottom: 200 },
    pixelData: Array(200).fill(null).map(() => Array(200).fill(false)),
    verticalPixelRanges: Array(200).fill(null),
    scale: 1,
    letter: ' ',
    isSpace: true
  };
}

// Find optimal overlap between two letters
export function findOptimalOverlap(
  prev: ProcessedSvg, 
  current: ProcessedSvg,
  overlapRules: Record<string, OverlapRule>,
  defaultOverlap: OverlapRule,
  overlapExceptions: Record<string, string[]>
): number {
  if (prev.isSpace || current.isSpace) return 0;
  
  const prevLetter = /[a-zA-Z]/.test(prev.letter) ? prev.letter.toLowerCase() : prev.letter;
  const currentLetter = /[a-zA-Z]/.test(current.letter) ? current.letter.toLowerCase() : current.letter;
  
  const start = __DEV__ ? performance.now() : 0;
  
  // Check if we should use runtime calculation (development mode)
  const useRuntime = DEV_CONFIG.getRuntimeOverlapEnabled();
  
  if (__DEV__) {
    console.group(`🔧 Overlap Calculation: ${prevLetter}→${currentLetter}`);
    console.log(`Mode: ${useRuntime ? '🔬 RUNTIME (Pixel Analysis)' : '📊 LOOKUP TABLE'}`);
  }
  
  let result: number;
  
  if (useRuntime) {
    // RUNTIME MODE: Use pixel analysis
    if (__DEV__) {
      console.log('🔬 Using runtime pixel analysis...');
    }
    result = calculateOptimalOverlapFromPixels(prev, current, overlapRules, defaultOverlap, overlapExceptions);
  } else {
    // LOOKUP MODE: Try lookup table first, fallback to rule-based
    if (__DEV__) {
      console.log('📊 Checking lookup table...');
    }
    
    // Check if the lookup table has this combination
    const hasLookupValue = COMPLETE_OVERLAP_LOOKUP[prevLetter]?.[currentLetter] !== undefined;
    
    if (hasLookupValue) {
      const lookupValue = getOverlapValue(prevLetter, currentLetter);
      
      if (__DEV__) {
        console.log(`✅ Found in lookup table: ${lookupValue}`);
      }
      result = lookupValue;
    } else {
      if (__DEV__) {
        console.log('⚠️ Not found in lookup table, using rule-based calculation');
      }
      result = calculateRuleBasedOverlap(prev, current, overlapRules, defaultOverlap, overlapExceptions);
    }
  }
  
  if (__DEV__) {
    const duration = performance.now() - start;
    console.log(`⏱️ Calculation took: ${duration.toFixed(3)}ms`);
    console.log(`📐 Final overlap: ${result.toFixed(3)}`);
    console.groupEnd();
  }
  
  return result;
}

// Renamed original logic for clarity
function calculateOptimalOverlapFromPixels(
  prev: ProcessedSvg, 
  current: ProcessedSvg,
  overlapRules: Record<string, OverlapRule>,
  defaultOverlap: OverlapRule,
  overlapExceptions: Record<string, string[]>
): number {
  // Only convert to lowercase if it's a letter
  const prevLetter = /[a-zA-Z]/.test(prev.letter) ? prev.letter.toLowerCase() : prev.letter;
  const currentLetter = /[a-zA-Z]/.test(current.letter) ? current.letter.toLowerCase() : current.letter;
  
  // Get rules from the parameters
  const rules = overlapRules[prevLetter] || defaultOverlap;
  let minOverlap = rules.minOverlap;
  let maxOverlap = rules.maxOverlap;
  
  // Check for special case overlaps
  if (rules.specialCases && rules.specialCases[currentLetter]) {
    maxOverlap = rules.specialCases[currentLetter];
  }
  
  // Check if current letter is in the exceptions list for the previous letter
  const exceptions = overlapExceptions[prevLetter] || [];
  if (exceptions.includes(currentLetter)) {
    // Reduce overlap for exception pairs
    maxOverlap = Math.max(minOverlap, maxOverlap * 0.7);
  }
  
  const prevWidth = prev.bounds.right - prev.bounds.left;
  
  // Check for overlaps at decreasing amounts
  for (let overlap = maxOverlap; overlap >= minOverlap; overlap -= 0.005) {
    const offset = prevWidth * overlap;
    const startX = Math.floor(prev.bounds.right - offset);
    
    // Use a reduced resolution for collision detection to improve performance
    const step = 2; // Check every 2nd pixel instead of every pixel
    
    for (let x = Math.max(0, startX); x < prev.bounds.right; x += step) {
      const currentX = x - startX + current.bounds.left;
      if (currentX >= 0 && currentX < 200) {
        // Safe array access with bounds checking for noUncheckedIndexedAccess
        const prevRange = prev.verticalPixelRanges[x];
        const currentRange = current.verticalPixelRanges[currentX];
        
        // Ensure both ranges exist before processing
        if (prevRange && currentRange) {
          const rangeOverlap = Math.min(prevRange.bottom, currentRange.bottom) -
                              Math.max(prevRange.top, currentRange.top);
          if (rangeOverlap > 0 && prevRange.density > 0.1 && currentRange.density > 0.1) {
            return overlap;
          }
        }
      }
    }
  }
  
  return minOverlap;
}

// Helper function for rule-based overlap calculation (fallback when lookup table doesn't have a value)
function calculateRuleBasedOverlap(
  prev: ProcessedSvg,
  current: ProcessedSvg,
  overlapRules: Record<string, OverlapRule>,
  defaultOverlap: OverlapRule,
  overlapExceptions: Record<string, string[]>
): number {
  const prevLetter = /[a-zA-Z]/.test(prev.letter) ? prev.letter.toLowerCase() : prev.letter;
  const currentLetter = /[a-zA-Z]/.test(current.letter) ? current.letter.toLowerCase() : current.letter;
  
  const rules = overlapRules[prevLetter] || defaultOverlap;
  let maxOverlap = rules.maxOverlap;
  
  // Check for special case overlaps
  if (rules.specialCases && rules.specialCases[currentLetter]) {
    maxOverlap = rules.specialCases[currentLetter];
  }
  
  // Check if current letter is in the exceptions list for the previous letter
  const exceptions = overlapExceptions[prevLetter] || [];
  if (exceptions.includes(currentLetter)) {
    // Reduce overlap for exception pairs
    maxOverlap = Math.max(rules.minOverlap, maxOverlap * 0.7);
  }
  
  return maxOverlap;
}

// Process an SVG string into a ProcessedSvg object
export async function processSvg(
  svgText: string, 
  letter: string, 
  resolution: number = 200
): Promise<ProcessedSvg> {
  try {
    // Skip detailed logging for better performance
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(`Processing SVG for letter "${letter}"`);
      console.log('SVG content:', svgText);
    }
    
    if (!svgText.includes('<svg') || !svgText.includes('</svg>')) {
      console.error(`Invalid SVG content for letter "${letter}":`, svgText);
      throw new Error('Invalid SVG content');
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.warn(`SVG parsing error for letter "${letter}":`, {
        error: parserError.textContent,
        svgContent: svgText
      });
      throw new Error('SVG parsing error');
    }
    
    const svg = doc.querySelector('svg');
    if (!svg) {
      console.error(`No SVG element found for letter "${letter}":`, svgText);
      throw new Error('No SVG element found');
    }
    
    // Get or set viewBox
    let viewBox = svg.getAttribute('viewBox');
    if (!viewBox) {
      const width = parseFloat(svg.getAttribute('width') || '200');
      const height = parseFloat(svg.getAttribute('height') || '200');
      viewBox = `0 0 ${width} ${height}`;
      svg.setAttribute('viewBox', viewBox);
      console.log(`Set default viewBox for letter "${letter}": ${viewBox}`);
    }
    
    // Ensure width and height are set
    if (!svg.hasAttribute('width')) {
      svg.setAttribute('width', '200');
    }
    if (!svg.hasAttribute('height')) {
      svg.setAttribute('height', '200');
    }
    
    // Create a canvas for pixel analysis
    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, resolution, resolution);
    
    // Create an image from the SVG
    const img = new Image();
    const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    // Use a promise to handle the async image loading
    const imageLoadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          // Draw the image to the canvas
          ctx.drawImage(img, 0, 0, resolution, resolution);
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          // Always clean up the URL
          URL.revokeObjectURL(url);
        }
      };
      
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load SVG image: ${err}`));
      };
      
      // Set the source to start loading
      img.src = url;
    });
    
    // Wait for the image to load
    await imageLoadPromise;
    
    // Get the image data for analysis
    const imageData = ctx.getImageData(0, 0, resolution, resolution);
    const { data, width, height } = imageData;
    
    // Create a 2D array to store pixel data (true if pixel is not transparent)
    const pixelData: boolean[][] = Array(resolution).fill(null).map(() => Array(resolution).fill(false));
    
    // Find bounds of the SVG content
    let left = resolution;
    let right = 0;
    let top = resolution;
    let bottom = 0;
    
    // Use a sampling approach for large resolutions to improve performance
    const samplingStep = resolution > 100 ? 2 : 1;
    
    // Process the image data to find bounds and fill the pixel data array
    for (let y = 0; y < height; y += samplingStep) {
      for (let x = 0; x < width; x += samplingStep) {
        const i = (y * width + x) * 4;
        // Safe array access with bounds checking for noUncheckedIndexedAccess
        const alphaValue = data[i + 3];
        if (i + 3 < data.length && alphaValue !== undefined && alphaValue > 10) {
          // Ensure pixelData arrays exist before accessing
          const row = pixelData[y];
          if (row && x < row.length) {
            row[x] = true;
            
            // Update bounds
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      }
    }
    
    // If no non-transparent pixels were found, use default bounds
    if (left > right || top > bottom) {
      left = 0;
      top = 0;
      right = resolution - 1;
      bottom = resolution - 1;
    }
    
    // Calculate vertical pixel ranges for efficient overlap calculation
    const verticalPixelRanges: Array<{ top: number, bottom: number, density: number }> = Array(resolution).fill(null);
    
    for (let x = 0; x < resolution; x += samplingStep) {
      let rangeTop = -1;
      let rangeBottom = -1;
      let pixelCount = 0;
      
      // Find the top and bottom of the content at this x position
      for (let y = 0; y < resolution; y += samplingStep) {
        // Safe array access with bounds checking for noUncheckedIndexedAccess
        const row = pixelData[y];
        if (row && x < row.length && row[x]) {
          if (rangeTop === -1) rangeTop = y;
          rangeBottom = y;
          pixelCount++;
        }
      }
      
      // If we found content, store the range
      if (rangeTop !== -1) {
        const rangeHeight = rangeBottom - rangeTop + 1;
        const density = pixelCount / rangeHeight;
        
        // Store the range for this x position
        verticalPixelRanges[x] = { top: rangeTop, bottom: rangeBottom, density };
        
        // Fill in adjacent columns for sampling steps > 1
        if (samplingStep > 1) {
          for (let dx = 1; dx < samplingStep && x + dx < resolution; dx++) {
            verticalPixelRanges[x + dx] = { top: rangeTop, bottom: rangeBottom, density };
          }
        }
      } else {
        // Provide a default range for empty columns
        verticalPixelRanges[x] = { top: 0, bottom: resolution - 1, density: 0 };
      }
    }
    
    // Scale bounds to 200x200 (standard SVG size)
    const scaleFactor = 200 / resolution;
    const scaledBounds = {
      left: Math.floor(left * scaleFactor),
      right: Math.ceil(right * scaleFactor),
      top: Math.floor(top * scaleFactor),
      bottom: Math.ceil(bottom * scaleFactor)
    };
    
    // Return the processed SVG data
    const processedSvg = {
      svg: svg.outerHTML,
      width: 200,
      height: 200,
      bounds: scaledBounds,
      pixelData,
      verticalPixelRanges,
      scale: 1,
      letter,
      isSpace: false
    };
    
    return processedSvg;
  } catch (error) {
    console.error(`Error processing SVG for letter "${letter}":`, error);
    throw error;
  }
}