var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a;
// Base settings that all presets extend from
export const DEFAULT_CUSTOMIZATION_OPTIONS = {
    color: '#000000',
    backgroundColor: '#ffffff',
    outlineColor: '#000000',
    outlineWidth: 0,
    shadowColor: '#000000',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    letterSpacing: 0,
    scale: 1,
    rotation: 0,
    skewX: 0,
    skewY: 0,
    opacity: 1,
    flipX: false,
    flipY: false,
    showOverlapDebug: false,
};
// Style presets
export const STYLE_PRESETS = [
    {
        id: 'classic',
        name: 'Classic',
        settings: {
            ...DEFAULT_CUSTOMIZATION_OPTIONS,
            color: '#000000',
            backgroundColor: '#ffffff',
        },
    },
    {
        id: 'neon',
        name: 'Neon',
        settings: {
            ...DEFAULT_CUSTOMIZATION_OPTIONS,
            color: '#00ff00',
            backgroundColor: '#000000',
            shadowColor: '#00ff00',
            shadowBlur: 20,
        },
    },
    {
        id: 'retro',
        name: 'Retro',
        settings: {
            ...DEFAULT_CUSTOMIZATION_OPTIONS,
            color: '#ff6b6b',
            backgroundColor: '#4a4e69',
            outlineColor: '#ffffff',
            outlineWidth: 2,
        },
    },
    {
        id: 'graffiti',
        name: 'Graffiti',
        settings: {
            ...DEFAULT_CUSTOMIZATION_OPTIONS,
            color: '#ff0000',
            backgroundColor: '#ffffff',
            outlineColor: '#000000',
            outlineWidth: 3,
            shadowColor: '#000000',
            shadowBlur: 5,
            shadowOffsetX: 3,
            shadowOffsetY: 3,
        },
    },
    {
        id: 'minimal',
        name: 'Minimal',
        settings: {
            ...DEFAULT_CUSTOMIZATION_OPTIONS,
            color: '#333333',
            backgroundColor: '#f5f5f5',
            letterSpacing: -5,
        },
    },
];
