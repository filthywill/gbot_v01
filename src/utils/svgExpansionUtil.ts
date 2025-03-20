/**
 * Utility for expanding SVG paths outward
 * This provides functions to create the expanded path effect for the STAMP feature
 */

/**
 * Expands an SVG path outward by a given amount
 * @param svgString The original SVG string
 * @param expansionAmount The amount to expand paths outward (equivalent to previous stroke width)
 * @param fillColor The color to fill the expanded paths
 * @param isSpace Whether this is a space character (to skip processing)
 * @returns Modified SVG string with expanded paths
 */
export const expandSvgPaths = (
    svgString: string,
    expansionAmount: number,
    fillColor: string,
    isSpace: boolean | undefined
  ): string => {
    // For space characters, just return the empty SVG - no customization needed
    if (isSpace) {
      return svgString;
    }
    
    // Try parsing the SVG
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        console.warn('SVG parsing error:', parserError.textContent);
        return svgString; // Return original if parsing fails
      }
      
      // Get SVG element and ensure overflow is visible
      const svgElement = doc.documentElement;
      svgElement.setAttribute('overflow', 'visible');
      
      // Process all paths
      const paths = doc.querySelectorAll('path');
      paths.forEach(path => {
        // Skip shadow and shine layers - we'll handle those separately
        if (path.classList.contains('shine-effect') || path.classList.contains('shadow-effect')) {
          return;
        }
        
        // Instead of applying a stroke, expand the path via `filter`
        // Create a unique filter ID
        const filterId = `expand-${Math.random().toString(36).substring(2, 9)}`;
        
        // Create the filter element
        const filter = doc.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', filterId);
        filter.setAttribute('x', '-50%');
        filter.setAttribute('y', '-50%');
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');
        
        // Create the morphology operator for expansion
        const morphology = doc.createElementNS('http://www.w3.org/2000/svg', 'feMorphology');
        morphology.setAttribute('operator', 'dilate');
        morphology.setAttribute('radius', (expansionAmount / 15).toString()); // Adjust divisor as needed for appropriate scaling
        morphology.setAttribute('in', 'SourceAlpha');
        morphology.setAttribute('result', 'expanded');
        
        // Add the operator to the filter
        filter.appendChild(morphology);
        
        // Add the filter to the SVG's defs
        let defs = doc.querySelector('defs');
        if (!defs) {
          defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
          svgElement.insertBefore(defs, svgElement.firstChild);
        }
        defs.appendChild(filter);
        
        // Apply the filter to the path
        path.setAttribute('filter', `url(#${filterId})`);
        
        // Set fill color
        path.setAttribute('fill', fillColor);
        
        // Remove any existing stroke attributes
        path.removeAttribute('stroke');
        path.removeAttribute('stroke-width');
        path.removeAttribute('stroke-linejoin');
        path.removeAttribute('stroke-linecap');
      });
      
      return new XMLSerializer().serializeToString(doc);
    } catch (error) {
      console.error("Error expanding SVG paths:", error);
      return svgString; // Return original if customization fails
    }
  };
  
  /**
   * Alternative implementation using stroke for the expansion effect
   * but with proper styling to create the appearance of expansion
   */
  export const expandSvgWithStroke = (
    svgString: string,
    expansionAmount: number,
    fillColor: string,
    isSpace: boolean | undefined
  ): string => {
    // For space characters, just return the empty SVG - no customization needed
    if (isSpace) {
      return svgString;
    }
    
    // Try parsing the SVG
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        console.warn('SVG parsing error:', parserError.textContent);
        return svgString; // Return original if parsing fails
      }
      
      // Get SVG element and ensure overflow is visible
      const svgElement = doc.documentElement;
      svgElement.setAttribute('overflow', 'visible');
      
      // Process all paths
      const paths = doc.querySelectorAll('path');
      paths.forEach(path => {
        // Handle shadow and shine layers specially
        if (path.classList.contains('shine-effect')) {
          // Don't expand shine layers
          return;
        }
        
        if (path.classList.contains('shadow-effect')) {
          // For shadow layers, apply the same expansion but keep them hidden
          // They'll be shown and positioned in the main SVG rendering
          path.setAttribute('style', 'display:none');
          path.setAttribute('fill', fillColor);
          path.setAttribute('stroke', fillColor);
          path.setAttribute('stroke-width', expansionAmount.toString());
          path.setAttribute('stroke-linejoin', 'round');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('paint-order', 'stroke fill');
          return;
        }
        
        // Apply fill color to both fill and stroke (visually expands the path)
        path.setAttribute('fill', fillColor);
        path.setAttribute('stroke', fillColor);
        path.setAttribute('stroke-width', expansionAmount.toString());
        
        // Important: this makes the stroke appear on both sides of the path
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        
        // Critical: This puts the stroke behind the fill, creating the appearance
        // of an expanded path rather than an outlined one
        path.setAttribute('paint-order', 'stroke fill');
      });
      
      return new XMLSerializer().serializeToString(doc);
    } catch (error) {
      console.error("Error expanding SVG with stroke:", error);
      return svgString; // Return original if customization fails
    }
  };