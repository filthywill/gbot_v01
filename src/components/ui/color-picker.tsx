import React, { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { cn } from '../../utils/cn';

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
  
  // Update temp color when value changes
  useEffect(() => {
    setTempColor(value);
  }, [value]);
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
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
      <PopoverContent className="w-56 p-2">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div 
              className="h-6 w-6 rounded border border-gray-300"
              style={{ backgroundColor: tempColor }}
            />
            <input
              type="text"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              onBlur={() => onChange(tempColor)}
              className="px-1 py-0.5 text-xs border border-gray-300 rounded w-20"
            />
          </div>
          
          <div>
            <input
              type="color"
              value={tempColor}
              onChange={handleColorChange}
              className="w-full h-6 cursor-pointer"
            />
          </div>
          
          <div className="grid grid-cols-5 gap-1">
            {swatches.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "h-5 w-5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1",
                  color === tempColor && "ring-1 ring-purple-500 ring-offset-1"
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