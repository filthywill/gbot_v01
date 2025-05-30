// src/components/GraffitiDisplay/GraffitiLayers.tsx
import React, { useEffect } from 'react';
import { ProcessedSvg, CustomizationOptions } from '../../types';
import { secureCustomizeSvg, secureCreateStampSvg } from '../../utils/secureSvgUtils';
import logger from '../../lib/logger';

interface GraffitiLayersProps {
  processedSvgs: ProcessedSvg[];
  positions: number[];
  customizationOptions: CustomizationOptions;
  isAnimating?: boolean;
}

const GraffitiLayers: React.FC<GraffitiLayersProps> = ({ 
  processedSvgs, 
  positions, 
  customizationOptions,
  isAnimating = false
}) => {
  // Add debugging to check what's actually in processedSvgs
  useEffect(() => {
    logger.debug('GraffitiLayers received:', {
      svgCount: processedSvgs.length,
      letterSample: processedSvgs.map(svg => svg.letter).join(''),
      firstSvg: processedSvgs[0]?.letter,
      isAnimating
    });
  }, [processedSvgs, isAnimating]);

  // Early return if no processed SVGs
  if (processedSvgs.length === 0) return null;
  
  // Create arrays for each layer type
  const shieldElements: JSX.Element[] = [];
  const shadowShieldElements: JSX.Element[] = [];
  const shadowElements: JSX.Element[] = [];
  const stampElements: JSX.Element[] = [];
  const mainElements: JSX.Element[] = [];
  
  // Detect if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Calculate animation delay per letter - adjust for mobile
  const ANIMATION_DELAY_PER_LETTER = isMobile ? 40 : 20; // milliseconds - longer delay on mobile
  const ANIMATION_DURATION = isMobile ? 400 : 300; // milliseconds - longer duration on mobile
  
  // Process all SVGs in a single pass
  processedSvgs.forEach((item, index) => {
    // Log each item's letter for debugging
    logger.debug(`Processing SVG ${index}: letter="${item.letter}", isSpace=${item.isSpace}`);
    
    // Calculate animation delay for this letter
    const animationDelay = index * ANIMATION_DELAY_PER_LETTER;
    
    // Create animation style for this letter
    const animationStyle = isAnimating ? {
      animation: `letterPopIn ${ANIMATION_DURATION}ms ease-out forwards`,
      animationDelay: `${animationDelay}ms`,
      opacity: 0, // Start invisible
    } : {};
    
    // Skip processing spaces for most effects
    if (!item.isSpace) {
      // 1. Shield layer
      if (customizationOptions.shieldEnabled) {
        const shieldOptions = {
          ...customizationOptions,
          // We'll handle shadow effect separately to prevent duplicates
          shadowEffectEnabled: false
        };
        
        shieldElements.push(
          <div
            key={`shield-${index}`}
            className="animate-hardware svg-layer shield-layer"
            style={{
              position: 'absolute',
              left: `${positions[index]}px`,
              top: 0,
              width: '200px',
              height: '200px',
              zIndex: 1, // Lowest z-index for shield
              transform: `scale(${item.scale})`,
              transformOrigin: 'center center',
              overflow: 'visible',
              ...animationStyle
            }}
            dangerouslySetInnerHTML={{ 
              __html: secureCreateStampSvg(item.svg, item.isSpace, shieldOptions) 
            }}
          />
        );
      }
      
      // 2. Shadow shield layer
      if (customizationOptions.shadowEffectEnabled && customizationOptions.shieldEnabled) {
        const shadowShieldOptions = {
          ...customizationOptions,
          shieldEnabled: true,
          // Only render the shadow shield, no other effects
          stampEnabled: false, 
          shadowShieldOnly: true
        };
        
        // Create a wrapper div for the shadow shield to handle animation separately from offset
        shadowShieldElements.push(
          <div
            key={`shadow-shield-wrapper-${index}`}
            className="animate-hardware svg-layer shadow-shield-layer"
            style={{
              position: 'absolute',
              left: `${positions[index]}px`,
              top: 0,
              width: '200px',
              height: '200px',
              zIndex: 2, // z-index for shadow shield
              transform: `translate(${customizationOptions.shadowEffectOffsetX}px, ${customizationOptions.shadowEffectOffsetY}px)`,
              overflow: 'visible',
            }}
          >
            <div
              className="svg-content"
              style={{
                width: '100%',
                height: '100%',
                transform: `scale(${item.scale})`,
                transformOrigin: 'center center',
                ...animationStyle
              }}
              dangerouslySetInnerHTML={{ 
                __html: secureCustomizeSvg(item.svg, item.isSpace, shadowShieldOptions) 
              }}
            />
          </div>
        );
      }
      
      // 3. Shadow layer
      if (customizationOptions.shadowEffectEnabled) {
        const shadowOptions = {
          ...customizationOptions,
          shieldEnabled: false, // No shield for shadow
          shadowOnly: true
        };
        
        // Create a wrapper div for the shadow to handle animation separately from offset
        shadowElements.push(
          <div
            key={`shadow-wrapper-${index}`}
            className="animate-hardware svg-layer shadow-layer"
            style={{
              position: 'absolute',
              left: `${positions[index]}px`,
              top: 0,
              width: '200px',
              height: '200px',
              zIndex: 3, // z-index for shadow
              transform: `translate(${customizationOptions.shadowEffectOffsetX}px, ${customizationOptions.shadowEffectOffsetY}px)`,
              overflow: 'visible',
            }}
          >
            <div
              className="svg-content"
              style={{
                width: '100%',
                height: '100%',
                transform: `scale(${item.scale})`,
                transformOrigin: 'center center',
                ...animationStyle
              }}
              dangerouslySetInnerHTML={{ 
                __html: secureCustomizeSvg(item.svg, item.isSpace, shadowOptions) 
              }}
            />
          </div>
        );
      }
      
      // 4. Stamp outline layer
      if (customizationOptions.stampEnabled) {
        const stampOnlyOptions = {
          ...customizationOptions,
          shieldEnabled: false,
          shadowEffectEnabled: false
        };
        
        stampElements.push(
          <div
            key={`stamp-${index}`}
            className="animate-hardware svg-layer stamp-layer"
            style={{
              position: 'absolute',
              left: `${positions[index]}px`,
              top: 0,
              width: '200px',
              height: '200px',
              zIndex: 4, // z-index for stamp
              transform: `scale(${item.scale})`,
              transformOrigin: 'center center',
              overflow: 'visible',
              ...animationStyle
            }}
            dangerouslySetInnerHTML={{ 
              __html: secureCreateStampSvg(item.svg, item.isSpace, stampOnlyOptions) 
            }}
          />
        );
      }
      
      // 5. Main content layer
      const mainOptions = {
        ...customizationOptions,
        contentOnly: true
      };
      
      mainElements.push(
        <div
          key={`main-${index}`}
          className="animate-hardware svg-layer main-layer"
          style={{
            position: 'absolute',
            left: `${positions[index]}px`,
            top: 0,
            width: '200px',
            height: '200px',
            zIndex: 5, // Highest z-index for main content
            transform: `scale(${item.scale})`,
            transformOrigin: 'center center',
            overflow: 'visible',
            ...animationStyle
          }}
          dangerouslySetInnerHTML={{ 
            __html: secureCustomizeSvg(item.svg, item.isSpace, mainOptions) 
          }}
        />
      );
    }
  });
  
  // Return all layers in correct order
  return (
    <>
      {shieldElements}
      {shadowShieldElements}
      {shadowElements}
      {stampElements}
      {mainElements}
    </>
  );
};

export default GraffitiLayers;