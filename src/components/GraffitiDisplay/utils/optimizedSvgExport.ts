// optimizedSvgExport.ts - SVG Optimizer integration for GBot
import { optimize, Config } from 'svgo';
import { ProcessedSvg, CustomizationOptions } from '../../../types';
import { exportAsSvg } from './svgExport';

/**
 * Definition of optimization levels with specific configurations
 */
export const OPTIMIZATION_LEVELS = {
  minimal: {
    multipass: true,
    plugins: [
      'cleanupAttrs',
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeTitle',
      'removeDesc',
      'removeUselessDefs',
      'removeEditorsNSData',
      'removeEmptyAttrs',
      'removeHiddenElems',
      'removeEmptyText',
      'removeEmptyContainers',
      'cleanupEnableBackground',
      'minifyStyles',
      'convertColors',
      'convertPathData',
      {
        name: 'removeAttrs',
        params: {
          attrs: ['data-name', 'class', 'fill-rule'],
        },
      },
    ],
  },
  moderate: {
    multipass: true,
    plugins: [
      'cleanupAttrs',
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeTitle',
      'removeDesc',
      'removeUselessDefs',
      'removeEditorsNSData',
      'removeEmptyAttrs',
      'removeHiddenElems',
      'removeEmptyText',
      'removeEmptyContainers',
      'cleanupEnableBackground',
      'minifyStyles',
      'convertColors',
      'convertPathData',
      {
        name: 'removeAttrs',
        params: {
          attrs: ['data-name', 'class', 'fill-rule'],
        },
      },
      'sortAttrs',
      'removeDimensions',
      'removeStyleElement',
      'removeScriptElement',
    ],
  },
  aggressive: {
    multipass: true,
    plugins: [
      'cleanupAttrs',
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeTitle',
      'removeDesc',
      'removeUselessDefs',
      'removeEditorsNSData',
      'removeEmptyAttrs',
      'removeHiddenElems',
      'removeEmptyText',
      'removeEmptyContainers',
      'cleanupEnableBackground',
      'minifyStyles',
      'convertColors',
      'convertPathData',
      {
        name: 'removeAttrs',
        params: {
          attrs: ['data-name', 'class', 'fill-rule'],
        },
      },
      'sortAttrs',
      'removeDimensions',
      'removeStyleElement',
      'removeScriptElement',
      'convertShapeToPath',
      'convertEllipseToCircle',
      'removeOffCanvasPaths',
      'convertTransform',
      'removeUselessStrokeAndFill',
      'cleanupNumericValues',
      'cleanupListOfValues',
      'reusePaths',
    ],
  },
  // Specifically designed for graffiti SVGs
  graffiti: {
    multipass: true,
    plugins: [
      'cleanupAttrs',
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeTitle',
      'removeDesc',
      'removeEditorsNSData',
      'removeEmptyAttrs',
      'removeHiddenElems',
      'removeEmptyText',
      'cleanupEnableBackground',
      'minifyStyles',
      'convertColors',
      {
        name: 'convertPathData',
        params: {
          noSpaceAfterFlags: false,
          applyTransforms: false,
          applyTransformsStroked: false,
          makeArcs: {
            threshold: 2.5,
            tolerance: 0.5,
          },
          straightCurves: false,
          lineShorthands: true,
          curveSmoothShorthands: true,
          floatPrecision: 3,
          transformPrecision: 5,
          removeUseless: true,
          collapseRepeated: true,
          utilizeAbsolute: true,
          leadingZero: true,
          negativeExtraSpace: true,
          noSpaceAfterFlags: false,
          forceAbsolutePath: false
        },
      },
      {
        name: 'removeAttrs',
        params: {
          attrs: ['data-name', 'class', 'fill-rule'],
        },
      },
      {
        name: 'sortAttrs',
        params: {
          xmlnsOrder: 'alphabetical',
        },
      },
      'removeStyleElement',
      'removeScriptElement',
      'removeOffCanvasPaths',
      {
        name: 'convertTransform',
        params: {
          convertToShorts: false,
          floatPrecision: 3,
          transformPrecision: 5,
          matrixToTransform: true,
          shortTranslate: true,
          shortScale: true,
          shortRotate: true,
          removeUseless: true,
          collapseIntoOne: true,
          leadingZero: true,
          negativeExtraSpace: false
        },
      },
      {
        name: 'cleanupNumericValues',
        params: {
          floatPrecision: 3,
          leadingZero: true,
          defaultPx: true,
          convertToPx: true
        },
      },
      {
        name: 'cleanupListOfValues',
        params: {
          floatPrecision: 3,
          leadingZero: true,
          defaultPx: true,
          convertToPx: true
        },
      },
      {
        name: 'mergePaths',
        params: {
          force: false,
          noSpaceAfterFlags: false,
        },
      },
      'removeUselessStrokeAndFill',
    ],
  },
};

/**
 * Optimize an SVG string
 * @param {string} svgString - The original SVG content
 * @param {string} level - Optimization level
 * @returns {object} Object with the optimized svg and stats
 */
export function optimizeSvg(svgString: string, level: string = 'minimal'): {
  svg: string;
  originalSize: number;
  optimizedSize: number;
  savings: string;
  error?: string;
} {
  const originalSize = new Blob([svgString]).size;
  const config = OPTIMIZATION_LEVELS[level as keyof typeof OPTIMIZATION_LEVELS];
  
  if (!config) {
    console.error(`Unknown optimization level: ${level}`);
    return {
      svg: svgString,
      originalSize,
      optimizedSize: originalSize,
      savings: '0'
    };
  }
  
  try {
    // Always preserve viewBox and xmlns attributes
    const fullConfig: Config = {
      ...(config as Config),
      plugins: [
        ...(config.plugins as any[]),
        {
          name: 'removeViewBox',
          active: false
        },
        {
          name: 'prefixIds',
          active: false
        },
        {
          name: 'collapseGroups',
          active: level !== 'graffiti' // Disable for graffiti preset
        }
      ]
    };
    
    const result = optimize(svgString, fullConfig);
    const optimizedSvg = result.data;
    const optimizedSize = new Blob([optimizedSvg]).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    return {
      svg: optimizedSvg,
      originalSize,
      optimizedSize,
      savings
    };
  } catch (error) {
    console.error('SVG optimization error:', error);
    return {
      svg: svgString,
      originalSize,
      optimizedSize: originalSize,
      savings: '0',
      error: (error as Error).message
    };
  }
}

/**
 * Exports a ProcessedSvg as an optimized SVG
 * @param {ProcessedSvg} processedSvg - The processed SVG to export
 * @param {CustomizationOptions} options - Customization options
 * @returns {string} The SVG as a string
 */
export function exportAsSvgOptimized(
  processedSvg: ProcessedSvg,
  options: CustomizationOptions
): string {
  // Call the original export function
  const originalSvg = exportAsSvg(processedSvg, options);
  
  // Get optimization level (default to graffiti which is optimized for our use case)
  const optimizationLevel = options.optimizationLevel || 'graffiti';
  
  // Optimize the SVG
  const result = optimizeSvg(originalSvg, optimizationLevel);
  
  // Log optimization results
  console.log(`SVG optimized with ${optimizationLevel} level. Size: ${result.originalSize}B → ${result.optimizedSize}B (${result.savings}% reduction)`);
  
  return result.svg;
}
