import { letterSvgs, firstLetterSvgs, lastLetterSvgs } from '../data/letterMappings';
import { svgMemoryCache, generateSvgCacheKey } from './svgCache';

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
  
  // Generate cache key for this URL
  const cacheKey = generateSvgCacheKey(url);
  
  // Try to get from memory cache first
  const cachedContent = svgMemoryCache.get(cacheKey);
  if (cachedContent) {
    console.log(`Cache hit for ${url}`);
    return cachedContent;
  }

  // Helper function to validate SVG content
  const validateSvgContent = (content: string): boolean => {
    const isValid = content.includes('<svg') && content.includes('</svg>');
    if (!isValid) {
      console.warn('Invalid SVG content:', content);
    }
    return isValid;
  };

  // Helper function to fetch SVG with given URL
  const fetchWithUrl = async (fetchUrl: string): Promise<string> => {
    console.log(`Attempting to fetch from: ${fetchUrl}`);
    const response = await fetch(fetchUrl, {
      headers: {
        'Accept': 'image/svg+xml',
        'Cache-Control': 'max-age=3600'
      }
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    console.log(`Response content-type: ${contentType}`);

    const svgText = await response.text();
    console.log(`Received SVG content (first 100 chars): ${svgText.substring(0, 100)}...`);
    
    if (!validateSvgContent(svgText)) {
      throw new Error('Invalid SVG content in response');
    }

    return svgText;
  };

  try {
    // First try with the original URL
    const svgText = await fetchWithUrl(url);
    svgMemoryCache.set(cacheKey, svgText);
    return svgText;
  } catch (error) {
    console.error(`Failed to fetch SVG from ${url}:`, error);
    
    // If the URL starts with a slash, try without it
    if (url.startsWith('/')) {
      try {
        const relativeUrl = url.substring(1);
        console.log(`Trying relative URL: ${relativeUrl}`);
        const svgText = await fetchWithUrl(relativeUrl);
        svgMemoryCache.set(cacheKey, svgText);
        return svgText;
      } catch (relativeError) {
        console.error(`Failed to fetch SVG with relative path ${url}:`, relativeError);
      }
    }
    
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