# SVG Optimizer Usage Guide

This guide explains how to use the SVG optimizer tool for testing and batch processing SVG files.

## Quick Start

The SVG optimizer tool provides a convenient way to optimize SVG files, reducing their file size by approximately 50% while maintaining visual quality.

### Basic Usage

1. Navigate to the `svg-optimizer` directory:
   ```
   cd svg-optimizer
   ```

2. Place your SVG files in the `test-svgs` directory.

3. Run the optimization script:
   ```
   node test-svg-optimization.js
   ```

4. Find your optimized SVGs in the `optimized-svgs` directory. The original filenames are preserved.

## Visual Comparison

To visually compare original and optimized SVGs:

1. Run the optimization script as described above.

2. Open `svg-comparison.html` in your web browser:
   ```
   # On Windows
   start svg-comparison.html
   
   # On macOS
   open svg-comparison.html
   
   # On Linux
   xdg-open svg-comparison.html
   ```

3. The comparison page will show the original SVG and the optimized version side by side, along with file size information and savings percentage.

## Batch Processing

The SVG optimizer is perfect for batch processing multiple SVG files at once:

1. Place all your SVG files in the `test-svgs` directory.

2. Run the optimization script as described above.

3. All SVGs will be processed and saved to the `optimized-svgs` directory with their original filenames.

4. The console will display a detailed report showing file size reductions for each file.

## Integration with Your Workflow

### Manual Optimization

For one-off SVG optimization:

1. Copy your SVGs to the `test-svgs` directory.
2. Run the optimization script.
3. Use the optimized SVGs from the `optimized-svgs` directory in your project.

### Automated Build Process

For automated optimization during build:

1. Add a script to your `package.json`:
   ```json
   {
     "scripts": {
       "optimize-svgs": "node svg-optimizer/test-svg-optimization.js"
     }
   }
   ```

2. Run the script as part of your build process:
   ```
   npm run optimize-svgs
   ```

## How It Works

The SVG optimizer uses the `qualityCompressor` preset from SVGO, which:

- Removes unnecessary attributes and metadata
- Optimizes path data with balanced precision
- Preserves critical SVG elements like transformations and viewBox
- Maintains visual quality while reducing file size

## Troubleshooting

### Missing Output Directory

If the `optimized-svgs` directory doesn't exist:

```
mkdir optimized-svgs
```

### SVG Files Not Found

Ensure your SVG files are placed directly in the `test-svgs` directory (not in subdirectories).

### Visual Differences

If optimized SVGs look different from the originals:

1. Check if your SVGs have unusual features or custom elements
2. Look for error messages in the console
3. Ensure the SVGs are valid according to SVG specifications

## Example Results

Typical results from optimization:

```
=== SVG Optimization Report ===
Optimizing SVGs using 'qualityCompressor' preset
Input directory: D:\Coding\gbot_v01\svg-optimizer\test-svgs
Output directory: D:\Coding\gbot_v01\svg-optimizer\optimized-svgs
Preserving original filenames: Yes

Optimization Results:
-------------------------------------
| File                 | Size (B) | Savings |
|----------------------|----------|---------|
| example.svg          | 22742    | Original |
| → Optimized          | 11482    | 49.51% |
-------------------------------------
```

## Additional Resources

For more information about SVG optimization techniques:

- [SVGO Documentation](https://github.com/svg/svgo)
- [SVG Specification](https://www.w3.org/TR/SVG2/)
- [SVG Optimization Best Practices](https://jakearchibald.github.io/svgomg/) 