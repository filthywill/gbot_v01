import React, { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { cn } from '../../utils/cn';
import { HexColorPicker } from 'react-colorful';
import { Pipette } from 'lucide-react';

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

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onChangeComplete?: () => void;
  disabled?: boolean;
  className?: string;
  swatches?: string[];
}

const DEFAULT_SWATCHES = [
  '#000000', '#ffffff', '#f44336', '#e91e63', '#9c27b0', 
  '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b',
  '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'
];

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
  
  // Check if EyeDropper is supported
  useEffect(() => {
    setIsEyeDropperSupported(!!window.EyeDropper);
  }, []);
  
  // Update temp color when value changes
  useEffect(() => {
    setTempColor(value);
  }, [value]);
  
  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    onChange(newColor);
  };
  
  const handleSwatchClick = (color: string) => {
    setTempColor(color);
    onChange(color);
    if (onChangeComplete) onChangeComplete();
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onChangeComplete) {
      onChangeComplete();
    }
  };
  
  const handleEyeDropper = async () => {
    if (!window.EyeDropper) return;
    
    try {
      setIsPickingColor(true);
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      setTempColor(result.sRGBHex);
      onChange(result.sRGBHex);
      if (onChangeComplete) onChangeComplete();
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
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          {/* Color Preview and Hex Input */}
          <div className="flex justify-between items-center">
            <div 
              className="h-8 w-8 rounded border border-gray-300"
              style={{ backgroundColor: tempColor }}
            />
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempColor}
                onChange={(e) => setTempColor(e.target.value)}
                onBlur={() => onChange(tempColor)}
                className="px-2 py-1 text-xs border border-gray-300 rounded w-20"
              />
              {isEyeDropperSupported && (
                <button
                  type="button"
                  onClick={handleEyeDropper}
                  disabled={isPickingColor}
                  className={cn(
                    "p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500",
                    isPickingColor && "opacity-50 cursor-not-allowed"
                  )}
                  title="Pick color from screen"
                >
                  <Pipette size={16} className="text-gray-600" />
                </button>
              )}
            </div>
          </div>
          
          {/* React Colorful Color Picker */}
          <div className="py-1">
            <HexColorPicker 
              color={tempColor} 
              onChange={handleColorChange} 
              style={{ width: '100%', height: '150px' }}
            />
          </div>
          
          {/* Color Swatches */}
          <div className="grid grid-cols-5 gap-1">
            {swatches.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "h-6 w-6 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1",
                  color.toLowerCase() === tempColor.toLowerCase() && "ring-1 ring-purple-500 ring-offset-1"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleSwatchClick(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 