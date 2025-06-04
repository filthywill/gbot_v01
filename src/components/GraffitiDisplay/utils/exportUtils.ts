import { CustomizationOptions } from '../../../types';

/**
 * Creates a filename based on input text
 */
export const createFilename = (inputText: string, extension: 'svg' | 'png'): string => {
  if (!inputText || inputText.trim() === '') {
    return `STZCK.${extension}`;
  }
  
  // Clean the input text to make it suitable for a filename
  // Replace spaces with underscores and remove special characters except hyphens
  const cleanedText = inputText.trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]/g, '')
    .toUpperCase(); // Convert to uppercase to match STZCK branding
  
  // Use the format: (input text)_STZCK
  const filename = `${cleanedText}_STZCK.${extension}`;
  
  // Limit filename length to avoid excessively long filenames
  if (filename.length > 60) {
    const maxTextLength = 60 - '_STZCK.'.length - extension.length;
    return `${cleanedText.substring(0, maxTextLength)}_STZCK.${extension}`;
  }
  
  return filename;
};

/**
 * Creates an SVG element with the specified dimensions
 */
export const createSvgElement = (
  width: number, 
  height: number, 
  backgroundEnabled: boolean, 
  backgroundColor: string
): SVGSVGElement => {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const newSvg = document.createElementNS(svgNamespace, "svg");
  newSvg.setAttribute("width", `${width}`);
  newSvg.setAttribute("height", `${height}`);
  newSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  
  // Add background if enabled
  if (backgroundEnabled) {
    const background = document.createElementNS(svgNamespace, "rect");
    background.setAttribute("x", "0");
    background.setAttribute("y", "0");
    background.setAttribute("width", `${width}`);
    background.setAttribute("height", `${height}`);
    background.setAttribute("fill", backgroundColor);
    newSvg.appendChild(background);
  }
  
  return newSvg;
};

/**
 * Creates a content group with the appropriate transform
 */
export const createContentGroup = (
  svgNamespace: string,
  centerX: number,
  centerY: number,
  scaleFactor: number,
  additionalScaleFactor: number,
  contentWidth: number,
  contentHeight: number
): Element => {
  const contentGroup = document.createElementNS(svgNamespace, "g");
  contentGroup.setAttribute(
    "transform", 
    `translate(${centerX}, ${centerY}) scale(${scaleFactor * additionalScaleFactor}) translate(-${contentWidth/2}, -${contentHeight/2})`
  );
  return contentGroup;
};

/**
 * Shows a success message toast
 */
export const showSuccessMessage = (message: string): void => {
  const successMessage = document.createElement('div');
  successMessage.textContent = message;
  successMessage.style.position = 'absolute';
  successMessage.style.top = '50px';
  successMessage.style.left = '50%';
  successMessage.style.transform = 'translateX(-50%)';
  successMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  successMessage.style.color = 'white';
  successMessage.style.padding = '8px 16px';
  successMessage.style.borderRadius = '4px';
  successMessage.style.zIndex = '9999';
  successMessage.style.fontSize = '14px';
  document.body.appendChild(successMessage);
  
  // Remove the message after 2 seconds
  setTimeout(() => {
    document.body.removeChild(successMessage);
  }, 2000);
};

/**
 * Detects if the current device is mobile
 */
export const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

/**
 * Layer order for SVG export
 */
export const LAYER_ORDER = [
  '.shield-layer',
  '.shadow-shield-layer',
  '.shadow-layer',
  '.stamp-layer',
  '.main-layer'
]; 