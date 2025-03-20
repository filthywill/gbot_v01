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
  
  // We're not using these options anymore since we simplified the scaling calculation
  // But we keep the parameter for API compatibility
  
  // Update dimensions when container resizes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        // Get the container dimensions
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        // Calculate available space with a small margin for padding
        // Increase the margin to make content smaller (e.g., 0.9 = 90% of container)
        const availableWidth = containerWidth * 0.9; // Reduced from 0.95
        const availableHeight = containerHeight * 0.9; // Reduced from 0.95
        
        // Maintain aspect ratio while maximizing available space
        const aspectRatio = 16/9;
        
        // Calculate dimensions that fit within the container
        let calculatedWidth = availableWidth;
        let calculatedHeight = calculatedWidth / aspectRatio;
        
        // If height exceeds container, recalculate based on height
        if (calculatedHeight > availableHeight) {
          calculatedHeight = availableHeight;
          calculatedWidth = calculatedHeight * aspectRatio;
        }
        
        setDisplayDimensions({
          width: calculatedWidth,
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
  
  // Calculate scale factor with improved mobile responsiveness
  const scaleFactor = useMemo(() => {
    if (contentWidth === 0 || contentHeight === 0 || displayDimensions.width === 0) {
      return containerScale;
    }
    
    // Calculate basic scale factors
    const widthScale = displayDimensions.width / contentWidth;
    const heightScale = displayDimensions.height / contentHeight;
    
    // Use the smaller scale to ensure content fits
    let baseScale = Math.min(widthScale, heightScale);
    
    // Adjust scale based on letter count for better display
    const letterCount = processedSvgs.filter(svg => !svg.isSpace).length;
    
    // Dynamic scaling coefficient based on letter count and screen size
    // Default value reduced to make output smaller
    let scaleCoefficient = 0.75; // Default reduced from 0.85
    
    // For mobile (smaller width), use more aggressive scaling
    const isMobileView = displayDimensions.width < 500;
    
    if (isMobileView) {
      // More aggressive scaling for mobile - all values reduced
      if (letterCount <= 3) {
        scaleCoefficient = 0.6; // Reduced from 0.85
      } else if (letterCount <= 4) {
        scaleCoefficient = 0.75; // Reduced from 0.8
      } else if (letterCount <= 5) {
        scaleCoefficient = 0.85; // Reduced from 0.8
      } else if (letterCount <= 7) {
        scaleCoefficient = 0.95; // Reduced from 0.8
      } else if (letterCount <= 10) {
        scaleCoefficient = 0.95; // Reduced from 0.75
      } else {
        scaleCoefficient = 1; // Reduced from 0.7
      }
    } else {
      // Standard scaling for larger screens - all values reduced
      if (letterCount <= 3) {
        scaleCoefficient = 0.65; // Reduced from 0.85
      } else if (letterCount <= 4) {
        scaleCoefficient = 0.7;
      } else if (letterCount <= 5) {
        scaleCoefficient = 0.85;
      } else if (letterCount <= 7) {
        scaleCoefficient = 0.9;
      } else if (letterCount <= 10) {
        scaleCoefficient = 0.95; // Reduced from 0.8
      
      } else {
        scaleCoefficient = 0.99; // Reduced from 0.75
      }
    }
    
    // Apply the coefficient to get the final scale
    return baseScale * scaleCoefficient;
  }, [
    contentWidth, 
    contentHeight, 
    displayDimensions.width, 
    displayDimensions.height, 
    containerScale,
    processedSvgs
  ]);
  
  return { displayDimensions, containerRef, scaleFactor };
};