import { CustomizationOptions } from '../types';

export interface StylePreset {
  id: string;
  name: string;
  settings: CustomizationOptions;
}

// Base settings that all presets extend from
const baseSettings: CustomizationOptions = {
  // Background options
  backgroundEnabled: false,
  backgroundColor: '#ffffff',
  
  // Fill options
  fillEnabled: true,
  fillColor: '#ffffff',
  
  // Stroke options
  strokeEnabled: false,
  strokeColor: '#ff0000',
  strokeWidth: 45,
  
  // Shadow options
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowOpacity: 1,
  shadowOffsetX: -400,
  shadowOffsetY: 5,
  shadowBlur: 0,
  
  // Stamp effect options
  stampEnabled: true,
  stampColor: '#000000',
  stampWidth: 60,
  
  // Shine effect options
  shineEnabled: false,
  shineColor: '#ffffff',
  shineOpacity: 1,
  
  // Shadow effect options
  shadowEffectEnabled: false,
  shadowEffectOffsetX: 0,
  shadowEffectOffsetY: 0,
  
  // Shield effect options
  shieldEnabled: true,
  shieldColor: '#22c0f2',
  shieldWidth: 40
};

// Define all presets in one place
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'CLASSIC',
    name: 'CLASSIC',
    settings: {
      ...baseSettings,
      backgroundEnabled: false,
      fillEnabled: true,
      fillColor: '#ffffff',
      stampEnabled: true,
      stampColor: '#000000',
      stampWidth: 80,
      shineEnabled: false,
      shineColor: '#ffffff',
      shineOpacity: 1,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: 4,
      shadowEffectOffsetY: 8,
      shieldEnabled: true,
      shieldColor: '#22c0f2',
      shieldWidth: 60
    }
  },

  {
    id: 'BW',
    name: 'bw',
    settings: {
      ...baseSettings,
      backgroundEnabled: false,
      backgroundColor: '#ffffff',
      fillEnabled: true,
      fillColor: '#000000',
      strokeEnabled: false,
      strokeColor: '#ff0000',
      strokeWidth: 45,
      shadowEnabled: false,
      shadowColor: '#000000',
      shadowOpacity: 1,
      shadowOffsetX: -400,
      shadowOffsetY: 5,
      shadowBlur: 0,
      stampEnabled: true,
      stampColor: '#ffffff',
      stampWidth: 80,
      shineEnabled: false,
      shineColor: '#ffffff',
      shineOpacity: 1,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: 4,
      shadowEffectOffsetY: 8,
      shieldEnabled: true,
      shieldColor: '#000000',
      shieldWidth: 60,
    }
  },

  {
    id: 'REDECHO',
    name: 'redecho',
    settings: {
      ...baseSettings,
      backgroundEnabled: true,
      backgroundColor: '#ffeec8',
      fillEnabled: true,
      fillColor: '#e50000',
      strokeEnabled: false,
      strokeColor: '#ff0000',
      strokeWidth: 45,
      shadowEnabled: false,
      shadowColor: '#000000',
      shadowOpacity: 1,
      shadowOffsetX: -400,
      shadowOffsetY: 5,
      shadowBlur: 0,
      stampEnabled: true,
      stampColor: '#ffb300',
      stampWidth: 150,
      shineEnabled: false,
      shineColor: '#ffffff',
      shineOpacity: 1,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: 17,
      shadowEffectOffsetY: 0,
      shieldEnabled: true,
      shieldColor: '#ffd064',
      shieldWidth: 80,
    }
  },

  {
    id: 'SLAP',
    name: 'SLAP',
    settings: {
      ...baseSettings,
      backgroundEnabled: true,
      backgroundColor: '#f00000',
      fillEnabled: true,
      fillColor: '#ffffff',
      stampEnabled: true,
      stampColor: '#000000',
      stampWidth: 130,
      shieldEnabled: true,
      shieldColor: '#ffffff',
      shieldWidth: 80,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: 17,
      shadowEffectOffsetY: 0,
    }
  },
  {
    id: 'IGLOO',
    name: 'IGLOO',
    settings: {
      ...baseSettings,
      backgroundEnabled: true,
      backgroundColor: '#0a2e52',
      fillEnabled: true,
      fillColor: '#ffffff',
      stampEnabled: true,
      stampColor: '#00aeff',
      stampWidth: 50,
      shieldEnabled: true,
      shieldColor: '#7bd5ff',
      shieldWidth: 30,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: -13,
      shadowEffectOffsetY: 0,
    }
  },
  {
    id: 'SUNKIST',
    name: 'SUNKIST',
    settings: {
      ...baseSettings,
      backgroundEnabled: true,
      backgroundColor: '#ffeb3b',
      fillEnabled: true,
      fillColor: '#ff430a',
      stampEnabled: true,
      stampColor: '#fff27c',
      stampWidth: 50,
      shieldEnabled: true,
      shieldColor: '#ff740a',
      shieldWidth: 50,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: 17,
      shadowEffectOffsetY: 0,
    }
  },
  {
    id: 'CONCRETE',
    name: 'CONCRETE',
    settings: {
      ...baseSettings,
      backgroundEnabled: true,
      backgroundColor: '#212121',
      fillEnabled: true,
      fillColor: '#e0e0e0',
      stampEnabled: true,
      stampColor: '#000000',
      stampWidth: 40,
      shieldEnabled: true,
      shieldColor: '#f44336',
      shieldWidth: 30,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: -12,
      shadowEffectOffsetY: 12
    }
  },

  {
    id: 'SEAFOAM',
    name: 'SEAFOAM',
    settings: {
      ...baseSettings,
      backgroundEnabled: true,
      backgroundColor: '#23f1a3',
      fillEnabled: true,
      fillColor: '#93ffd6',
      strokeEnabled: false,
      strokeColor: '#ff0000',
      strokeWidth: 45,
      shadowEnabled: false,
      shadowColor: '#000000',
      shadowOpacity: 1,
      shadowOffsetX: -400,
      shadowOffsetY: 5,
      shadowBlur: 0,
      stampEnabled: true,
      stampColor: '#001e16',
      stampWidth: 50,
      shineEnabled: false,
      shineColor: '#ffffff',
      shineOpacity: 1,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: -12,
      shadowEffectOffsetY: 12,
      shieldEnabled: true,
      shieldColor: '#00805c',
      shieldWidth: 40,
    }
  },

  {
    id: 'PURP',
    name: 'PURP',
    settings: {
      ...baseSettings,
      backgroundEnabled: true,
      backgroundColor: '#3f0264',
      fillEnabled: true,
      fillColor: '#d67fff',
      strokeEnabled: false,
      strokeColor: '#ff0000',
      strokeWidth: 45,
      shadowEnabled: false,
      shadowColor: '#000000',
      shadowOpacity: 1,
      shadowOffsetX: -400,
      shadowOffsetY: 5,
      shadowBlur: 0,
      stampEnabled: true,
      stampColor: '#7501c3',
      stampWidth: 50,
      shineEnabled: false,
      shineColor: '#ffffff',
      shineOpacity: 1,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: 12,
      shadowEffectOffsetY: 12,
      shieldEnabled: true,
      shieldColor: '#9331d9',
      shieldWidth: 40,
    }
  },

  {
    id: 'PINKY',
    name: 'PINKY',
    settings: {
      ...baseSettings,
      backgroundEnabled: true,
      backgroundColor: '#121212',
      fillEnabled: true,
      fillColor: '#ff00b8',
      strokeEnabled: false,
      strokeColor: '#ff0000',
      strokeWidth: 45,
      shadowEnabled: false,
      shadowColor: '#000000',
      shadowOpacity: 1,
      shadowOffsetX: -400,
      shadowOffsetY: 5,
      shadowBlur: 0,
      stampEnabled: true,
      stampColor: '#ff66d5',
      stampWidth: 50,
      shineEnabled: true,
      shineColor: '#ffffff',
      shineOpacity: 0.7,
      shadowEffectEnabled: true,
      shadowEffectOffsetX: 8,
      shadowEffectOffsetY: 8,
      shieldEnabled: true,
      shieldColor: '#00ffff',
      shieldWidth: 40,
    }
  }
];