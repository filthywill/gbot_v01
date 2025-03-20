import { ProcessedSvg, CustomizationOptions } from '../../../types';
import { createFilename, createSvgElement, createContentGroup, LAYER_ORDER } from './exportUtils';

/**
 * Creates an SVG string from the graffiti content
 */
export const createSvgString = (
  contentRef: HTMLDivElement,
  containerRef: HTMLDivElement,
  processedSvgs: ProcessedSvg[],
  customizationOptions: CustomizationOptions,
  contentWidth: number,
  contentHeight: number,
  scaleFactor: number,
  additionalScaleFactor: number
): string => {
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
  const newSvg = createSvgElement(
    width, 
    height, 
    customizationOptions.backgroundEnabled, 
    customizationOptions.backgroundColor
  );
  
  // Create a group for all the content
  const centerX = width / 2;
  const centerY = height / 2;
  const contentGroup = createContentGroup(
    svgNamespace,
    centerX,
    centerY,
    scaleFactor,
    additionalScaleFactor,
    contentWidth,
    contentHeight
  );
  
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
  return serializer.serializeToString(newSvg);
};

/**
 * Exports the graffiti as a PNG file
 */
export const exportAsPng = async (
  contentRef: HTMLDivElement,
  containerRef: HTMLDivElement,
  processedSvgs: ProcessedSvg[],
  customizationOptions: CustomizationOptions,
  contentWidth: number,
  contentHeight: number,
  scaleFactor: number,
  additionalScaleFactor: number,
  inputText: string = ''
): Promise<void> => {
  if (!contentRef || processedSvgs.length === 0) {
    throw new Error('Content reference or SVGs not available');
  }
  
  // Create SVG string
  const svgString = createSvgString(
    contentRef,
    containerRef,
    processedSvgs,
    customizationOptions,
    contentWidth,
    contentHeight,
    scaleFactor,
    additionalScaleFactor
  );
  
  // Get the parent container dimensions
  const parentContainer = containerRef;
  const parentRect = parentContainer.getBoundingClientRect();
  const width = parentRect.width;
  const height = parentRect.height;
  
  // Create a Blob from the SVG string
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  // Create an Image object to load the SVG
  const img = new Image();
  
  // Create a Promise to handle the async image loading
  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      // Create a canvas with 1.5x dimensions for moderate resolution
      const canvas = document.createElement('canvas');
      const highResFactor = 1.5; // 1.5x the original size for moderate resolution
      
      let canvasWidth, canvasHeight, drawX, drawY, drawWidth, drawHeight;
      
      if (!customizationOptions.backgroundEnabled) {
        // If background is transparent, we'll crop the canvas to the content with a fixed 5px margin
        
        // Create a temporary canvas to analyze the image content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) {
          reject(new Error('Could not get temporary canvas context'));
          return;
        }
        
        // Draw the image on the temporary canvas
        tempCtx.drawImage(img, 0, 0, width, height);
        
        // Get the image data to analyze non-transparent pixels
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Find the bounds of non-transparent pixels
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        
        // Scan the image data to find the bounding box of non-transparent pixels
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3]; // Alpha channel
            if (alpha > 0) { // Non-transparent pixel
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
        
        // If we found non-transparent pixels
        if (minX < maxX && minY < maxY) {
          // Calculate the content width and height independently
          const contentBoxWidth = maxX - minX;
          const contentBoxHeight = maxY - minY;
          
          // Use a fixed 5px margin on all sides
          const marginX = 5;
          const marginY = 5;
          
          // Calculate the final dimensions with margin
          const finalWidth = contentBoxWidth + (marginX * 2);
          const finalHeight = contentBoxHeight + (marginY * 2);
          
          // Set the canvas dimensions with high resolution factor
          canvasWidth = finalWidth * highResFactor;
          canvasHeight = finalHeight * highResFactor;
          
          // Calculate drawing parameters
          drawX = -minX + marginX;
          drawY = -minY + marginY;
          drawWidth = width;
          drawHeight = height;
        } else {
          // Fallback if no non-transparent pixels found
          canvasWidth = width * highResFactor;
          canvasHeight = height * highResFactor;
          drawX = 0;
          drawY = 0;
          drawWidth = width;
          drawHeight = height;
        }
      } else {
        // If background is enabled, use the full dimensions
        canvasWidth = width * highResFactor;
        canvasHeight = height * highResFactor;
        drawX = 0;
        drawY = 0;
        drawWidth = width;
        drawHeight = height;
      }
      
      // Set the canvas dimensions
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Get the canvas context and draw the image
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Enable high-quality image scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the image on the canvas with the calculated parameters
      ctx.drawImage(
        img, 
        0, 0, width, height, // Source rectangle
        drawX * highResFactor, drawY * highResFactor, // Destination position
        drawWidth * highResFactor, drawHeight * highResFactor // Destination size
      );
      
      // Convert the canvas to a PNG blob
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          reject(new Error('Could not create PNG blob'));
          return;
        }
        
        // Create a URL for the PNG blob
        const pngUrl = URL.createObjectURL(pngBlob);
        
        // Generate filename from input text
        const filename = createFilename(inputText, 'png');
        
        // Create a download link
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(svgUrl);
        
        console.log(`PNG saved successfully as ${filename}`);
        resolve();
      }, 'image/png', 0.8); // Quality parameter (0.8) affects JPEG but not PNG
    };
    
    img.onerror = (error) => {
      console.error('Error loading SVG for PNG conversion:', error);
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG for PNG conversion'));
    };
    
    // Set the source of the image to the SVG URL
    img.src = svgUrl;
  });
}; 