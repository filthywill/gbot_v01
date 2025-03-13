// src/components/GraffitiDisplay/MemoizedGraffitiLayers.tsx
import React from 'react';
import { ProcessedSvg, CustomizationOptions } from '../../types';
import GraffitiLayers from './GraffitiLayers';

// Improved shallow comparison function
export const shallowEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => {
    // For arrays (like processedSvgs), compare more carefully
    if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
      if (obj1[key].length !== obj2[key].length) return false;
      
      // For arrays of objects with an id/key property, check that
      if (obj1[key].length > 0 && typeof obj1[key][0] === 'object') {
        return obj1[key].every((item: any, i: number) => 
          item === obj2[key][i] || 
          (item.letter && obj2[key][i].letter && item.letter === obj2[key][i].letter)
        );
      }
      
      // For primitive arrays, do direct comparison
      return obj1[key].every((item: any, i: number) => item === obj2[key][i]);
    }
    
    return obj1[key] === obj2[key];
  });
};

interface GraffitiLayersProps {
  processedSvgs: ProcessedSvg[];
  positions: number[];
  customizationOptions: CustomizationOptions;
}

// Create memoized version of GraffitiLayers with improved comparison
export const MemoizedGraffitiLayers = React.memo(
  GraffitiLayers, 
  (prevProps: GraffitiLayersProps, nextProps: GraffitiLayersProps) => {
    // Compare array lengths first
    if (prevProps.processedSvgs.length !== nextProps.processedSvgs.length) {
      console.log('Rerendering due to different number of SVGs');
      return false;
    }
    
    // Compare positions array length
    if (prevProps.positions.length !== nextProps.positions.length) {
      console.log('Rerendering due to different number of positions');
      return false;
    }
    
    // Compare actual letters
    const prevLetters = prevProps.processedSvgs.map(svg => svg.letter).join('');
    const nextLetters = nextProps.processedSvgs.map(svg => svg.letter).join('');
    if (prevLetters !== nextLetters) {
      console.log(`Rerendering due to different letters: prev=${prevLetters}, next=${nextLetters}`);
      return false;
    }
    
    // Compare positions - use some tolerance to avoid float precision issues
    const positionsChanged = prevProps.positions.some((pos, i) => 
      Math.abs(pos - nextProps.positions[i]) > 0.1
    );
    if (positionsChanged) {
      console.log('Rerendering due to position changes');
      return false;
    }
    
    // Compare relevant customization options
    const relevantPrevOptions = extractRelevantOptions(prevProps.customizationOptions);
    const relevantNextOptions = extractRelevantOptions(nextProps.customizationOptions);
    
    if (!shallowEqual(relevantPrevOptions, relevantNextOptions)) {
      console.log('Rerendering due to customization option changes');
      return false;
    }
    
    // No significant changes detected, skip re-render
    return true;
  }
);

// Extract only the options that actually affect rendering
function extractRelevantOptions(options: CustomizationOptions) {
  return {
    fillEnabled: options.fillEnabled,
    fillColor: options.fillColor,
    stampEnabled: options.stampEnabled,
    stampColor: options.stampColor,
    stampWidth: options.stampWidth,
    shieldEnabled: options.shieldEnabled,
    shieldColor: options.shieldColor,
    shieldWidth: options.shieldWidth,
    shadowEffectEnabled: options.shadowEffectEnabled,
    shadowEffectOffsetX: options.shadowEffectOffsetX,
    shadowEffectOffsetY: options.shadowEffectOffsetY,
    shineEnabled: options.shineEnabled,
    shineColor: options.shineColor,
    shineOpacity: options.shineOpacity,
    strokeEnabled: options.strokeEnabled,
    strokeColor: options.strokeColor,
    strokeWidth: options.strokeWidth
  };
}