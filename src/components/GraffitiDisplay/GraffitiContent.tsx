// src/components/GraffitiDisplay/GraffitiContent.tsx
import React, { useMemo, useRef, useLayoutEffect, useState, useEffect } from 'react';
import { ProcessedSvg, CustomizationOptions } from '../../types';
import { useGraffitiScaling } from './hooks/useGraffitiScaling';
import { MemoizedGraffitiLayers } from './MemoizedGraffitiLayers';

interface GraffitiContentProps {
  processedSvgs: ProcessedSvg[];
  positions: number[];
  contentWidth: number;
  contentHeight: number;
  containerScale: number;
  customizationOptions: CustomizationOptions;
}

// Simplified component with better performance
const GraffitiContent: React.FC<GraffitiContentProps> = ({
  processedSvgs,
  positions,
  contentWidth,
  contentHeight,
  containerScale,
  customizationOptions
}) => {
  // Use a ref to track previous SVGs for optimization
  const prevSvgsRef = useRef<ProcessedSvg[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // State for animation control
  const [isReady, setIsReady] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Extract only the options needed for scaling calculations to minimize dependency array
  const { 
    shadowEffectEnabled, 
    shadowEffectOffsetX, 
    shadowEffectOffsetY,
    stampEnabled,
    stampWidth,
    shieldEnabled,
    shieldWidth
  } = customizationOptions;
  
  // This hook handles measuring container and calculating scale
  const { containerRef, scaleFactor } = useGraffitiScaling(
    processedSvgs, 
    contentWidth, 
    contentHeight, 
    containerScale, 
    {
      shadowEffectEnabled,
      shadowEffectOffsetX,
      shadowEffectOffsetY,
      stampEnabled,
      stampWidth,
      shieldEnabled,
      shieldWidth
    }
  );
  
  // Add keyframe animation for the pop effect
  useEffect(() => {
    // Create a style element for our keyframe animation if it doesn't exist
    if (!document.getElementById('pop-animation-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'pop-animation-style';
      styleEl.innerHTML = `
        @keyframes popIn {
          0% { transform: translate(-50%, -50%) scale(${scaleFactor}); opacity: 1; }
          10% { transform: translate(-50%, -50%) scale(${scaleFactor * 1.05}); opacity: 1; }
          30% { transform: translate(-50%, -50%) scale(${scaleFactor * 1.03}); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(${scaleFactor}); opacity: 1; }
        }
      `;
      document.head.appendChild(styleEl);
      
      // Clean up on unmount
      return () => {
        const element = document.getElementById('pop-animation-style');
        if (element) {
          element.parentNode?.removeChild(element);
        }
      };
    }
  }, [scaleFactor]);
  
  // Simplified transition handling
  useLayoutEffect(() => {
    // Skip if no content
    if (processedSvgs.length === 0) {
      setIsReady(false);
      setIsAnimating(false);
      return;
    }
    
    // Check if content has changed significantly
    const contentChanged = 
      processedSvgs.length !== prevSvgsRef.current.length || 
      JSON.stringify(processedSvgs.map(svg => svg.letter)) !== 
      JSON.stringify(prevSvgsRef.current.map(svg => svg.letter));
    
    if (contentChanged) {
      // Update ref for next comparison
      prevSvgsRef.current = processedSvgs;
      
      // Prepare for animation
      setIsReady(false);
      setIsAnimating(false);
      
      // Use a single RAF for better performance
      requestAnimationFrame(() => {
        setIsReady(true);
        setIsAnimating(true);
        
        // Reset animation state after animation completes
        setTimeout(() => {
          setIsAnimating(false);
        }, 800); // Animation duration
      });
    } else if (!isReady) {
      // Content hasn't changed but we need to show it (e.g. after initial mount)
      setIsReady(true);
    }
  }, [processedSvgs, isReady]);
  
  // Memoize the transform style to prevent unnecessary calculations
  const transformStyle = useMemo(() => {
    const baseStyle = {
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      width: `${contentWidth}px`,
      height: `${contentHeight}px`,
      transformOrigin: 'center center',
      overflow: 'visible' as const,
      opacity: isReady ? 1 : 0,
      // Hardware acceleration hints
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
    };
    
    // Apply pop animation when content changes
    if (isAnimating) {
      return {
        ...baseStyle,
        animation: 'popIn 0.4s ease-out forwards',
      };
    } else {
      return {
        ...baseStyle,
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
      };
    }
  }, [contentWidth, contentHeight, scaleFactor, isReady, isAnimating]);
  
  // Skip rendering if no SVGs to display
  if (processedSvgs.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
          overflow: 'visible'
        }}
      />
    );
  }
  
  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
        overflow: 'visible'
      }}
    >
      <div ref={contentRef} style={transformStyle}>
        <MemoizedGraffitiLayers 
          processedSvgs={processedSvgs}
          positions={positions}
          customizationOptions={customizationOptions}
        />
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(GraffitiContent);