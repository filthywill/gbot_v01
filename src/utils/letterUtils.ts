import { letterSvgs, firstLetterSvgs, lastLetterSvgs } from '../data/letterMappings';
import { LETTER_ROTATION_RULES } from '../data/letterRules';

// Check if a specific SVG file exists
export function svgExists(path: string): boolean {
  // This is a simple check to see if the path is defined in our mappings
  return !!path;
}

// Get the appropriate SVG for a letter based on position and style
export async function getLetterSvg(
  letter: string,
  isAlternate: boolean,
  isFirst: boolean,
  isLast: boolean,
  style: string
): Promise<string> {
  let svgPath: string | undefined;
  
  // Normalize letter to lowercase
  const normalizedLetter = letter.toLowerCase();
  
  console.log(`Getting SVG for letter '${normalizedLetter}', isFirst=${isFirst}, isLast=${isLast}, style=${style}`);
  
  // Check for first letter variant
  if (style !== 'straight' && isFirst && firstLetterSvgs[normalizedLetter]) {
    svgPath = firstLetterSvgs[normalizedLetter];
    console.log(`Using first letter variant: ${svgPath}`);
  }
  // Check for last letter variant
  else if (style !== 'straight' && isLast && lastLetterSvgs[normalizedLetter]) {
    svgPath = lastLetterSvgs[normalizedLetter];
    console.log(`Using last letter variant: ${svgPath}`);
  }
  // Check for alternate version (only if it exists)
  else if (isAlternate) {
    const alternateKey = `${normalizedLetter}2`;
    if (letterSvgs[alternateKey]) {
      svgPath = letterSvgs[alternateKey];
      console.log(`Using alternate variant: ${svgPath}`);
    }
  }
  
  // If no special variant was found or applicable, use the standard version
  if (!svgPath) {
    svgPath = letterSvgs[normalizedLetter];
    console.log(`Using standard variant: ${svgPath}`);
  }
  
  // If we still don't have a path, this is a truly missing letter
  if (!svgPath) {
    console.error(`No SVG found for letter '${normalizedLetter}'`);
    throw new Error(`No SVG found for letter '${normalizedLetter}'`);
  }
  
  // Ensure the path starts with a slash
  if (!svgPath.startsWith('/')) {
    svgPath = '/' + svgPath;
  }
  
  // For development environments, use the relative path
  // This works better with Vite's dev server
  return svgPath;
}

// Fetch and parse an SVG from a URL
export async function fetchSvg(url: string): Promise<string> {
  console.log(`Fetching SVG from URL: ${url}`);
  
  try {
    // Create an XMLHttpRequest for better browser compatibility
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); // Synchronous request
    xhr.send();
    
    if (xhr.status === 200) {
      const svgText = xhr.responseText;
      
      // Validate that the response is actually SVG content
      if (!svgText.includes('<svg') || !svgText.includes('</svg>')) {
        throw new Error('Invalid SVG content in response');
      }
      
      return svgText;
    } else {
      throw new Error(`HTTP error! status: ${xhr.status}`);
    }
  } catch (error) {
    console.error(`Failed to fetch SVG from ${url}:`, error);
    throw error;
  }
}

// Determine if a letter should use an alternate version
export function shouldUseAlternate(letter: string, index: number, letters: string[]): boolean {
  // Only suggest alternate if we know it exists
  const alternateExists = !!letterSvgs[`${letter}2`];
  
  if (!alternateExists) {
    return false;
  }
  
  // Since we've removed l2, always return false for 'l'
  if (letter === 'l') {
    return false;
  }
  
  // For other letters with alternates (if any are added in the future)
  return false;
}

// Get letter-specific rotation
export function getLetterRotation(letter: string, prevLetter: string | null): number {
  if (!prevLetter) return 0;
  
  const rules = LETTER_ROTATION_RULES[prevLetter.toLowerCase()];
  return rules && rules[letter.toLowerCase()] ? rules[letter.toLowerCase()] : 0;
}