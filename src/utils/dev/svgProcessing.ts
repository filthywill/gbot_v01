import { ProcessedSvg } from '../../types';

// Development-only processSvg function
export async function processSvg(
  svgText: string, 
  letter: string, 
  rotation: number = 0,
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
    
    // Apply rotation if needed
    if (rotation !== 0) {
      // Find or create a group to apply rotation
      let g = svg.querySelector('g');
      if (!g) {
        g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        // Move all children to the group
        while (svg.firstChild) {
          if (svg.firstChild.nodeType === Node.ELEMENT_NODE && 
              (svg.firstChild as Element).tagName.toLowerCase() !== 'defs') {
            g.appendChild(svg.firstChild);
          } else {
            // Skip non-element nodes or defs
            svg.removeChild(svg.firstChild);
          }
        }
        svg.appendChild(g);
      }
      
      // Apply rotation transform
      const transform = g.getAttribute('transform') || '';
      g.setAttribute('transform', `${transform} rotate(${rotation}, 100, 100)`);
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
        // Check if pixel is not fully transparent
        if (data[i + 3] > 10) {
          pixelData[y][x] = true;
          
          // Update bounds
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
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
        if (pixelData[y][x]) {
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
      rotation,
      isSpace: false
    };
    
    return processedSvg;
  } catch (error) {
    console.error(`Error processing SVG for letter "${letter}":`, error);
    throw error;
  }
}

// Development-only helper to test if processSvg is available
export const isProcessSvgAvailable = (): boolean => {
  return typeof processSvg === 'function';
};

// Export conditional processSvg function based on environment
export const conditionalProcessSvg = import.meta.env.DEV ? 
  processSvg : 
  () => { throw new Error('processSvg not available in production'); }; 