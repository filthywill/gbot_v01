import { ProcessedSvg, CustomizationOptions } from '../src/types';
import { exportAsSvg as originalExportAsSvg } from '../src/components/GraffitiDisplay/utils/svgExport';
import { optimize } from 'svgo';
import { createFilename } from '../src/components/GraffitiDisplay/utils/exportUtils';

// Default SVGO configuration optimized for our graffiti SVGs
const DEFAULT_CONFIG = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Keep viewBox for proper scaling
          removeViewBox: false,
          // Disable shape to path conversion for better fidelity
          convertShapeToPath: false,
          // Configure path data conversion
          convertPathData: {
            floatPrecision: 2,
            transformPrecision: 5,
          },
          // Configure numeric values cleanup
          cleanupNumericValues: {
            floatPrecision: 2,
          },
          // Enable group collapsing
          collapseGroups: true,
          // Enable path merging
          mergePaths: true,
        },
      },
    },
    { name: 'sortAttrs', active: true },
  ]
};

/**
 * Optimizes an SVG string using SVGO
 * 
 * @param svgString - The SVG content to optimize
 * @param customConfig - Optional custom SVGO configuration
 * @returns Optimized SVG string
 */
function optimizeSvgString(svgString: string, customConfig: any = null): string {
  try {
    const config = customConfig || DEFAULT_CONFIG;
    const result = optimize(svgString, {
      path: undefined, // Input is a string, not a file path
      ...config
    });
    
    return result.data;
  } catch (error) {
    console.error('SVG optimization error:', error);
    // Return the original unmodified SVG if optimization fails
    return svgString;
  }
}

/**
 * Exports the graffiti as an optimized SVG file
 * This function is a direct replacement for the original exportAsSvg
 */
export const exportAsSvg = (
  contentRef: HTMLDivElement,
  containerRef: HTMLDivElement,
  processedSvgs: ProcessedSvg[],
  customizationOptions: CustomizationOptions,
  contentWidth: number,
  contentHeight: number,
  scaleFactor: number,
  additionalScaleFactor: number,
  inputText: string = '',
  optimizationEnabled: boolean = true
): void => {
  if (!optimizationEnabled) {
    // Call the original function if optimization is disabled
    return originalExportAsSvg(
      contentRef,
      containerRef,
      processedSvgs,
      customizationOptions,
      contentWidth,
      contentHeight,
      scaleFactor,
      additionalScaleFactor,
      inputText
    );
  }
  
  // Create a function that will intercept and optimize SVG blobs
  const interceptAndOptimizeSvg = (svgString: string): string => {
    try {
      console.log('Optimizing SVG...');
      const originalSize = new Blob([svgString], { type: 'image/svg+xml' }).size;
      
      // Optimize the SVG string
      const optimizedSvg = optimizeSvgString(svgString);
      
      // Calculate size reduction
      const optimizedSize = new Blob([optimizedSvg], { type: 'image/svg+xml' }).size;
      const savingsPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      
      console.log(`Original size: ${(originalSize / 1024).toFixed(1)} KB`);
      console.log(`Optimized size: ${(optimizedSize / 1024).toFixed(1)} KB`);
      console.log(`Size reduction: ${savingsPercent}%`);
      
      return optimizedSvg;
    } catch (error) {
      console.error('Error optimizing SVG:', error);
      // If optimization fails, use the original SVG
      return svgString;
    }
  };
  
  // Save the original XMLSerializer.serializeToString method
  const originalSerializer = XMLSerializer.prototype.serializeToString;
  
  // Override the serializeToString method to intercept SVG nodes
  XMLSerializer.prototype.serializeToString = function(this: XMLSerializer, node: Node): string {
    // Call the original method to get the string
    const svgString = originalSerializer.call(this, node);
    
    // Check if this is an SVG element
    if (node.nodeType === 1 && node.nodeName === 'svg') {
      return interceptAndOptimizeSvg(svgString);
    }
    
    // Return the original result for non-SVG nodes
    return svgString;
  };
  
  try {
    // Call the original export function with our serializer override in place
    originalExportAsSvg(
      contentRef,
      containerRef,
      processedSvgs,
      customizationOptions,
      contentWidth,
      contentHeight,
      scaleFactor,
      additionalScaleFactor,
      inputText
    );
  } finally {
    // Restore the original serializer method
    XMLSerializer.prototype.serializeToString = originalSerializer;
  }
};

/**
 * Simplified alternative that directly replaces the existing exportAsSvg
 * This approach doesn't modify any built-in prototypes
 */
export const exportAsSvgSimple = (
  contentRef: HTMLDivElement,
  containerRef: HTMLDivElement,
  processedSvgs: ProcessedSvg[],
  customizationOptions: CustomizationOptions,
  contentWidth: number,
  contentHeight: number,
  scaleFactor: number,
  additionalScaleFactor: number,
  inputText: string = ''
): void => {
  if (!contentRef || processedSvgs.length === 0) {
    throw new Error('Content reference or SVGs not available');
  }
  
  // Get the content container dimensions
  const contentContainer = contentRef;
  
  // Get the parent container (which contains the background)
  const parentContainer = containerRef;
  if (!parentContainer) {
    throw new Error('Parent container ref not available');
  }
  
  // Get the dimensions of the parent container (this will be our SVG canvas size)
  const parentRect = parentContainer.getBoundingClientRect();
  const width = parentRect.width;
  const height = parentRect.height;
  
  // Create a new SVG document with the same dimensions as the parent container
  const svgNamespace = "http://www.w3.org/2000/svg";
  const newSvg = document.createElementNS(svgNamespace, "svg");
  newSvg.setAttribute("width", `${width}`);
  newSvg.setAttribute("height", `${height}`);
  newSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  
  // Add background if enabled
  if (customizationOptions.backgroundEnabled) {
    const background = document.createElementNS(svgNamespace, "rect");
    background.setAttribute("x", "0");
    background.setAttribute("y", "0");
    background.setAttribute("width", `${width}`);
    background.setAttribute("height", `${height}`);
    background.setAttribute("fill", customizationOptions.backgroundColor);
    newSvg.appendChild(background);
  }
  
  // Create a group for all the content
  const centerX = width / 2;
  const centerY = height / 2;
  const contentGroup = document.createElementNS(svgNamespace, "g");
  contentGroup.setAttribute(
    "transform", 
    `translate(${centerX}, ${centerY}) scale(${scaleFactor * additionalScaleFactor}) translate(-${contentWidth/2}, -${contentHeight/2})`
  );
  
  // Define layer order (matching the original export function)
  const LAYER_ORDER = [
    '.shield-layer',
    '.shadow-shield-layer',
    '.shadow-layer',
    '.stamp-layer',
    '.main-layer'
  ];
  
  // Create a map to store layers by selector for ordered processing
  const layerMap = new Map();
  
  // First, collect all layers
  LAYER_ORDER.forEach(selector => {
    const elements = contentContainer.querySelectorAll(selector);
    if (elements.length > 0) {
      layerMap.set(selector, Array.from(elements));
    }
  });
  
  // Process layers in the specified order
  LAYER_ORDER.forEach(selector => {
    const layers = layerMap.get(selector);
    if (!layers) return;
    
    layers.forEach((layer: Element) => {
      const svg = layer.querySelector('svg');
      if (!svg) return;
      
      // Clone the SVG
      const clonedSvg = svg.cloneNode(true) as SVGElement;
      
      // Create a group for this layer
      const layerGroup = document.createElementNS(svgNamespace, "g");
      
      // Get the computed style of the layer
      const layerStyle = window.getComputedStyle(layer as HTMLElement);
      
      // Get the left position from the style
      const left = parseFloat(layerStyle.left);
      
      // Get the transform from the layer
      const transform = layerStyle.transform;
      
      // Set the transform on the group
      layerGroup.setAttribute("transform", `translate(${left}, 0) ${transform}`);
      
      // Add the cloned SVG to the layer group
      layerGroup.appendChild(clonedSvg);
      
      // Add the layer group to the content group
      contentGroup.appendChild(layerGroup);
    });
  });
  
  // Add the content group to the SVG
  newSvg.appendChild(contentGroup);
  
  // Convert the SVG to a string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(newSvg);
  
  // Add XML declaration
  svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;
  
  // Optimize the SVG
  try {
    console.log('Optimizing SVG...');
    const originalSize = new Blob([svgString], { type: 'image/svg+xml' }).size;
    
    // Optimize the SVG string
    svgString = optimizeSvgString(svgString);
    
    // Calculate size reduction
    const optimizedSize = new Blob([svgString], { type: 'image/svg+xml' }).size;
    const savingsPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`Original size: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`Optimized size: ${(optimizedSize / 1024).toFixed(1)} KB`);
    console.log(`Size reduction: ${savingsPercent}%`);
  } catch (error) {
    console.error('Error optimizing SVG:', error);
    // If optimization fails, use the original SVG
  }
  
  // Create a blob and download link
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  // Generate filename from input text
  const filename = createFilename(inputText, 'svg');
  
  // Create a download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`Optimized SVG saved successfully as ${filename}`);
};

/**
 * Usage in your application:
 * 
 * 1. Option 1: Direct replacement
 *    Replace the import in useGraffitiExport.ts:
 *    
 *    import { exportAsSvg } from '../utils/svgExport';
 *    
 *    with:
 *    
 *    import { exportAsSvg } from '../../../svg-optimizer/optimizedSvgExport';
 * 
 * 2. Option 2: Conditionally use optimization based on user preference
 *    
 *    import { exportAsSvg as originalExportAsSvg } from '../utils/svgExport';
 *    import { exportAsSvg as optimizedExportAsSvg } from '../../../svg-optimizer/optimizedSvgExport';
 *    
 *    // In useGraffitiExport.ts:
 *    const shouldOptimize = usePreferenceStore(state => state.optimizeSvgs);
 *    
 *    const saveAsSvg = useCallback(() => {
 *      // ...
 *      const exportFunction = shouldOptimize ? optimizedExportAsSvg : originalExportAsSvg;
 *      exportFunction(
 *        contentRef.current,
 *        containerRef.current,
 *        // ... other params
 *      );
 *      // ...
 *    }, [shouldOptimize, ...other deps]);
 */ 