// Generated SVG Lookup Tables
// This directory contains auto-generated lookup tables for SVG processing optimization

// Export types for lookup tables
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

// Lookup registry - will be populated as lookup tables are generated
const LOOKUP_REGISTRY: Record<string, StyleLookupData> = {};

// Register a lookup table
export const registerLookupTable = (styleId: string, lookupData: StyleLookupData): void => {
  LOOKUP_REGISTRY[styleId] = lookupData;
  console.log(`📚 Registered lookup table for style: ${styleId}`);
};

// Get lookup table for a style
export const getLookupTable = (styleId: string): StyleLookupData | null => {
  return LOOKUP_REGISTRY[styleId] || null;
};

// Production lookup function - fast SVG retrieval
export const getProcessedSvgFromLookup = (
  letter: string,
  style: string = 'straight',
  variant: 'standard' | 'alternate' | 'first' | 'last' = 'standard'
): ProcessedSvgData | null => {
  const lookupTable = getLookupTable(style);
  if (!lookupTable) {
    console.warn(`No lookup table found for style: ${style}`);
    return null;
  }

  const letterVariants = lookupTable.letters[letter];
  return letterVariants?.find(v => v.variant === variant) || letterVariants?.[0] || null;
};

// Get overlap value from lookup table
export const getOverlapFromLookup = (
  firstLetter: string,
  secondLetter: string,
  style: string = 'straight',
  fallback: number = 0.12
): number => {
  const lookupTable = getLookupTable(style);
  if (!lookupTable) {
    return fallback;
  }

  return lookupTable.overlapRules[firstLetter]?.[secondLetter] ?? fallback;
};

// Get rotation value from lookup table
export const getRotationFromLookup = (
  letter: string,
  previousLetter: string,
  style: string = 'straight',
  fallback: number = 0
): number => {
  const lookupTable = getLookupTable(style);
  if (!lookupTable) {
    return fallback;
  }

  return lookupTable.rotationRules[letter]?.[previousLetter] ?? fallback;
};

// Utility to check if lookup table is available
export const isLookupTableAvailable = (style: string): boolean => {
  return getLookupTable(style) !== null;
};

// Get all available lookup tables
export const getAvailableLookupTables = (): string[] => {
  return Object.keys(LOOKUP_REGISTRY);
};

// Development-only: Clear all lookup tables
export const clearLookupRegistry = (): void => {
  Object.keys(LOOKUP_REGISTRY).forEach(key => {
    delete LOOKUP_REGISTRY[key];
  });
  console.log('🧹 Cleared lookup registry');
};

// Import and register lookup tables dynamically
// This will be populated as lookup tables are generated

// Import our generated lookup table for 'straight' style
import { SVG_LOOKUP_STRAIGHT } from './svg-lookup-straight';

// Register the lookup table on module load
registerLookupTable('straight', SVG_LOOKUP_STRAIGHT);

// Example:
// import { SVG_LOOKUP_STRAIGHT } from './svg-lookup-straight';
// registerLookupTable('straight', SVG_LOOKUP_STRAIGHT);

export default {
  registerLookupTable,
  getLookupTable,
  getProcessedSvgFromLookup,
  getOverlapFromLookup,
  getRotationFromLookup,
  isLookupTableAvailable,
  getAvailableLookupTables,
  clearLookupRegistry
}; 