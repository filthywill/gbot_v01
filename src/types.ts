// src/types.ts
// Let's define a new type to track both text input and customization state

export interface HistoryState {
  inputText: string;
  options: CustomizationOptions;
}

export type GraffitiStyle = {
  id: string;
  name: string;
  available: boolean;
  description?: string;
};

export interface ProcessedSvg {
  svg: string;
  width: number;
  height: number;
  bounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  pixelData: boolean[][];
  verticalPixelRanges: { top: number; bottom: number; density: number }[];
  scale: number;
  letter: string;
  isSpace?: boolean;
  rotation?: number;
}

export interface LetterPair {
  prev: string;
  current: string;
}

export interface OverlapRule {
  minOverlap: number;
  maxOverlap: number;
  specialCases?: Record<string, number>;
}

export interface SvgCacheItem {
  svg: ProcessedSvg;
  timestamp: number;
}

export interface CustomizationOptions {
  backgroundEnabled: boolean;
  backgroundColor: string;
  fillEnabled: boolean;
  fillColor: string;
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowOpacity: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  // Stamp effect options
  stampEnabled: boolean;
  stampColor: string;
  stampWidth: number;
  // Shine effect option
  shineEnabled: boolean;
  shineColor: string;      
  shineOpacity: number;    
  // Shadow effect options
  shadowEffectEnabled: boolean;
  shadowEffectOffsetX: number;
  shadowEffectOffsetY: number;
  // Shield effect options
  shieldEnabled: boolean;
  shieldColor: string;
  shieldWidth: number;
  // Rendering flags (internal use)
  shadowShieldOnly?: boolean;
  shadowOnly?: boolean;
  contentOnly?: boolean;
  
  // Special flag for history management - skips adding to history when true
  __skipHistory?: boolean;
}