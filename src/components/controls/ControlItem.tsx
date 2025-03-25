import React from 'react';
import { Switch } from '../ui/switch';
import { ColorPicker } from '../ui/color-picker';
import { Slider } from '../ui/slider';
import { cn } from '../../lib/utils';

// Configuration interface for the control
export interface ControlConfig {
  id: string;
  label: string;
  description?: string;
  
  // Toggle configuration
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  
  // Color picker configuration
  hasColorPicker?: boolean;
  colorValue?: string;
  onColorChange?: (value: string) => void;
  onColorComplete?: () => void;
  
  // Slider configuration
  hasSlider?: boolean;
  sliderValue?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  sliderLabel?: string;
  onSliderChange?: (value: number) => void;
  onSliderComplete?: () => void;
  
  // Second slider configuration (for things like shadow offset X/Y)
  hasSecondSlider?: boolean;
  secondSliderValue?: number;
  secondSliderMin?: number;
  secondSliderMax?: number;
  secondSliderStep?: number;
  secondSliderLabel?: string;
  onSecondSliderChange?: (value: number) => void;
}

export const ControlItem: React.FC<ControlConfig> = ({
  label,
  description,
  
  // Toggle props
  hasToggle = false,
  toggleValue = false,
  onToggleChange,
  
  // Color picker props
  hasColorPicker = false,
  colorValue = '#000000',
  onColorChange,
  onColorComplete,
  
  // Slider props
  hasSlider = false,
  sliderValue = 0,
  sliderMin = 0,
  sliderMax = 100,
  sliderStep = 1,
  sliderLabel = '',
  onSliderChange,
  onSliderComplete,
  
  // Second slider props
  hasSecondSlider = false,
  secondSliderValue = 0,
  secondSliderMin = 0,
  secondSliderMax = 100,
  secondSliderStep = 1,
  secondSliderLabel = '',
  onSecondSliderChange,
}) => {
  // Determine if control is disabled
  const isDisabled = hasToggle && !toggleValue;
  
  // Common classes for the control container
  const controlClasses = cn(
    "p-2 rounded-md shadow-sm transition-all duration-150",
    "bg-zinc-700/50 hover:bg-zinc-700/70",
    isDisabled && "opacity-60"
  );

  return (
    <div className={controlClasses}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {/* Label section */}
          <div>
            <p className="text-xs font-medium text-zinc-200">{label}</p>
            {description && (
              <p className="text-[10px] text-zinc-400">{description}</p>
            )}
          </div>
        </div>
        
        {/* Toggle switch (if configured) */}
        {hasToggle && (
          <Switch
            checked={toggleValue}
            onCheckedChange={onToggleChange}
            className="data-[state=checked]:bg-purple-600"
          />
        )}
      </div>
      
      {/* Content container - contains pickers/sliders */}
      <div className={cn(
        "space-y-2 transition-opacity duration-150",
        isDisabled ? "opacity-50 pointer-events-none" : "opacity-100"
      )}>
        {/* Color picker (if configured) */}
        {hasColorPicker && (
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <ColorPicker
                value={colorValue}
                onChange={onColorChange || (() => {})}
                onChangeComplete={onColorComplete}
                className="w-full h-6 rounded-md"
              />
            </div>
          </div>
        )}
        
        {/* First slider (if configured) */}
        {hasSlider && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-zinc-400">{sliderLabel}</label>
              <span className="text-[10px] text-zinc-400">{sliderValue}</span>
            </div>
            <Slider
              value={[sliderValue]}
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              onValueChange={values => onSliderChange && onSliderChange(values[0])}
              onValueCommit={() => onSliderComplete && onSliderComplete()}
              className="w-full h-4"
            />
          </div>
        )}
        
        {/* Second slider (if configured) */}
        {hasSecondSlider && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-zinc-400">{secondSliderLabel}</label>
              <span className="text-[10px] text-zinc-400">{secondSliderValue}</span>
            </div>
            <Slider
              value={[secondSliderValue]}
              min={secondSliderMin}
              max={secondSliderMax}
              step={secondSliderStep}
              onValueChange={values => onSecondSliderChange && onSecondSliderChange(values[0])}
              onValueCommit={() => onSliderComplete && onSliderComplete()}
              className="w-full h-4"
            />
          </div>
        )}
      </div>
    </div>
  );
}; 