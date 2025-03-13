// src/utils/svgCustomizationUtils.ts
import { CustomizationOptions } from '../types';

/**
 * Apply customization options to SVG for main content
 * @param svgString The original SVG string
 * @param isSpace Whether this is a space character
 * @param options Customization options to apply
 * @returns Customized SVG string
 */
export const customizeSvg = (svgString: string, isSpace: boolean | undefined, options: CustomizationOptions): string => {
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
    
    // Special handling for shadow shield only
    if (options.shadowShieldOnly) {
      const paths = doc.querySelectorAll('.shadow-effect');
      paths.forEach(path => {
        // Show only shield for shadow
        path.setAttribute('style', 'display:inline');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', options.shieldColor);
        path.setAttribute('stroke-width', (options.stampWidth * 0.5 + options.shieldWidth * 2).toString());
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
      });
      
      // Hide all other paths
      const otherPaths = doc.querySelectorAll('path:not(.shadow-effect)');
      otherPaths.forEach(path => {
        path.setAttribute('style', 'display:none');
      });
      
      return new XMLSerializer().serializeToString(doc);
    }
    
    // Special handling for shadow only
    if (options.shadowOnly) {
      const paths = doc.querySelectorAll('.shadow-effect');
      paths.forEach(path => {
        // Show only shadow
        path.setAttribute('style', 'display:inline');
        path.setAttribute('fill', options.stampColor);
        
        if (options.stampEnabled) {
          path.setAttribute('stroke', options.stampColor);
          path.setAttribute('stroke-width', (options.stampWidth * 0.5).toString());
          path.setAttribute('stroke-linejoin', 'round');
          path.setAttribute('stroke-linecap', 'round');
        } else {
          path.removeAttribute('stroke');
        }
      });
      
      // Hide all other paths
      const otherPaths = doc.querySelectorAll('path:not(.shadow-effect)');
      otherPaths.forEach(path => {
        path.setAttribute('style', 'display:none');
      });
      
      return new XMLSerializer().serializeToString(doc);
    }
    
    // Special handling for content only (no stamp, shield or shadow)
    if (options.contentOnly) {
      // Process regular paths (not shadow or shine)
      const regularPaths = doc.querySelectorAll('path:not(.shadow-effect):not(.shine-effect)');
      regularPaths.forEach(path => {
        // Apply fill color if enabled
        if (options.fillEnabled) {
          path.setAttribute('fill', options.fillColor);
        } else {
          path.setAttribute('fill', '#000000');
        }
        
        // Apply stroke if enabled
        if (options.strokeEnabled) {
          path.setAttribute('stroke', options.strokeColor);
          path.setAttribute('stroke-width', options.strokeWidth.toString());
          path.setAttribute('stroke-linejoin', 'round');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('paint-order', 'stroke fill');
        } else {
          path.removeAttribute('stroke');
        }
      });
      
      // Handle shine layers
      const shineLayers = doc.querySelectorAll('.shine-effect');
      shineLayers.forEach(layer => {
        if (options.shineEnabled) {
          // Make shine visible
          layer.setAttribute('style', 'display:inline');
          layer.setAttribute('fill', options.shineColor);
          layer.setAttribute('fill-opacity', options.shineOpacity.toString());
        } else {
          layer.setAttribute('style', 'display:none');
        }
      });
      
      // Hide shadow layers
      const shadowLayers = doc.querySelectorAll('.shadow-effect');
      shadowLayers.forEach(layer => {
        layer.setAttribute('style', 'display:none');
      });
      
      return new XMLSerializer().serializeToString(doc);
    }
    
    // Regular processing (complete SVG)
    
    // Process all paths
    const paths = doc.querySelectorAll('path');
    paths.forEach(path => {
      // Skip shadow and shine layers - we'll handle those separately
      if (path.classList.contains('shine-effect') || path.classList.contains('shadow-effect')) {
        return;
      }
      
      // Apply fill color if enabled
      if (options.fillEnabled) {
        path.setAttribute('fill', options.fillColor);
      } else {
        path.setAttribute('fill', '#000000');
      }
      
      // Apply stroke if enabled
      if (options.strokeEnabled) {
        path.setAttribute('stroke', options.strokeColor);
        path.setAttribute('stroke-width', options.strokeWidth.toString());
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        // This is the key - puts stroke behind the fill
        path.setAttribute('paint-order', 'stroke fill');
      } else {
        path.removeAttribute('stroke');
        path.removeAttribute('stroke-width');
        path.removeAttribute('stroke-linejoin');
        path.removeAttribute('stroke-linecap');
        path.removeAttribute('paint-order');
      }
    });
    
    // Handle shine layers
    const shineLayers = doc.querySelectorAll('.shine-effect');
    shineLayers.forEach(layer => {
      if (options.shineEnabled) {
        // Make shine visible
        layer.setAttribute('style', 'display:inline');
        
        // Apply user-selected color and opacity
        layer.setAttribute('fill', options.shineColor);
        layer.setAttribute('fill-opacity', options.shineOpacity.toString());
      } else {
        layer.setAttribute('style', 'display:none');
      }
    });
    
    // Handle shadow effect layers
    const shadowLayers = doc.querySelectorAll('.shadow-effect');
    shadowLayers.forEach(layer => {
      if (options.shadowEffectEnabled) {
        // Make shadow visible
        layer.setAttribute('style', 'display:inline');
        
        // Use the STAMP color for shadow fill
        layer.setAttribute('fill', options.stampColor);
        
        // Apply STAMP stroke if STAMP is enabled
        if (options.stampEnabled) {
          layer.setAttribute('stroke', options.stampColor);
          layer.setAttribute('stroke-width', (options.stampWidth * 0.5).toString());
          layer.setAttribute('stroke-linejoin', 'round');
          layer.setAttribute('stroke-linecap', 'round'); // FIX: Added "layer." prefix
        } else {
          // If STAMP is disabled, remove stroke
          layer.removeAttribute('stroke');
          layer.removeAttribute('stroke-width');
        }
      } else {
        // Hide shadow if disabled
        layer.setAttribute('style', 'display:none');
      }
    });
    
    return new XMLSerializer().serializeToString(doc);
  } catch (error) {
    console.error("Error customizing SVG:", error);
    return svgString; // Return original if customization fails
  }
};

/**
 * Creates SVG for the STAMP effect layer
 * @param svgString The original SVG string
 * @param isSpace Whether this is a space character
 * @param options Customization options to apply
 * @returns SVG string with stamp/shield effects
 */
export const createStampSvg = (svgString: string, isSpace: boolean | undefined, options: CustomizationOptions): string => {
  // For spaces or when both STAMP and SHIELD are disabled, return empty SVG
  if (isSpace || (!options.stampEnabled && !options.shieldEnabled)) {
    return '<svg></svg>'; // Empty SVG
  }
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return '<svg></svg>';
    }
    
    const svgElement = doc.documentElement;
    svgElement.setAttribute('overflow', 'visible');
    
    // Remove any shadow-effect paths, as they'll be rendered separately
    const shadowPaths = doc.querySelectorAll('.shadow-effect');
    shadowPaths.forEach(path => {
      path.parentNode?.removeChild(path);
    });
    
    // Remove any shine-effect paths, as they'll be rendered separately
    const shinePaths = doc.querySelectorAll('.shine-effect');
    shinePaths.forEach(path => {
      path.parentNode?.removeChild(path);
    });
    
    // Process all remaining paths for the stamp/shield effects
    const paths = doc.querySelectorAll('path');
    
    // If we're only rendering the SHIELD (no STAMP)
    if (options.shieldEnabled && !options.stampEnabled) {
      paths.forEach(path => {
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', options.shieldColor);
        path.setAttribute('stroke-width', options.shieldWidth.toString());
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
      });
      
      return new XMLSerializer().serializeToString(doc);
    }
    
    // If we're only rendering the STAMP (no SHIELD)
    if (!options.shieldEnabled && options.stampEnabled) {
      paths.forEach(path => {
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', options.stampColor);
        path.setAttribute('stroke-width', options.stampWidth.toString());
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
      });
      
      return new XMLSerializer().serializeToString(doc);
    }
    
    // If we're rendering both SHIELD and STAMP
    // Create a group for shield paths (bottommost layer)
    const shieldGroup = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    shieldGroup.setAttribute('id', 'stamp-shield-group');
    
    // Create a group for stamp paths (above shield)
    const stampGroup = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    stampGroup.setAttribute('id', 'stamp-group');
    
    // Add groups to SVG in proper order
    svgElement.appendChild(shieldGroup);
    svgElement.appendChild(stampGroup);
    
    // Create and add shield paths
    paths.forEach(path => {
      // Skip any non-standard paths
      if (path.classList.contains('shine-effect') || path.classList.contains('shadow-effect')) {
        return;
      }
      
      // Create shield path
      const shieldPath = path.cloneNode(true) as SVGPathElement;
      shieldPath.setAttribute('fill', 'none');
      shieldPath.setAttribute('stroke', options.shieldColor);
      shieldPath.setAttribute('stroke-width', (options.stampWidth + options.shieldWidth * 2).toString());
      shieldPath.setAttribute('stroke-linejoin', 'round');
      shieldPath.setAttribute('stroke-linecap', 'round');
      
      // Add to shield group
      shieldGroup.appendChild(shieldPath);
      
      // Create stamp path (only if STAMP is enabled)
      if (options.stampEnabled) {
        const stampPath = path.cloneNode(true) as SVGPathElement;
        stampPath.setAttribute('fill', 'none');
        stampPath.setAttribute('stroke', options.stampColor);
        stampPath.setAttribute('stroke-width', options.stampWidth.toString());
        stampPath.setAttribute('stroke-linejoin', 'round');
        stampPath.setAttribute('stroke-linecap', 'round');
        
        // Add to stamp group
        stampGroup.appendChild(stampPath);
      }
      
      // Remove original path
      if (path.parentNode) {
        path.parentNode.removeChild(path);
      }
    });
    
    return new XMLSerializer().serializeToString(doc);
  } catch (error) {
    console.error("Error creating stamp/shield SVG:", error);
    return '<svg></svg>';
  }
};