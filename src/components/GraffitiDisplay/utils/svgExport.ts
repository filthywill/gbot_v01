import { ProcessedSvg, CustomizationOptions } from '../../../types';
import { createFilename, createSvgElement, createContentGroup, LAYER_ORDER } from './exportUtils';

/**
 * Exports the graffiti as an SVG file
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
  let svgString = serializer.serializeToString(newSvg);
  
  // Add XML declaration
  svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;
  
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
  
  console.log(`SVG saved successfully as ${filename}`);
}; 