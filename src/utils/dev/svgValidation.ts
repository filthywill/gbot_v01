import { ProcessedSvg } from '../../types';

export interface SVGBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    hasContent: boolean;
    bounds: SVGBounds;
    optimizable: boolean;
    fileSize: number;
    elementCount: number;
  };
}

export interface ValidationSummary {
  totalProcessed: number;
  validLetters: number;
  invalidLetters: string[];
  warnings: Array<{ letter: string; warning: string }>;
  optimizationSuggestions: string[];
  averageFileSize: number;
  totalFileSize: number;
}

/**
 * Validates SVG content for basic structure and integrity
 */
export const validateSvgContent = (svgContent: string, letter?: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const context = letter ? `letter "${letter}"` : 'SVG';
  
  // Basic structure validation
  if (!svgContent || typeof svgContent !== 'string') {
    errors.push(`Invalid SVG content for ${context}: content is empty or not a string`);
    return {
      isValid: false,
      errors,
      warnings,
      metadata: {
        hasContent: false,
        bounds: { left: 0, right: 0, top: 0, bottom: 0 },
        optimizable: false,
        fileSize: 0,
        elementCount: 0
      }
    };
  }
  
  // Check for SVG tags
  if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
    errors.push(`Invalid SVG structure for ${context}: missing SVG tags`);
  }
  
  // Parse SVG to check for structure
  let doc: Document;
  let svg: SVGSVGElement | null = null;
  
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      errors.push(`SVG parsing error for ${context}: ${parserError.textContent}`);
    }
    
    svg = doc.querySelector('svg');
    if (!svg) {
      errors.push(`No SVG element found for ${context}`);
    }
  } catch (error) {
    errors.push(`Failed to parse SVG for ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Calculate metadata
  const fileSize = new Blob([svgContent]).size;
  let elementCount = 0;
  let hasContent = false;
  let bounds: SVGBounds = { left: 0, right: 0, top: 0, bottom: 0 };
  let optimizable = false;
  
  if (svg) {
    // Count elements
    elementCount = svg.querySelectorAll('*').length;
    
    // Check for content (paths, shapes, text, etc.)
    const contentElements = svg.querySelectorAll('path, circle, rect, ellipse, line, polyline, polygon, text');
    hasContent = contentElements.length > 0;
    
    if (!hasContent) {
      warnings.push(`SVG for ${context} appears to have no visible content`);
    }
    
    // Check viewBox and dimensions
    const viewBox = svg.getAttribute('viewBox');
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');
    
    if (!viewBox) {
      warnings.push(`SVG for ${context} missing viewBox attribute`);
    }
    
    if (!width || !height) {
      warnings.push(`SVG for ${context} missing width or height attributes`);
    }
    
    // Parse bounds from viewBox if available
    if (viewBox) {
      const [x, y, w, h] = viewBox.split(' ').map(Number);
      if (!isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h)) {
        bounds = { left: x, top: y, right: x + w, bottom: y + h };
      }
    }
    
    // Check for optimization opportunities
    optimizable = checkOptimizationOpportunities(svg, warnings, context);
  }
  
  // File size warnings
  if (fileSize > 50000) { // 50KB
    warnings.push(`Large file size for ${context}: ${(fileSize / 1024).toFixed(1)}KB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      hasContent,
      bounds,
      optimizable,
      fileSize,
      elementCount
    }
  };
};

/**
 * Validates processed SVG data for consistency and correctness
 */
export const validateProcessedSvg = (processed: ProcessedSvg, expectedLetter?: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const context = expectedLetter ? `letter "${expectedLetter}"` : `letter "${processed.letter}"`;
  
  // Basic structure validation
  if (!processed || typeof processed !== 'object') {
    errors.push(`Invalid processed SVG for ${context}: not an object`);
    return {
      isValid: false,
      errors,
      warnings,
      metadata: {
        hasContent: false,
        bounds: { left: 0, right: 0, top: 0, bottom: 0 },
        optimizable: false,
        fileSize: 0,
        elementCount: 0
      }
    };
  }
  
  // Required properties validation
  const requiredProps = ['svg', 'width', 'height', 'bounds', 'pixelData', 'verticalPixelRanges', 'letter'];
  for (const prop of requiredProps) {
    if (!(prop in processed)) {
      errors.push(`Missing required property "${prop}" for ${context}`);
    }
  }
  
  // Letter consistency check
  if (expectedLetter && processed.letter !== expectedLetter) {
    errors.push(`Letter mismatch for ${context}: expected "${expectedLetter}", got "${processed.letter}"`);
  }
  
  // Bounds validation
  if (processed.bounds) {
    const { left, right, top, bottom } = processed.bounds;
    
    if (left > right) {
      errors.push(`Invalid bounds for ${context}: left (${left}) > right (${right})`);
    }
    
    if (top > bottom) {
      errors.push(`Invalid bounds for ${context}: top (${top}) > bottom (${bottom})`);
    }
    
    if (left < 0 || top < 0 || right > 200 || bottom > 200) {
      warnings.push(`Bounds for ${context} extend outside standard 200x200 area: ${JSON.stringify(processed.bounds)}`);
    }
    
    // Check for extremely small or large bounds
    const width = right - left;
    const height = bottom - top;
    
    if (width < 5 || height < 5) {
      warnings.push(`Very small content detected for ${context}: ${width}x${height}`);
    }
    
    if (width > 190 || height > 190) {
      warnings.push(`Very large content detected for ${context}: ${width}x${height}`);
    }
  }
  
  // Pixel data validation
  if (Array.isArray(processed.pixelData)) {
    const expectedRows = 200; // Standard resolution
    if (processed.pixelData.length !== expectedRows) {
      warnings.push(`Unexpected pixel data rows for ${context}: ${processed.pixelData.length} (expected ${expectedRows})`);
    }
    
    // Check if pixel data has any content
    const hasPixelData = processed.pixelData.some(row => 
      Array.isArray(row) && row.some(pixel => pixel === true)
    );
    
    if (!hasPixelData && !processed.isSpace) {
      warnings.push(`No pixel data found for ${context} (not a space character)`);
    }
  }
  
  // SVG content validation
  const svgValidation = validateSvgContent(processed.svg, processed.letter);
  errors.push(...svgValidation.errors);
  warnings.push(...svgValidation.warnings);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata: svgValidation.metadata
  };
};

/**
 * Creates a validation summary from multiple validation results
 */
export const createValidationSummary = (
  results: Array<{ letter: string; validation: ValidationResult }>
): ValidationSummary => {
  const totalProcessed = results.length;
  const validLetters = results.filter(r => r.validation.isValid).length;
  const invalidLetters = results.filter(r => !r.validation.isValid).map(r => r.letter);
  
  const warnings: Array<{ letter: string; warning: string }> = [];
  const optimizationSuggestions: string[] = [];
  let totalFileSize = 0;
  
  for (const { letter, validation } of results) {
    // Collect warnings
    for (const warning of validation.warnings) {
      warnings.push({ letter, warning });
    }
    
    // Collect optimization suggestions
    if (validation.metadata.optimizable) {
      optimizationSuggestions.push(`Letter "${letter}" can be optimized`);
    }
    
    // Add to total file size
    totalFileSize += validation.metadata.fileSize;
  }
  
  const averageFileSize = totalProcessed > 0 ? totalFileSize / totalProcessed : 0;
  
  return {
    totalProcessed,
    validLetters,
    invalidLetters,
    warnings,
    optimizationSuggestions,
    averageFileSize,
    totalFileSize
  };
};

/**
 * Helper function to check for optimization opportunities in SVG
 */
function checkOptimizationOpportunities(svg: SVGSVGElement, warnings: string[], context: string): boolean {
  let optimizable = false;
  
  // Check for unnecessary attributes
  const unnecessaryAttrs = ['id', 'class', 'style'];
  for (const attr of unnecessaryAttrs) {
    if (svg.hasAttribute(attr)) {
      warnings.push(`SVG for ${context} has unnecessary "${attr}" attribute`);
      optimizable = true;
    }
  }
  
  // Check for comments
  const walker = document.createTreeWalker(
    svg,
    NodeFilter.SHOW_COMMENT,
    null
  );
  
  if (walker.nextNode()) {
    warnings.push(`SVG for ${context} contains comments that could be removed`);
    optimizable = true;
  }
  
  // Check for empty groups
  const emptyGroups = svg.querySelectorAll('g:empty');
  if (emptyGroups.length > 0) {
    warnings.push(`SVG for ${context} contains ${emptyGroups.length} empty group(s)`);
    optimizable = true;
  }
  
  // Check for unused defs
  const defs = svg.querySelectorAll('defs');
  if (defs.length > 0) {
    warnings.push(`SVG for ${context} contains defs that may not be needed`);
    optimizable = true;
  }
  
  return optimizable;
}

/**
 * Detects if an SVG shape is symmetric (useful for optimization)
 */
export const detectSymmetry = (processed: ProcessedSvg): boolean => {
  if (!processed.pixelData || processed.isSpace) {
    return false;
  }
  
  const { pixelData, bounds } = processed;
  const centerX = Math.floor((bounds.left + bounds.right) / 2);
  
  // Check horizontal symmetry
  for (let y = bounds.top; y <= bounds.bottom; y++) {
    for (let x = bounds.left; x <= centerX; x++) {
      const mirrorX = bounds.right - (x - bounds.left);
      
      if (mirrorX < pixelData[0].length && 
          pixelData[y] && 
          pixelData[y][x] !== pixelData[y][mirrorX]) {
        return false;
      }
    }
  }
  
  return true;
}; 