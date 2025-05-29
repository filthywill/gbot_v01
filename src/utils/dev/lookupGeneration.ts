import { ProcessedSvg } from '../../types';
import { processSvg } from './svgProcessing';
import { validateProcessedSvg, ValidationSummary, createValidationSummary } from './svgValidation';
import { getLetterSvg } from '../letterUtils';

// Interfaces for lookup generation
export interface LookupGenerationOptions {
  style: string;
  variants: ('standard' | 'alternate' | 'first' | 'last')[];
  includeMetadata: boolean;
  optimizeContent: boolean;
  resolution: number;
  validationLevel: 'strict' | 'normal' | 'minimal';
}

export interface ProcessedSvgData {
  letter: string;
  style: string;
  variant: 'standard' | 'alternate' | 'first' | 'last';
  bounds: { left: number; right: number; top: number; bottom: number };
  width: number;
  height: number;
  viewBox: string;
  svgContent: string;
  metadata: {
    hasContent: boolean;
    isSymmetric: boolean;
    processingTime: number;
    fileSize: number;
    optimized: boolean;
  };
}

export interface StyleLookupData {
  styleId: string;
  letters: Record<string, ProcessedSvgData[]>; // Multiple variants per letter
  overlapRules: Record<string, Record<string, number>>;
  rotationRules: Record<string, Record<string, number>>;
  metadata: {
    generatedAt: string;
    totalLetters: number;
    totalVariants: number;
    averageProcessingTime: number;
    validationSummary: ValidationSummary;
    checksum: string;
  };
}

export interface LookupTableExport {
  version: string;
  styles: Record<string, StyleLookupData>;
  metadata: {
    generatedAt: string;
    generatedBy: string;
    totalStyles: number;
    totalLetters: number;
    fileSize: number;
  };
}

/**
 * Generate lookup table for a specific style
 */
export const generateLookupTable = async (
  options: LookupGenerationOptions,
  progressCallback?: (progress: number, letter: string) => void
): Promise<StyleLookupData> => {
  const { style, variants, includeMetadata, optimizeContent, resolution, validationLevel } = options;
  
  // Define letters to process
  const letters = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const lookupData: StyleLookupData = {
    styleId: style,
    letters: {},
    overlapRules: {},
    rotationRules: {},
    metadata: {
      generatedAt: new Date().toISOString(),
      totalLetters: 0,
      totalVariants: 0,
      averageProcessingTime: 0,
      validationSummary: {
        totalProcessed: 0,
        validLetters: 0,
        invalidLetters: [],
        warnings: [],
        optimizationSuggestions: [],
        averageFileSize: 0,
        totalFileSize: 0
      },
      checksum: ''
    }
  };

  const processingResults: Array<{ letter: string; validation: any }> = [];
  let totalProcessingTime = 0;
  let processedCount = 0;

  // Process each letter
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    progressCallback?.(i / letters.length * 100, letter);

    try {
      const letterVariants: ProcessedSvgData[] = [];

      // Process each variant for this letter
      for (const variant of variants) {
        const startTime = performance.now();

        // Get SVG content
        const svgContentOrUrl = await getLetterSvg(letter, false, false, false, style);
        if (!svgContentOrUrl) {
          throw new Error(`No SVG content found for letter "${letter}"`);
        }

        // Handle URL vs content
        let svgContent = svgContentOrUrl;
        if (svgContentOrUrl.startsWith('/') || svgContentOrUrl.startsWith('http')) {
          const response = await fetch(svgContentOrUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.statusText}`);
          }
          svgContent = await response.text();
        }

        // Process SVG
        const processed = await processSvg(svgContent, letter, 0, resolution);
        const processingTime = performance.now() - startTime;

        // Validate
        const validation = validateProcessedSvg(processed, letter);
        processingResults.push({ letter, validation });

        if (validation.isValid || validationLevel !== 'strict') {
          // Optimize SVG content if requested
          let optimizedContent = processed.svg;
          let isOptimized = false;
          
          if (optimizeContent) {
            optimizedContent = optimizeSvgContent(processed.svg);
            isOptimized = true;
          }

          const svgData: ProcessedSvgData = {
            letter,
            style,
            variant,
            bounds: processed.bounds,
            width: processed.width,
            height: processed.height,
            viewBox: `0 0 ${processed.width} ${processed.height}`,
            svgContent: optimizedContent,
            metadata: {
              hasContent: validation.metadata.hasContent,
              isSymmetric: detectSymmetry(processed),
              processingTime,
              fileSize: new Blob([optimizedContent]).size,
              optimized: isOptimized
            }
          };

          letterVariants.push(svgData);
          totalProcessingTime += processingTime;
          processedCount++;
        }
      }

      if (letterVariants.length > 0) {
        lookupData.letters[letter] = letterVariants;
        lookupData.metadata.totalLetters++;
        lookupData.metadata.totalVariants += letterVariants.length;
      }

    } catch (error) {
      console.error(`Failed to process letter "${letter}":`, error);
      
      if (validationLevel === 'strict') {
        throw error;
      }
    }
  }

  // Calculate metadata
  lookupData.metadata.averageProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;
  lookupData.metadata.validationSummary = createValidationSummary(processingResults);
  lookupData.metadata.checksum = generateChecksum(lookupData);

  // Import existing overlap and rotation rules
  try {
    const overlapModule = await import('../../data/generatedOverlapLookup');
    if (overlapModule.COMPLETE_OVERLAP_LOOKUP) {
      lookupData.overlapRules = overlapModule.COMPLETE_OVERLAP_LOOKUP;
    }
  } catch (error) {
    console.warn('Could not import existing overlap rules:', error);
  }

  progressCallback?.(100, 'Complete');
  return lookupData;
};

/**
 * Export lookup table to TypeScript file
 */
export const exportLookupToFile = (data: StyleLookupData, filename: string): string => {
  const content = `// Auto-generated SVG lookup table
// Generated at: ${data.metadata.generatedAt}
// Style: ${data.styleId}
// Letters: ${data.metadata.totalLetters}
// Variants: ${data.metadata.totalVariants}

export interface ProcessedSvgData {
  letter: string;
  style: string;
  variant: 'standard' | 'alternate' | 'first' | 'last';
  bounds: { left: number; right: number; top: number; bottom: number };
  width: number;
  height: number;
  viewBox: string;
  svgContent: string;
  metadata: {
    hasContent: boolean;
    isSymmetric: boolean;
    processingTime: number;
    fileSize: number;
    optimized: boolean;
  };
}

export interface StyleLookupData {
  styleId: string;
  letters: Record<string, ProcessedSvgData[]>;
  overlapRules: Record<string, Record<string, number>>;
  rotationRules: Record<string, Record<string, number>>;
  metadata: {
    generatedAt: string;
    totalLetters: number;
    totalVariants: number;
    averageProcessingTime: number;
    validationSummary: any;
    checksum: string;
  };
}

export const SVG_LOOKUP_${data.styleId.toUpperCase()}: StyleLookupData = ${JSON.stringify(data, null, 2)};

// Fast lookup function
export const getProcessedSvg = (
  letter: string,
  variant: 'standard' | 'alternate' | 'first' | 'last' = 'standard'
): ProcessedSvgData | null => {
  const letterVariants = SVG_LOOKUP_${data.styleId.toUpperCase()}.letters[letter];
  return letterVariants?.find(v => v.variant === variant) || letterVariants?.[0] || null;
};

// Get overlap value between two letters
export const getOverlapValue = (
  firstLetter: string,
  secondLetter: string,
  fallback: number = 0.12
): number => {
  return SVG_LOOKUP_${data.styleId.toUpperCase()}.overlapRules[firstLetter]?.[secondLetter] ?? fallback;
};

// Get rotation value for a letter
export const getRotationValue = (
  letter: string,
  previousLetter: string,
  fallback: number = 0
): number => {
  return SVG_LOOKUP_${data.styleId.toUpperCase()}.rotationRules[letter]?.[previousLetter] ?? fallback;
};

export default SVG_LOOKUP_${data.styleId.toUpperCase()};
`;

  return content;
};

/**
 * Create metadata file
 */
export const createMetadataFile = (lookupData: StyleLookupData): string => {
  const metadata = {
    generatedAt: lookupData.metadata.generatedAt,
    styleId: lookupData.styleId,
    totalLetters: lookupData.metadata.totalLetters,
    totalVariants: lookupData.metadata.totalVariants,
    averageProcessingTime: lookupData.metadata.averageProcessingTime,
    checksum: lookupData.metadata.checksum,
    validationSummary: lookupData.metadata.validationSummary
  };

  return `// SVG Lookup Metadata
// Generated at: ${lookupData.metadata.generatedAt}

export interface LookupMetadata {
  generatedAt: string;
  styleId: string;
  totalLetters: number;
  totalVariants: number;
  averageProcessingTime: number;
  checksum: string;
  validationSummary: {
    totalProcessed: number;
    validLetters: number;
    invalidLetters: string[];
    warnings: Array<{ letter: string; warning: string }>;
    optimizationSuggestions: string[];
    averageFileSize: number;
    totalFileSize: number;
  };
}

export const LOOKUP_METADATA_${lookupData.styleId.toUpperCase()}: LookupMetadata = ${JSON.stringify(metadata, null, 2)};

// Validation function
export const validateLookupTable = (checksum: string): boolean => {
  return checksum === LOOKUP_METADATA_${lookupData.styleId.toUpperCase()}.checksum;
};

export default LOOKUP_METADATA_${lookupData.styleId.toUpperCase()};
`;
};

/**
 * Simple SVG content optimization
 */
const optimizeSvgContent = (svgContent: string): string => {
  // Basic optimizations:
  // 1. Remove unnecessary whitespace
  // 2. Remove comments
  // 3. Minimize attribute values
  
  return svgContent
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .trim();
};

/**
 * Detect if a processed SVG is symmetric
 */
const detectSymmetry = (processed: ProcessedSvg): boolean => {
  // Simple symmetry detection based on bounds
  const { left, right } = processed.bounds;
  const center = (left + right) / 2;
  const leftWidth = center - left;
  const rightWidth = right - center;
  
  // Consider symmetric if width difference is less than 10%
  const widthDifference = Math.abs(leftWidth - rightWidth);
  const averageWidth = (leftWidth + rightWidth) / 2;
  
  return averageWidth > 0 && (widthDifference / averageWidth) < 0.1;
};

/**
 * Generate checksum for lookup data integrity
 */
const generateChecksum = (data: StyleLookupData): string => {
  // Simple checksum based on letter count and content length
  const letterCount = Object.keys(data.letters).length;
  const totalContentLength = Object.values(data.letters)
    .flat()
    .reduce((sum, item) => sum + item.svgContent.length, 0);
  
  return `${data.styleId}-${letterCount}-${totalContentLength}-${Date.now()}`;
};

/**
 * Default generation options
 */
export const DEFAULT_GENERATION_OPTIONS: LookupGenerationOptions = {
  style: 'straight',
  variants: ['standard'],
  includeMetadata: true,
  optimizeContent: true,
  resolution: 200,
  validationLevel: 'normal'
};

// File saving utilities with user-chosen location
export const saveFileWithPicker = async (
  content: string,
  defaultFilename: string,
  fileType: 'typescript' | 'json' = 'typescript'
): Promise<boolean> => {
  try {
    // Check if File System Access API is supported
    if ('showSaveFilePicker' in window) {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: defaultFilename,
        types: [
          {
            description: fileType === 'typescript' ? 'TypeScript files' : 'JSON files',
            accept: {
              [fileType === 'typescript' ? 'text/typescript' : 'application/json']: 
                [fileType === 'typescript' ? '.ts' : '.json']
            }
          }
        ]
      });

      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      console.log(`✅ File saved successfully to user-chosen location`);
      return true;
    } else {
      // Fallback to regular download
      return downloadFile(content, defaultFilename);
    }
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      console.log('📂 User cancelled file save');
      return false;
    }
    console.error('💥 Error saving file:', error);
    // Fallback to regular download on error
    return downloadFile(content, defaultFilename);
  }
};

export const downloadFile = (content: string, filename: string): boolean => {
  try {
    const blob = new Blob([content], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`📥 File downloaded: ${filename}`);
    return true;
  } catch (error) {
    console.error('💥 Error downloading file:', error);
    return false;
  }
};

export const saveMultipleFilesWithPicker = async (
  files: Array<{ content: string; filename: string; type?: 'typescript' | 'json' }>
): Promise<{ saved: number; failed: number }> => {
  let saved = 0;
  let failed = 0;

  for (const file of files) {
    const success = await saveFileWithPicker(
      file.content, 
      file.filename, 
      file.type || 'typescript'
    );
    
    if (success) {
      saved++;
    } else {
      failed++;
    }
    
    // Small delay between saves to prevent overwhelming the user
    if (files.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { saved, failed };
}; 