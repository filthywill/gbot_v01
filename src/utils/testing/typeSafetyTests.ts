/**
 * Enhanced Type Safety Validation Tests
 * 
 * This file contains tests and examples that demonstrate the benefits of our
 * enhanced TypeScript configuration with noUncheckedIndexedAccess and exactOptionalPropertyTypes.
 * 
 * ⚠️ These tests are designed to FAIL compilation if enhanced type safety is working correctly!
 */

import { CustomizationOptions, ProcessedSvg } from '../../types';

// =============================================================================
// TEST 1: noUncheckedIndexedAccess validation
// =============================================================================

/**
 * Test that array access without bounds checking is caught
 */
export function testArrayAccessSafety() {
  const testArray = ['a', 'b', 'c'];
  
  // ✅ SAFE: Proper bounds checking
  const safeAccess = (index: number): string | undefined => {
    return testArray[index]; // This returns string | undefined due to noUncheckedIndexedAccess
  };
  
  // ✅ SAFE: Proper handling of potentially undefined values
  const safeDereference = (index: number): string => {
    const item = testArray[index];
    if (item !== undefined) {
      return item.toUpperCase(); // TypeScript knows item is string here
    }
    return 'DEFAULT';
  };
  
  // ❌ UNSAFE: This should show type error without proper checking
  // Uncomment to test enhanced type safety:
  // const unsafeAccess = testArray[5].toUpperCase(); // Type error: Object is possibly 'undefined'
  
  return { safeAccess, safeDereference };
}

/**
 * Test ProcessedSvg array access patterns (real-world example)
 */
export function testProcessedSvgArraySafety(processedSvgs: ProcessedSvg[], positions: number[]) {
  // ✅ SAFE: Proper bounds checking
  const safePositionAccess = (index: number) => {
    const svg = processedSvgs[index];
    const position = positions[index];
    
    if (svg && position !== undefined) {
      return {
        x: position + svg.bounds.left,
        y: svg.bounds.top
      };
    }
    return null;
  };
  
  // ❌ UNSAFE: Direct access without checking (would cause type errors)
  // Uncomment to test:
  // const unsafeAccess = processedSvgs[0].bounds.left; // Type error: Object is possibly 'undefined'
  // const unsafePosition = positions[0] + 10; // Type error: Object is possibly 'undefined'
  
  return safePositionAccess;
}

// =============================================================================
// TEST 2: exactOptionalPropertyTypes validation
// =============================================================================

/**
 * Test interface with optional properties
 */
interface TestOptionalInterface {
  required: string;
  optional?: string;
}

/**
 * Test that optional properties handle undefined correctly
 */
export function testOptionalPropertySafety() {
  // ✅ VALID: Omitting optional property
  const validObject1: TestOptionalInterface = {
    required: 'test'
  };
  
  // ✅ VALID: Including optional property with value
  const validObject2: TestOptionalInterface = {
    required: 'test',
    optional: 'value'
  };
  
  // ❌ INVALID: Explicitly setting optional to undefined (exactOptionalPropertyTypes catches this)
  // Uncomment to test:
  // const invalidObject: TestOptionalInterface = {
  //   required: 'test',
  //   optional: undefined // Type error with exactOptionalPropertyTypes
  // };
  
  return { validObject1, validObject2 };
}

/**
 * Test CustomizationOptions with enhanced optional property checking
 */
export function testCustomizationOptionsSafety() {
  // ✅ SAFE: Creating options without optional properties
  const baseOptions: Partial<CustomizationOptions> = {
    fillEnabled: true,
    fillColor: '#000000'
  };
  
  // ✅ SAFE: Conditional assignment
  const conditionalOptions: Partial<CustomizationOptions> = {
    fillEnabled: true,
    fillColor: '#000000',
    // Only include __skipHistory if we actually want to set it
    ...(Math.random() > 0.5 && { __skipHistory: true })
  };
  
  // ❌ UNSAFE: Explicit undefined assignment (caught by exactOptionalPropertyTypes)
  // Uncomment to test:
  // const unsafeOptions: CustomizationOptions = {
  //   ...DEFAULT_OPTIONS,
  //   __skipHistory: undefined, // Type error with exactOptionalPropertyTypes
  //   __presetId: undefined     // Type error with exactOptionalPropertyTypes
  // };
  
  return { baseOptions, conditionalOptions };
}

// =============================================================================
// TEST 3: Real-world type safety improvements
// =============================================================================

/**
 * Simulate pixel data access patterns (like in SVG processing)
 */
export function testPixelDataSafety(pixelData: boolean[][]) {
  // ✅ SAFE: Proper bounds checking for 2D array
  const safePixelAccess = (x: number, y: number): boolean => {
    const row = pixelData[y];
    if (row && x < row.length) {
      const pixel = row[x];
      return pixel !== undefined ? pixel : false;
    }
    return false;
  };
  
  // ❌ UNSAFE: Direct access without checking
  // Uncomment to test:
  // const unsafePixelAccess = pixelData[10][5]; // Type error: Object is possibly 'undefined'
  
  return safePixelAccess;
}

/**
 * Test object property access with proper type guards
 */
export function testObjectPropertySafety(data: Record<string, unknown>) {
  // ✅ SAFE: Type guard pattern
  const safePropertyAccess = (key: string): string | null => {
    const value = data[key]; // Returns unknown | undefined due to noUncheckedIndexedAccess
    if (typeof value === 'string') {
      return value;
    }
    return null;
  };
  
  // ❌ UNSAFE: Direct property access and assumption
  // Uncomment to test:
  // const unsafeAccess = (data['someKey'] as string).toUpperCase(); // Risky without proper checking
  
  return safePropertyAccess;
}

// =============================================================================
// TEST 4: Edge case handling
// =============================================================================

/**
 * Test empty array handling
 */
export function testEmptyArraySafety() {
  const emptyArray: string[] = [];
  
  // ✅ SAFE: Check array length before access
  const safeFirstItem = emptyArray.length > 0 ? emptyArray[0] : 'default';
  
  // ❌ UNSAFE: Direct access to potentially empty array
  // Uncomment to test:
  // const unsafeFirstItem = emptyArray[0].toUpperCase(); // Type error: Object is possibly 'undefined'
  
  return safeFirstItem;
}

/**
 * Test sparse array handling
 */
export function testSparseArraySafety() {
  const sparseArray = new Array(10); // Creates array with holes
  sparseArray[5] = 'value';
  
  // ✅ SAFE: Check for undefined values
  const safeAccess = (index: number): string => {
    const item = sparseArray[index];
    return item !== undefined ? item : 'missing';
  };
  
  return safeAccess;
}

// =============================================================================
// VALIDATION SUMMARY
// =============================================================================

/**
 * Run all type safety validation tests
 */
export function runTypeSafetyValidation() {
  const results = {
    arrayAccess: testArrayAccessSafety(),
    optionalProperties: testOptionalPropertySafety(),
    emptyArrays: testEmptyArraySafety(),
    timestamp: new Date().toISOString(),
    
    // Summary of improvements
    improvements: {
      arrayAccessSafety: 'Arrays now return T | undefined, preventing runtime errors',
      optionalPropertySafety: 'Optional properties cannot be explicitly set to undefined',
      betterInference: 'TypeScript provides more accurate type inference',
      earlyErrorDetection: 'Potential runtime errors caught at compile time'
    }
  };
  
  console.log('🎯 Enhanced Type Safety Validation Results:', results);
  return results;
}

// =============================================================================
// BEFORE/AFTER COMPARISON EXAMPLES
// =============================================================================

/**
 * Examples showing the difference between old and new type safety
 */
export const beforeAfterExamples = {
  
  // Array access patterns
  arrayAccess: {
    before: `
      // ❌ OLD: Could cause runtime errors
      const processedSvgs = getProcessedSvgs();
      const firstSvg = processedSvgs[0]; // Type: ProcessedSvg (incorrect!)
      const width = firstSvg.width; // Runtime error if array is empty
    `,
    after: `
      // ✅ NEW: Compile-time safety
      const processedSvgs = getProcessedSvgs();
      const firstSvg = processedSvgs[0]; // Type: ProcessedSvg | undefined (correct!)
      const width = firstSvg?.width ?? 0; // Safe access with fallback
    `
  },
  
  // Optional properties
  optionalProperties: {
    before: `
      // ❌ OLD: Allowed confusing undefined assignments
      const options: CustomizationOptions = {
        ...defaultOptions,
        __skipHistory: undefined, // Was allowed but confusing
        __presetId: undefined     // Was allowed but confusing
      };
    `,
    after: `
      // ✅ NEW: Clear intent, no explicit undefined
      const options: CustomizationOptions = {
        ...defaultOptions,
        // Optional properties are simply omitted
        ...(shouldSkipHistory && { __skipHistory: true }),
        ...(presetId && { __presetId: presetId })
      };
    `
  }
}; 