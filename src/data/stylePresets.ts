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
      stampWidth: 50,
      shieldEnabled: true,
      shieldColor: '#ffffff',
      shieldWidth: 50
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
      stampWidth: 40,
      shieldEnabled: true,
      shieldColor: '#002171',
      shieldWidth: 15
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
      stampColor: '#fff176',
      stampWidth: 60,
      shieldEnabled: true,
      shieldColor: '#ff430a',
      shieldWidth: 15
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
  }
];

// Export the CLASSIC preset settings separately as they're used as defaults
export const DEFAULT_CUSTOMIZATION_OPTIONS = STYLE_PRESETS.find(preset => preset.id === 'CLASSIC')?.settings; 