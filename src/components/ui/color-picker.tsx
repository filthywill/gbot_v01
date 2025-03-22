import React, { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { cn } from '../../utils/cn';
import { HexColorPicker } from 'react-colorful';
import { FaEyeDropper, FaCirclePlus } from 'react-icons/fa6';

// Define the EyeDropper interface for TypeScript
interface EyeDropperConstructor {
  new(): EyeDropperInterface;
}

interface EyeDropperInterface {
  open: () => Promise<{ sRGBHex: string }>;
}

// Add EyeDropper to the global window object
declare global {
  interface Window {
    EyeDropper?: EyeDropperConstructor;
  }
}

// Global state for shared color data across all color pickers
type GlobalColorState = {
  recentColors: string[];
  customColors: string[];
};

// Create a global state object
const globalColorState: GlobalColorState = {
  recentColors: [],
  customColors: []
};

// Event emitter for color state changes
const colorStateListeners: Array<() => void> = [];

// Function to update global color state
const updateGlobalColorState = (
  key: keyof GlobalColorState,
  value: string[]
) => {
  globalColorState[key] = value;
  // Notify all listeners
  colorStateListeners.forEach(listener => listener());
};

// Hook to subscribe to global color state
const useGlobalColorState = (): [GlobalColorState, typeof updateGlobalColorState] => {
  const [state, setState] = useState<GlobalColorState>({
    recentColors: globalColorState.recentColors,
    customColors: globalColorState.customColors
  });

  useEffect(() => {
    const handleChange = () => {
      setState({
        recentColors: globalColorState.recentColors,
        customColors: globalColorState.customColors
      });
    };

    // Add listener
    colorStateListeners.push(handleChange);

    // Remove listener on cleanup
    return () => {
      const index = colorStateListeners.indexOf(handleChange);
      if (index > -1) {
        colorStateListeners.splice(index, 1);
      }
    };
  }, []);

  return [state, updateGlobalColorState];
};

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onChangeComplete?: () => void;
  disabled?: boolean;
  className?: string;
  swatches?: string[];
}

// Default swatches - 14 colors (7 columns x 2 rows)
const DEFAULT_SWATCHES = [
  '#000000', // Black
  '#ffffff', // White
  '#f44336', // Red
  '#ff9800', // Orange
  '#ffeb3b', // Yellow
  '#4caf50', // Green
  '#2196f3', // Blue
  '#3f51b5', // Indigo
  '#9c27b0', // Purple
  '#795548', // Brown
  '#e91e63', // Pink
  '#607d8b', // Blue Gray
  '#009688', // Teal
  '#8bc34a'  // Light Green
];

// Maximum number of recent colors to store
const MAX_RECENT_COLORS = 7;
// Maximum number of custom colors to store
const MAX_CUSTOM_COLORS = 7;

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  onChangeComplete,
  disabled = false,
  className,
  swatches = DEFAULT_SWATCHES
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(value);
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);
  const [isPickingColor, setIsPickingColor] = useState(false);
  
  // Use global color state
  const [globalColors, updateGlobalColors] = useGlobalColorState();
  
  // Check if EyeDropper is supported
  useEffect(() => {
    // Force eyedropper to be supported in modern browsers
    setIsEyeDropperSupported(true);
    console.log('EyeDropper API check:', Boolean(window.EyeDropper));
  }, []);
  
  // Update temp color when value changes
  useEffect(() => {
    setTempColor(value);
  }, [value]);
  
  // Add color to recent colors when a color is selected
  const addToRecentColors = (color: string) => {
    // Don't add if it's already the most recent color
    if (globalColors.recentColors[0] === color.toLowerCase()) return;
    
    const newRecentColors = (() => {
      // Remove the color if it already exists
      const filtered = globalColors.recentColors.filter(
        c => c.toLowerCase() !== color.toLowerCase()
      );
      // Add to the beginning and limit to MAX_RECENT_COLORS
      return [color.toLowerCase(), ...filtered].slice(0, MAX_RECENT_COLORS);
    })();
    
    updateGlobalColors('recentColors', newRecentColors);
  };
  
  // Add color to custom colors
  const addToCustomColors = () => {
    // Don't add if it's already in custom colors
    if (globalColors.customColors.some(c => c.toLowerCase() === tempColor.toLowerCase())) return;
    
    const newCustomColors = [
      tempColor.toLowerCase(),
      ...globalColors.customColors
    ].slice(0, MAX_CUSTOM_COLORS);
    
    updateGlobalColors('customColors', newCustomColors);
  };
  
  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    onChange(newColor);
  };
  
  const handleSwatchClick = (color: string) => {
    setTempColor(color);
    onChange(color);
    addToRecentColors(color);
    if (onChangeComplete) onChangeComplete();
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onChangeComplete) {
      onChangeComplete();
      // Add the final color to recent colors when closing
      addToRecentColors(tempColor);
    }
  };
  
  const handleEyeDropper = async () => {
    try {
      setIsPickingColor(true);
      
      if (window.EyeDropper) {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        setTempColor(result.sRGBHex);
        onChange(result.sRGBHex);
        addToRecentColors(result.sRGBHex);
        if (onChangeComplete) onChangeComplete();
      } else {
        console.error('EyeDropper API not available in this browser');
        alert('Color picker is not supported in this browser');
      }
    } catch (error) {
      console.error('EyeDropper error:', error);
    } finally {
      setIsPickingColor(false);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-6 w-6 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
          style={{ backgroundColor: value }}
          aria-label="Pick a color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2">
        <div className="space-y-2">
          {/* Color Preview and Hex Input */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div 
                className="h-7 w-7 rounded border border-gray-300"
                style={{ backgroundColor: tempColor }}
              />
              
              {/* Always show the eyedropper button, handling unsupported browsers in the click handler */}
              <button
                type="button"
                onClick={handleEyeDropper}
                disabled={isPickingColor}
                className={cn(
                  "h-7 w-7 flex items-center justify-center text-zinc-600 hover:text-zinc-800 focus:outline-none focus:text-purple-500",
                  isPickingColor && "opacity-50 cursor-not-allowed"
                )}
                title="Pick color from screen"
              >
                <FaEyeDropper size={16} />
              </button>
            </div>
            
            <input
              type="text"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              onBlur={() => onChange(tempColor)}
              className="flex-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded w-full"
            />
          </div>
          
          {/* React Colorful Color Picker */}
          <div className="py-0.5">
            <HexColorPicker 
              color={tempColor} 
              onChange={handleColorChange} 
              style={{ width: '100%', height: '130px' }}
            />
          </div>
          
          {/* Recently Used Colors */}
          {globalColors.recentColors.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-[10px] text-zinc-500 font-medium">RECENTLY USED</span>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {globalColors.recentColors.map((color, index) => (
                  <button
                    key={`recent-${index}-${color}`}
                    type="button"
                    className={cn(
                      "h-5 w-5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1",
                      color.toLowerCase() === tempColor.toLowerCase() && "ring-1 ring-purple-500 ring-offset-1"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleSwatchClick(color)}
                    aria-label={`Select recent color ${color}`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Default Swatches */}
          <div className="space-y-1">
            <div className="flex items-center">
              <span className="text-[10px] text-zinc-500 font-medium">SWATCH LIBRARY</span>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {swatches.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "h-5 w-5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1",
                    color.toLowerCase() === tempColor.toLowerCase() && "ring-1 ring-purple-500 ring-offset-1"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleSwatchClick(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
          
          {/* Custom Colors */}
          <div className="space-y-1">
            <div className="flex items-center">
              <span className="text-[10px] text-zinc-500 font-medium">CUSTOM COLORS</span>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {/* Add to Custom Colors Button */}
              <button
                type="button"
                onClick={addToCustomColors}
                className="h-5 w-5 flex items-center justify-center text-zinc-600 hover:text-zinc-800 focus:outline-none focus:text-purple-500"
                title="Save current color"
              >
                <FaCirclePlus size={18} />
              </button>
              
              {/* Custom Color Swatches */}
              {globalColors.customColors.slice(0, 6).map((color, index) => (
                <button
                  key={`custom-${index}-${color}`}
                  type="button"
                  className={cn(
                    "h-5 w-5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1",
                    color.toLowerCase() === tempColor.toLowerCase() && "ring-1 ring-purple-500 ring-offset-1"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleSwatchClick(color)}
                  aria-label={`Select custom color ${color}`}
                />
              ))}
              
              {/* Empty Slots */}
              {Array(Math.max(0, 6 - globalColors.customColors.length))
                .fill(0)
                .map((_, index) => (
                  <div
                    key={`empty-custom-${index}`}
                    className="h-5 w-5 rounded border border-dashed border-gray-300"
                  />
                ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 