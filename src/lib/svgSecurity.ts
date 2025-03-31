import logger from './logger';

// List of allowed SVG elements
const ALLOWED_ELEMENTS = new Set([
  'svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 
  'polygon', 'g', 'defs', 'title', 'desc', 'text'
]);

// List of allowed SVG attributes
const ALLOWED_ATTRIBUTES = new Set([
  // Core attributes
  'id', 'class', 'style', 'transform',
  // Presentation attributes
  'fill', 'stroke', 'stroke-width', 'opacity',
  // Dimensional attributes
  'x', 'y', 'width', 'height', 'viewBox', 'preserveAspectRatio',
  // Path attributes
  'd', 'pathLength',
  // Other common attributes
  'cx', 'cy', 'r', 'rx', 'rx', 'points'
]);

// Regex patterns for potentially malicious content
const SECURITY_PATTERNS = {
  scriptTags: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  eventHandlers: /\bon\w+\s*=/gi,
  dataUrls: /data:[^;]*;base64/gi,
  foreignObjects: /<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi,
  externalRefs: /url\s*\(\s*['"]*(?!#)[^)]+['"]*\s*\)/gi
};

interface SanitizeOptions {
  removeUnknownElements?: boolean;
  removeUnknownAttributes?: boolean;
  removeComments?: boolean;
  allowedElements?: Set<string>;
  allowedAttributes?: Set<string>;
}

/**
 * Sanitize SVG content to prevent XSS and other security issues
 */
export const sanitizeSvg = (
  svgContent: string, 
  options: SanitizeOptions = {}
): string => {
  try {
    const {
      removeUnknownElements = true,
      removeUnknownAttributes = true,
      removeComments = true,
      allowedElements = ALLOWED_ELEMENTS,
      allowedAttributes = ALLOWED_ATTRIBUTES
    } = options;

    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');

    // Remove potentially malicious content
    Object.entries(SECURITY_PATTERNS).forEach(([key, pattern]) => {
      const matches = svgContent.match(pattern);
      if (matches) {
        logger.warn(`Removed potentially malicious SVG content: ${key}`, { matches });
        svgContent = svgContent.replace(pattern, '');
      }
    });

    // Remove comments if specified
    if (removeComments) {
      const commentIterator = doc.evaluate(
        '//comment()', 
        doc, 
        null, 
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, 
        null
      );
      
      for (let i = 0; i < commentIterator.snapshotLength; i++) {
        const comment = commentIterator.snapshotItem(i);
        if (comment?.parentNode) {
          comment.parentNode.removeChild(comment);
        }
      }
    }

    // Function to clean element attributes
    const cleanElementAttributes = (element: Element) => {
      const attributes = Array.from(element.attributes);
      attributes.forEach(attr => {
        // Remove disallowed attributes
        if (removeUnknownAttributes && !allowedAttributes.has(attr.name)) {
          element.removeAttribute(attr.name);
          logger.debug(`Removed disallowed attribute: ${attr.name}`);
        }
        
        // Clean up style attribute
        if (attr.name === 'style') {
          // Remove potentially dangerous CSS
          const cleanStyle = attr.value.replace(
            /(javascript|expression|calc|url)\s*\(.*?\)/gi, 
            ''
          );
          if (cleanStyle !== attr.value) {
            logger.warn('Removed potentially malicious style content');
            element.setAttribute('style', cleanStyle);
          }
        }
      });
    };

    // Function to recursively clean elements
    const cleanElement = (element: Element) => {
      // Clean current element's attributes
      cleanElementAttributes(element);

      // Process child elements
      Array.from(element.children).forEach(child => {
        if (removeUnknownElements && !allowedElements.has(child.tagName.toLowerCase())) {
          logger.debug(`Removed disallowed element: ${child.tagName}`);
          element.removeChild(child);
        } else {
          cleanElement(child);
        }
      });
    };

    // Clean the SVG element
    const svgElement = doc.getElementsByTagName('svg')[0];
    if (svgElement) {
      cleanElement(svgElement);
    }

    // Serialize back to string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch (error) {
    logger.error('Error sanitizing SVG:', error);
    throw new Error('Failed to sanitize SVG content');
  }
};

/**
 * Validate SVG content before processing
 */
export const validateSvg = (svgContent: string): boolean => {
  try {
    // Check for basic SVG structure
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      logger.warn('Invalid SVG: Missing SVG tags');
      return false;
    }

    // Parse SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');

    // Check for parsing errors
    const parserError = doc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      logger.warn('Invalid SVG: Parser error', { error: parserError[0].textContent });
      return false;
    }

    // Validate root element
    const svgElement = doc.getElementsByTagName('svg')[0];
    if (!svgElement) {
      logger.warn('Invalid SVG: No SVG element found');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error validating SVG:', error);
    return false;
  }
}; 