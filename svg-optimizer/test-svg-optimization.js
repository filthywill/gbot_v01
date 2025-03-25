/**
 * SVG Optimization Test Script
 * 
 * This script tests the optimization of SVG files using the qualityCompressor preset
 * and preserves original filenames for easier integration.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { testOptimizationOnDirectory } from './svgOptimizer.js';

// Get current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup directories
const inputDir = path.join(__dirname, 'test-svgs');
const outputDir = path.join(__dirname, 'optimized-svgs');

// Set to true to keep original filenames, false to add preset suffix
const keepOriginalFilenames = true;

// Print header
console.log('=== SVG Optimization Report ===');
console.log(`Optimizing SVGs using 'qualityCompressor' preset`);
console.log(`Input directory: ${inputDir}`);
console.log(`Output directory: ${outputDir}`);
console.log(`Preserving original filenames: ${keepOriginalFilenames ? 'Yes' : 'No'}`);
console.log('\n');

// Process files and get results - pass the keepOriginalFilenames parameter
const results = testOptimizationOnDirectory(inputDir, outputDir, keepOriginalFilenames);

// Display optimization results in a table
console.log('Optimization Results:');
console.log('-------------------------------------');
console.log('| File                 | Size (B) | Savings |');
console.log('|----------------------|----------|---------|');

results.forEach(result => {
  console.log(`| ${result.fileName.padEnd(20)} | ${result.originalSize.toString().padEnd(8)} | Original |`);
  
  // We only use qualityCompressor now
  const level = 'qualityCompressor';
  const data = result.optimized[level];
  console.log(`| → Optimized          | ${data.size.toString().padEnd(8)} | ${data.savings}% |`);
  
  console.log('|----------------------|----------|---------|');
});

console.log('\nAll optimized SVGs have been saved to the output directory.');
if (keepOriginalFilenames) {
  console.log('Original filenames have been preserved - files have been replaced with optimized versions.');
} else {
  console.log('Files have been saved with the suffix "-qualityCompressor".');
}
console.log('Review them visually as needed.'); 