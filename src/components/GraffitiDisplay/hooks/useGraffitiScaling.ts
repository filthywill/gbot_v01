// src/components/GraffitiDisplay/hooks/useGraffitiScaling.ts
import { useState, useRef, useEffect, useMemo } from 'react';
import { ProcessedSvg } from '../../../types';

// Define a minimal interface with only the properties we need for scaling calculations
interface ScalingOptions {
  shadowEffectEnabled: boolean;
  shadowEffectOffsetX: number;
  shadowEffectOffsetY: number;
  stampEnabled: boolean;
  stampWidth: number;
  shieldEnabled: boolean;
  shieldWidth: number;
}

export const useGraffitiScaling = (
  processedSvgs: ProcessedSvg[], 
  contentWidth: number, 
  contentHeight: number, 
  containerScale: number, 
  options: ScalingOptions
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  
  // Extract options to minimize dependency changes
  const { 
    shadowEffectEnabled, 
    shadowEffectOffsetX, 
    shadowEffectOffsetY,
    stampEnabled,
    stampWidth,
    shieldEnabled,
    shieldWidth
  } = options;
  
  // Update dimensions when container resizes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32;
        const aspectRatio = 16/9;
        const calculatedHeight = containerWidth / aspectRatio;
        
        setDisplayDimensions({
          width: containerWidth,
          height: calculatedHeight
        });
      }
    };
    
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Calculate total bounds (including effects)
  const totalBounds = useMemo(() => {
    if (processedSvgs.length === 0 || !shadowEffectEnabled) {
      return {
        width: contentWidth,
        height: contentHeight,
        offsetX: 0,
        offsetY: 0
      };
    }

    // Base content dimensions
    let minX = 0;
    let maxX = contentWidth;
    let minY = 0;
    let maxY = contentHeight;

    // Calculate the extended bounds due to shadow
    if (shadowEffectEnabled) {
      // Shadow extends the bounding box in the direction of the offset
      if (shadowEffectOffsetX < 0) {
        // Shadow extends to the left
        minX += shadowEffectOffsetX;
      } else {
        // Shadow extends to the right
        maxX += shadowEffectOffsetX;
      }

      if (shadowEffectOffsetY < 0) {
        // Shadow extends upward
        minY += shadowEffectOffsetY;
      } else {
        // Shadow extends downward
        maxY += shadowEffectOffsetY;
      }
      
      // Add extra padding for stamp width if shadow has stamp effect
      if (stampEnabled) {
        const stampPadding = stampWidth / 2;
        minX -= stampPadding;
        maxX += stampPadding;
        minY -= stampPadding;
        maxY += stampPadding;
      }
      
      // Add extra padding for shield if used with shadow
      if (shieldEnabled) {
        const shieldPadding = shieldWidth;
        minX -= shieldPadding;
        maxX += shieldPadding;
        minY -= shieldPadding;
        maxY += shieldPadding;
      }
    }
    
    // Add extra padding for stamp effect on base content
    if (stampEnabled) {
      const stampPadding = stampWidth / 2;
      if (minX > -stampPadding) minX = -stampPadding;
      maxX += stampPadding;
      if (minY > -stampPadding) minY = -stampPadding;
      maxY += stampPadding;
    }

    // Add extra padding for shield on base content
    if (shieldEnabled) {
      const shieldPadding = shieldWidth;
      if (minX > -shieldPadding) minX = -shieldPadding;
      maxX += shieldPadding;
      if (minY > -shieldPadding) minY = -shieldPadding;
      maxY += shieldPadding;
    }

    // Calculate total dimensions and offset
    return {
      width: maxX - minX,
      height: maxY - minY,
      offsetX: minX,
      offsetY: minY
    };
  }, [
    contentWidth, 
    contentHeight, 
    shadowEffectEnabled,
    shadowEffectOffsetX,
    shadowEffectOffsetY,
    stampEnabled,
    stampWidth,
    shieldEnabled,
    shieldWidth,
    processedSvgs.length
  ]);
  
  // Calculate scale factor
  const scaleFactor = useMemo(() => {
    if (contentWidth === 0 || contentHeight === 0 || displayDimensions.width === 0) {
      return containerScale;
    }
    
    const widthScale = displayDimensions.width / contentWidth;
    const heightScale = displayDimensions.height / contentHeight;
    
    const letterCount = processedSvgs.filter(svg => !svg.isSpace).length;
    let scaleCoefficient = 0.7;
    
    if (letterCount <= 4) {
      scaleCoefficient = 0.5 + (letterCount * 0.03);
    } else if (letterCount <= 8) {
      scaleCoefficient = 0.7;
    }
    
    return Math.min(widthScale, heightScale) * scaleCoefficient;
  }, [
    contentWidth, 
    contentHeight, 
    displayDimensions.width, 
    displayDimensions.height, 
    containerScale, 
    processedSvgs.length,
    // Count the actual letters, not just total SVGs
    ...processedSvgs.map(svg => svg.isSpace)
  ]);
  
  return { displayDimensions, containerRef, scaleFactor, totalBounds };
};