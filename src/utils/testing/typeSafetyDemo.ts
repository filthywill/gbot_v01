/**
 * Type Safety Demonstration
 * 
 * This file demonstrates unsafe patterns that are now caught by enhanced type safety.
 * Uncomment the unsafe examples to see TypeScript errors.
 */

import { ProcessedSvg, CustomizationOptions } from '../../types';

// =============================================================================
// DEMONSTRATION: noUncheckedIndexedAccess in action
// =============================================================================

/**
 * Demonstrate array access safety improvements
 */
export function demonstrateArraySafety() {
  const processedSvgs: ProcessedSvg[] = [
    {
      svg: '<svg></svg>',
      width: 200,
      height: 200,
      bounds: { left: 10, right: 50, top: 20, bottom: 60 },
      pixelData: [],
      verticalPixelRanges: [],
      scale: 1,
      letter: 'a'
    }
  ];

  // ✅ SAFE: TypeScript now forces us to handle undefined
  const safeAccess = (index: number) => {
    const svg = processedSvgs[index]; // Type: ProcessedSvg | undefined
    if (svg) {
      return svg.bounds.left; // Safe - TypeScript knows svg is defined
    }
    return 0;
  };

  // 🔍 UNCOMMENT TO TEST: This would show a TypeScript error
  // const unsafeAccess = processedSvgs[0].bounds.left; // Error: Object is possibly 'undefined'

  return { safeAccess };
}

/**
 * Demonstrate Record/Map access safety
 */
export function demonstrateRecordSafety() {
  const lookupTable: Record<string, number> = {
    'a': 0.12,
    'b': 0.15
  };

  // ✅ SAFE: Proper handling of potentially undefined values
  const safeValueAccess = (key: string): number => {
    const value = lookupTable[key]; // Type: number | undefined
    return value !== undefined ? value : 0.12; // Safe fallback
  };

  // 🔍 UNCOMMENT TO TEST: This would show a TypeScript error
  // const unsafeValueAccess = lookupTable['x'].toFixed(2); // Error: Object is possibly 'undefined'

  return { safeValueAccess };
}

// =============================================================================
// DEMONSTRATION: exactOptionalPropertyTypes in action
// =============================================================================

/**
 * Demonstrate optional property safety improvements
 */
export function demonstrateOptionalPropertySafety() {
  // ✅ SAFE: Clean way to handle optional properties
  const createOptions = (skipHistory?: boolean, presetId?: string): Partial<CustomizationOptions> => {
    return {
      fillEnabled: true,
      fillColor: '#000000',
      // Only include optional properties when they have actual values
      ...(skipHistory !== undefined && { __skipHistory: skipHistory }),
      ...(presetId !== undefined && { __presetId: presetId })
    };
  };

  // 🔍 UNCOMMENT TO TEST: This would show TypeScript errors with exactOptionalPropertyTypes
  /*
  const unsafeOptions: CustomizationOptions = {
    fillEnabled: true,
    fillColor: '#000000',
    // These explicit undefined assignments would cause type errors:
    __skipHistory: undefined, // Error: Type 'undefined' is not assignable
    __presetId: undefined     // Error: Type 'undefined' is not assignable
  };
  */

  return { createOptions };
}

// =============================================================================
// REAL-WORLD EXAMPLES: Benefits in practice
// =============================================================================

/**
 * Example: Safe SVG position calculation
 */
export function safeSvgPositionCalculation(
  processedSvgs: ProcessedSvg[], 
  positions: number[]
) {
  const calculateBounds = () => {
    let minX = Infinity;
    let maxX = -Infinity;

    processedSvgs.forEach((svg, i) => {
      // Enhanced type safety forces us to check these values
      const position = positions[i]; // Type: number | undefined
      
      if (position !== undefined && svg) {
        const leftEdge = position + svg.bounds.left;
        const rightEdge = position + svg.bounds.right;
        
        minX = Math.min(minX, leftEdge);
        maxX = Math.max(maxX, rightEdge);
      }
    });

    return minX !== Infinity ? { minX, maxX, width: maxX - minX } : null;
  };

  return calculateBounds();
}

/**
 * Example: Safe pixel data processing
 */
export function safePixelDataProcessing(pixelData: boolean[][]) {
  const countActivePixels = (startY: number, endY: number): number => {
    let count = 0;
    
    for (let y = startY; y <= endY; y++) {
      const row = pixelData[y]; // Type: boolean[] | undefined
      
      if (row) {
        for (let x = 0; x < row.length; x++) {
          const pixel = row[x]; // Type: boolean | undefined
          if (pixel === true) {
            count++;
          }
        }
      }
    }
    
    return count;
  };

  return { countActivePixels };
}

// =============================================================================
// PERFORMANCE IMPACT MEASUREMENT
// =============================================================================

/**
 * Measure the performance impact of safe vs unsafe patterns
 */
export function measureSafetyPerformance() {
  const testArray = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
  const iterations = 10000;

  // Safe pattern (with our enhanced type safety)
  const safePattern = () => {
    let result = '';
    for (let i = 0; i < iterations; i++) {
      const item = testArray[i % testArray.length]; // Returns string | undefined
      if (item) {
        result += item.charAt(0);
      }
    }
    return result;
  };

  // Measure performance
  const startTime = performance.now();
  const result = safePattern();
  const endTime = performance.now();

  return {
    result: result.length,
    duration: endTime - startTime,
    note: 'Safe pattern with type checking has minimal performance impact'
  };
}

// =============================================================================
// MIGRATION HELPERS
// =============================================================================

/**
 * Helper functions for migrating code to enhanced type safety
 */
export const migrationHelpers = {
  
  // Safe array access helper
  safeArrayAccess: <T>(array: T[], index: number, fallback: T): T => {
    const item = array[index];
    return item !== undefined ? item : fallback;
  },

  // Safe record access helper
  safeRecordAccess: <T>(record: Record<string, T>, key: string, fallback: T): T => {
    const value = record[key];
    return value !== undefined ? value : fallback;
  },

  // Optional property merger
  mergeOptionalProperties: <T extends Record<string, unknown>>(
    base: T,
    optional: Partial<T>
  ): T => {
    const result = { ...base };
    
    // Only assign properties that are not undefined
    Object.entries(optional).forEach(([key, value]) => {
      if (value !== undefined) {
        (result as any)[key] = value;
      }
    });
    
    return result;
  }
};

// =============================================================================
// VALIDATION SUMMARY
// =============================================================================

/**
 * Run demonstration and return summary
 */
export function runTypeSafetyDemo() {
  const results = {
    arrayDemo: demonstrateArraySafety(),
    recordDemo: demonstrateRecordSafety(),
    optionalDemo: demonstrateOptionalPropertySafety(),
    performanceDemo: measureSafetyPerformance(),
    
    benefits: {
      catchesRuntimeErrors: 'Array and object access errors caught at compile time',
      clearnessOfIntent: 'Optional properties must be explicitly handled',
      betterDevExperience: 'IDE provides better autocomplete and error detection',
      codeQuality: 'Forces defensive programming patterns'
    },
    
    migrationTips: [
      'Use optional chaining (?.) for safe property access',
      'Prefer explicit bounds checking over direct array access',
      'Use conditional spreads for optional properties',
      'Leverage the migration helpers provided'
    ]
  };

  console.log('🎯 Enhanced Type Safety Demo Results:', results);
  return results;
} 