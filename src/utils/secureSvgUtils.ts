import { CustomizationOptions } from '../types';
import { customizeSvg as baseCustomizeSvg, createStampSvg as baseCreateStampSvg } from './svgCustomizationUtils';
import { sanitizeSvg, validateSvg } from '../lib/svgSecurity';
import logger from '../lib/logger';

/**
 * Securely process and customize SVG content
 */
export const secureCustomizeSvg = (
  svgString: string,
  isSpace: boolean | undefined,
  options: CustomizationOptions
): string => {
  try {
    // First validate the SVG
    if (!validateSvg(svgString)) {
      logger.error('Invalid SVG content detected');
      throw new Error('Invalid SVG content');
    }

    // Sanitize the SVG
    const sanitizedSvg = sanitizeSvg(svgString);

    // Apply customizations to the sanitized SVG
    return baseCustomizeSvg(sanitizedSvg, isSpace, options);
  } catch (error) {
    logger.error('Error in secure SVG customization:', error);
    // Return a safe fallback SVG
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"></svg>`;
  }
};

/**
 * Securely process and create stamp SVG
 */
export const secureCreateStampSvg = (
  svgString: string,
  isSpace: boolean | undefined,
  options: CustomizationOptions
): string => {
  try {
    // First validate the SVG
    if (!validateSvg(svgString)) {
      logger.error('Invalid SVG content detected');
      throw new Error('Invalid SVG content');
    }

    // Sanitize the SVG
    const sanitizedSvg = sanitizeSvg(svgString);

    // Create stamp from the sanitized SVG
    return baseCreateStampSvg(sanitizedSvg, isSpace, options);
  } catch (error) {
    logger.error('Error in secure SVG stamp creation:', error);
    // Return a safe fallback SVG
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"></svg>`;
  }
};

/**
 * Validate SVG dimensions and structure
 */
export const validateSvgDimensions = (svgString: string): boolean => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.documentElement;

    // Check for basic SVG properties
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');
    const viewBox = svg.getAttribute('viewBox');

    if (!width || !height || !viewBox) {
      logger.warn('SVG missing required dimensions');
      return false;
    }

    // Validate viewBox format
    const viewBoxValues = viewBox.split(' ').map(Number);
    if (viewBoxValues.length !== 4 || viewBoxValues.some(isNaN)) {
      logger.warn('Invalid SVG viewBox format');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error validating SVG dimensions:', error);
    return false;
  }
}; 