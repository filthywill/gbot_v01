/**
 * SVG Optimizer Module
 * 
 * This module provides utility functions for optimizing SVG files using SVGO v3.x.
 */
import { optimize } from 'svgo';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Optimization presets for different levels of optimization
export const OPTIMIZATION_PRESETS = {
  // Minimal optimization - safe changes only
  minimal: {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // Critical for scaling - keep viewBox
            removeViewBox: false,
            // Don't modify transforms - important for positioning
            convertTransform: false,
            // Don't convert shapes to paths
            convertShapeToPath: false,
            // Remove empty elements
            removeEmptyContainers: true,
            // Keep groups that might have styling
            collapseGroups: false,
            // Remove comments, editor data
            removeComments: true,
            removeEditorsNSData: true,
            // Use moderate precision
            cleanupNumericValues: {
              floatPrecision: 3
            },
            // Remove unused namespaces
            removeUnusedNS: true,
            // Remove metadata
            removeMetadata: true,
            // Remove title elements
            removeTitle: true
          }
        }
      },
      // Sort attributes for consistency
      { name: 'sortAttrs', active: true }
    ]
  },
  
  // High Quality Compressor - significant compression while preserving visual quality
  qualityCompressor: {
    multipass: true,
    js2svg: {
      indent: 0,
      pretty: false
    },
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // Critical for scaling - keep viewBox
            removeViewBox: false,
            
            // Don't modify transforms - preserve positioning
            convertTransform: false,
            
            // Balanced path optimization with higher precision
            convertPathData: {
              floatPrecision: 0,          // Aggressive compression
              transformPrecision: 3,       // Higher precision for transforms
              noSpaceAfterFlags: true,     // Safe text optimization  
              makeArcs: true,              // Optimize arcs for smaller paths
              straightCurves: true,        // Safe optimization
              lineShorthands: true,        // Safe optimization
              curveSmoothShorthands: true, // Safe optimization
              removeUseless: true,         // Remove redundant data points
              leadingZero: true            // Safe text optimization
            },
            
            // Convert selected shapes to paths where beneficial
            convertShapeToPath: {
              rectangle: true,   // Usually benefits
              circle: false,     // Keep as circle - more efficient
              ellipse: false,    // Keep as ellipse - more efficient
              polygon: true,     // Usually benefits
              polyline: true     // Usually benefits
            },
            
            // Preserve important groups and structures
            collapseGroups: false,
            
            // Good precision-to-quality ratio
            cleanupNumericValues: {
              floatPrecision: 2  // Good visual quality
            },
            
            // Safe content cleanup
            removeComments: true,
            removeMetadata: true,
            removeEditorsNSData: true,
            removeTitle: true,
            removeDesc: true,
            removeEmptyText: true,
            removeEmptyAttrs: true,
            removeEmptyContainers: true,
            removeUnusedNS: true,
            removeHiddenElems: true,
            removeDoctype: true,
            removeXMLProcInst: true,
            
            // Safe attribute optimization
            convertColors: true,
            minifyStyles: true,
            cleanupAttrs: true,
            removeUselessStrokeAndFill: true
          }
        }
      },
      // Convert style to attributes when safe
      { name: 'convertStyleToAttrs', active: true },
      // Remove scripts (not relevant for SVG display)
      { name: 'removeScriptElement', active: true },
      // Remove style elements (not needed with attributes converted)
      { name: 'removeStyleElement', active: true },
      // Remove common unused attributes while preserving important ones
      { 
        name: 'removeAttrs', 
        params: { 
          attrs: [
            'data-name', 'version', 'xmlns:xlink', 'enable-background',
            'xml:space', 'xmlns:svg'
          ]
        }
      },
      // Sort attributes for better compression
      { name: 'sortAttrs', active: true }
    ]
  }
};

/**
 * Optimizes SVG content
 * 
 * @param {string} svgContent - The SVG content to optimize
 * @param {string} level - Optimization level: 'minimal' or 'qualityCompressor'
 * @param {object} customConfig - Optional custom config to override preset
 * @return {string} - Optimized SVG content
 */
export function optimizeSvg(svgContent, level = 'qualityCompressor', customConfig = null) {
  try {
    const config = customConfig || OPTIMIZATION_PRESETS[level] || OPTIMIZATION_PRESETS.qualityCompressor;
    
    const result = optimize(svgContent, config);
    
    // Check if the SVG already has an XML declaration, if not add it
    if (!result.data.startsWith('<?xml')) {
      return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + result.data;
    }
    
    return result.data;
  } catch (error) {
    console.error(`Error optimizing SVG with level "${level}":`, error);
    // Return original content if optimization fails
    return svgContent;
  }
}

/**
 * Tests optimization on a single SVG file
 * 
 * @param {string} filePath - Path to the SVG file
 * @param {string} outputDir - Directory to save optimized files
 * @param {boolean} keepOriginalFilename - Whether to keep the original filename without adding a suffix
 * @return {object} - Results for each optimization level
 */
export function testOptimizationOnFile(filePath, outputDir, keepOriginalFilename = true) {
  try {
    const fileName = path.basename(filePath);
    const svgContent = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(svgContent, 'utf8');
    
    const results = {
      fileName,
      originalSize,
      optimized: {}
    };
    
    // Only use qualityCompressor preset
    const level = 'qualityCompressor';
    const optimizedSvg = optimizeSvg(svgContent, level);
    const optimizedSize = Buffer.byteLength(optimizedSvg, 'utf8');
    const savings = ((originalSize - optimizedSize) / originalSize) * 100;
    
    results.optimized[level] = {
      size: optimizedSize,
      savings: savings.toFixed(2)
    };
    
    // Save the optimized SVG - either with original filename or with suffix
    let outputPath;
    if (keepOriginalFilename) {
      outputPath = path.join(outputDir, fileName);
    } else {
      outputPath = path.join(outputDir, `${path.parse(fileName).name}-${level}.svg`);
    }
    
    fs.writeFileSync(outputPath, optimizedSvg, 'utf8');
    
    return results;
  } catch (error) {
    console.error(`Error testing optimization on file ${filePath}:`, error);
    return null;
  }
}

/**
 * Tests optimization on all SVG files in a directory
 * 
 * @param {string} inputDir - Directory containing SVG files
 * @param {string} outputDir - Directory to save optimized files
 * @param {boolean} keepOriginalFilename - Whether to keep original filenames
 * @return {Array} - Results for each file
 */
export function testOptimizationOnDirectory(inputDir, outputDir, keepOriginalFilename = true) {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get all SVG files in the input directory
    const files = fs.readdirSync(inputDir)
      .filter(file => file.toLowerCase().endsWith('.svg'))
      .map(file => path.join(inputDir, file));
    
    // Test optimization on each file
    const results = files.map(file => testOptimizationOnFile(file, outputDir, keepOriginalFilename));
    
    return results.filter(result => result !== null);
  } catch (error) {
    console.error(`Error testing optimization on directory ${inputDir}:`, error);
    return [];
  }
} 