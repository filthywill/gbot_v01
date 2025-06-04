// src/components/GraffitiDisplay/GraffitiContent.tsx
import React, { useMemo, useRef, useLayoutEffect, useState, useEffect, useCallback } from 'react';
import { ProcessedSvg, CustomizationOptions } from '../../types';
import { useGraffitiScaling } from './hooks/useGraffitiScaling';
import { MemoizedGraffitiLayers } from './MemoizedGraffitiLayers';
import '../../styles/graffitiContent.css';
import { useGraffitiExport } from './hooks/useGraffitiExport';
import ExportControls from './ExportControls';

interface GraffitiContentProps {
  processedSvgs: ProcessedSvg[];
  positions: number[];
  contentWidth: number;
  contentHeight: number;
  containerScale: number;
  customizationOptions: CustomizationOptions;
  inputText?: string;
}

// Simplified component with better performance
const GraffitiContent: React.FC<GraffitiContentProps> = ({
  processedSvgs,
  positions,
  contentWidth,
  contentHeight,
  containerScale,
  customizationOptions,
  inputText = ''
}) => {
  // Use a ref to track previous SVGs for optimization
  const prevSvgsRef = useRef<ProcessedSvg[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // State for animation control
  const [isReady, setIsReady] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Apply an additional scaling factor to make content smaller
  // Adjust this value to fine-tune the overall size (0.9 = 90% of original size)
  const additionalScaleFactor = 0.9;
  
  // Extract only the options needed for scaling calculations to minimize dependency array
  const { 
    shadowEffectEnabled, 
    shadowEffectOffsetX, 
    shadowEffectOffsetY,
    stampEnabled,
    stampWidth,
    shieldEnabled,
    shieldWidth,
    backgroundColor,
    backgroundEnabled
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
  
  // Use our export hook for export functionality
  const { 
    isExporting, 
    saveAsSvg, 
    saveAsPng, 
    copyToPngClipboard,
    shareImage 
  } = useGraffitiExport({
    processedSvgs,
    contentRef,
    containerRef,
    contentWidth,
    contentHeight,
    scaleFactor,
    additionalScaleFactor,
    customizationOptions,
    inputText
  });
  
  // Add keyframe animation for the cascading effect
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Create a style element for our keyframe animation if it doesn't exist
    if (!document.getElementById('letter-animation-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'letter-animation-style';
      
      // Different animation timing for mobile vs desktop
      const mobileKeyframes = `
        @keyframes letterPopIn {
          0% { transform: scale(0.7); opacity: 1; }
          40% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes containerFadeIn {
          0% { opacity: 1; }
          100% { opacity: 1; }
        }
      `;
      
      const desktopKeyframes = `
        @keyframes letterPopIn {
          0% { transform: scale(0.7); opacity: 1; }
          30% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes containerFadeIn {
          0% { opacity: 1; }
          100% { opacity: 1; }
        }
      `;
      
      // Use the appropriate keyframes based on device
      styleEl.innerHTML = isMobile ? mobileKeyframes : desktopKeyframes;
      document.head.appendChild(styleEl);
      
      // Clean up on unmount
      return () => {
        const element = document.getElementById('letter-animation-style');
        if (element) {
          element.parentNode?.removeChild(element);
        }
      };
    }
  }, []);
  
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
        // Use the total animation duration (base + delay per letter)
        const totalDuration = 800 + (processedSvgs.length * 20);
        setTimeout(() => {
          setIsAnimating(false);
        }, totalDuration);
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
    
    // Calculate the final scale with the additional factor
    const finalScale = scaleFactor * additionalScaleFactor;
    
    // Apply container animation
    if (isAnimating) {
      return {
        ...baseStyle,
        animation: 'containerFadeIn 0.3s ease-out forwards',
        transform: `translate(-50%, -50%) scale(${finalScale})`,
      };
    } else {
      return {
        ...baseStyle,
        transform: `translate(-50%, -50%) scale(${finalScale})`,
        transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
      };
    }
  }, [contentWidth, contentHeight, scaleFactor, isReady, isAnimating, additionalScaleFactor]);
  
  // Skip rendering if no SVGs to display
  if (processedSvgs.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      />
    );
  }
  
  return (
    <div
      ref={containerRef}
      className="graffiti-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'visible'
      }}
    >
      {/* Export Controls */}
      <ExportControls
        onCopyToPngClipboard={copyToPngClipboard}
        onSaveAsSvg={saveAsSvg}
        isExporting={isExporting}
        showAllButtons={true}
      />
      
      <div ref={contentRef} className="graffiti-content" style={transformStyle}>
        <MemoizedGraffitiLayers 
          processedSvgs={processedSvgs}
          positions={positions}
          customizationOptions={customizationOptions}
          isAnimating={isAnimating}
        />
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(GraffitiContent);