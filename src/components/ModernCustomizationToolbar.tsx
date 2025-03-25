import React, { useRef, useEffect, useCallback } from 'react';
import { useState } from 'react';
import { CustomizationOptions } from '../types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { FaChevronCircleUp, FaChevronCircleDown } from "react-icons/fa";
import { STYLE_PRESETS, StylePreset } from '../data/stylePresets';
import { StylePresetsPanel } from './StylePresetsPanel';
import { Switch } from './ui/switch';
import { ValueSlider } from './ui/value-slider';
import { ColorPicker } from './ui/color-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useDevStore } from '../store/useDevStore';

interface ModernCustomizationToolbarProps {
  options: CustomizationOptions;
  onChange: (options: CustomizationOptions) => void;
}

interface ControlRowProps {
  label: string;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  color?: string;
  onColorChange?: (color: string) => void;
  width?: number;
  onWidthChange?: (width: number) => void;
  onColorComplete?: () => void;
  onSliderComplete?: () => void;
}

// Helper component to display values in dev mode
const DevValueDisplay = ({ value, displayValue }: { value: number; displayValue?: number }) => {
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  const { showValueOverlays } = useDevStore();
  
  if (!isDev || !showValueOverlays) return null;
  
  return (
    <div className="absolute right-0 top-0 bg-black/70 text-xs text-white/70 px-1 rounded pointer-events-none translate-y-[-50%]">
      {displayValue !== undefined ? `${displayValue} (${value})` : value}
    </div>
  );
};

const ControlRow: React.FC<ControlRowProps> = ({
  label,
  enabled,
  onToggle,
  color,
  onColorChange,
  width,
  onWidthChange,
  onColorComplete,
  onSliderComplete,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSlider = width !== undefined && onWidthChange && enabled;

  // Determine slider range and scaling based on label
  const getSliderConfig = () => {
    switch(label) {
      case "OUTLINE":
        return {
          min: 25,
          max: 200,
          step: 8,
          displayMin: 1,
          displayMax: 25,
          toDisplayValue: (value: number) => Math.round(((value - 25) / (200 - 25)) * 24 + 1),
          toActualValue: (display: number) => Math.round(((display - 1) / 24) * (200 - 25) + 25)
        };
      case "FORCEFIELD":
        return {
          min: 1,
          max: 250,
          step: 5, // (250-1)/50 steps
          displayMin: 1,
          displayMax: 50,
          toDisplayValue: (value: number) => Math.round(((value - 1) / (250 - 1)) * 49 + 1),
          toActualValue: (display: number) => Math.round(((display - 1) / 49) * (250 - 1) + 1)
        };
      default:
        return {
          min: 0,
          max: 10,
          step: 0.1,
          displayMin: 0,
          displayMax: 10,
          toDisplayValue: (value: number) => value,
          toActualValue: (display: number) => display
        };
    }
  };

  const sliderConfig = getSliderConfig();
  const displayValue = width !== undefined ? sliderConfig.toDisplayValue(width) : 0;

  // Determine container padding based on whether it has a slider
  const containerPadding = hasSlider ? "p-1.5" : "py-1 px-1.5";

  return (
    <div className={`bg-zinc-500/25 rounded-lg ${containerPadding} relative`}>
      {/* Header row with label, toggle, and color */}
      <div className="flex items-center justify-between gap-1.5 min-h-[8px]">
        <div className="flex items-center gap-1.5">
          {enabled !== undefined && onToggle && (
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-purple-600"
            />
          )}
          <div className="flex items-center gap-0.5">
            <span className="text-sm text-zinc-200 ui-label leading-none flex items-center -mt-[1px] pl-[2px]">{label}</span>
            {hasSlider && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-center w-4 h-4 hover:bg-zinc-600/30 rounded -mt-[1px]"
              >
                {isExpanded ? (
                  <FaChevronCircleUp className="w-3 h-3 text-zinc-500" />
                ) : (
                  <FaChevronCircleDown className="w-3 h-3 text-zinc-500" />
                )}
              </button>
            )}
          </div>
        </div>
        {color && onColorChange && (
          <ColorPicker
            value={color}
            onChange={onColorChange}
            onChangeComplete={onColorComplete}
            className="w-6 h-6"
          />
        )}
      </div>

      {/* Width slider if applicable */}
      {hasSlider && isExpanded && (
        <div className="mt-1">
          <div className="grid grid-cols-[65px_1fr] items-center gap-1.5">
            <span className="text-xs text-zinc-400 ui-label pl-[36px]">Size</span>
            <div className="relative">
              <DevValueDisplay value={width || 0} displayValue={displayValue} />
              <ValueSlider
                value={[displayValue]}
                min={sliderConfig.displayMin}
                max={sliderConfig.displayMax}
                step={1}
                onValueChange={([value]) => {
                  const actualValue = sliderConfig.toActualValue(value);
                  onWidthChange(actualValue);
                }}
                onValueCommit={onSliderComplete}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShadowControl: React.FC<{
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  offsetX: number;
  onOffsetXChange: (x: number) => void;
  offsetY: number;
  onOffsetYChange: (y: number) => void;
  onSliderComplete?: () => void;
}> = ({
  enabled,
  onToggle,
  offsetX,
  onOffsetXChange,
  offsetY,
  onOffsetYChange,
  onSliderComplete,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Shadow slider configuration
  const shadowConfig = {
    min: -30,
    max: 70,
    displayMin: -25,
    displayMax: 25,
    toDisplayValue: (value: number) => {
      // Map the actual range to display range
      if (value < 0) {
        return Math.round((value / 30) * 25);
      } else {
        return Math.round((value / 70) * 25);
      }
    },
    toActualValue: (display: number) => {
      // Map the display range back to actual range
      if (display < 0) {
        return Math.round((display / 25) * 30);
      } else {
        return Math.round((display / 25) * 70);
      }
    }
  };

  return (
    <div className="bg-zinc-700/50 rounded-lg p-1.5 relative">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-purple-600"
        />
        <div className="flex items-center gap-0.5">
          <span className="text-sm text-zinc-200 ui-label leading-none flex items-center -mt-[1px] pl-[2px]">SHADOW</span>
          {enabled && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center w-4 h-4 hover:bg-zinc-600/30 rounded -mt-[1px]"
            >
              {isExpanded ? (
                <FaChevronCircleUp className="w-3 h-3 text-zinc-500" />
              ) : (
                <FaChevronCircleDown className="w-3 h-3 text-zinc-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Shadow controls */}
      {enabled && isExpanded && (
        <div className="mt-1 space-y-1">
          <div className="grid grid-cols-[100px_1fr] items-center gap-1.5">
            <span className="text-xs text-zinc-400 ui-label pl-[36px]">Horizontal</span>
            <div className="relative">
              <DevValueDisplay 
                value={offsetX} 
                displayValue={shadowConfig.toDisplayValue(offsetX)} 
              />
              <ValueSlider
                value={[shadowConfig.toDisplayValue(offsetX)]}
                min={shadowConfig.displayMin}
                max={shadowConfig.displayMax}
                step={1}
                onValueChange={([value]) => {
                  const actualValue = shadowConfig.toActualValue(value);
                  onOffsetXChange(actualValue);
                }}
                onValueCommit={onSliderComplete}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center gap-1.5">
            <span className="text-xs text-zinc-400 ui-label pl-[36px]">Vertical</span>
            <div className="relative">
              <DevValueDisplay 
                value={offsetY} 
                displayValue={shadowConfig.toDisplayValue(offsetY)} 
              />
              <ValueSlider
                value={[shadowConfig.toDisplayValue(offsetY)]}
                min={shadowConfig.displayMin}
                max={shadowConfig.displayMax}
                step={1}
                onValueChange={([value]) => {
                  const actualValue = shadowConfig.toActualValue(value);
                  onOffsetYChange(actualValue);
                }}
                onValueCommit={onSliderComplete}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ModernCustomizationToolbar: React.FC<ModernCustomizationToolbarProps> = ({ 
  options,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // State for tracking dragging status
  const [isDragging, setIsDragging] = useState(false);
  const [tempOptions, setTempOptions] = useState<CustomizationOptions>(options);
  
  // Update temp options when options change and not dragging
  useEffect(() => {
    if (!isDragging) {
      setTempOptions(options);
    }
  }, [options, isDragging]);
  
  // For toggle changes (switches) - create history entries immediately
  const handleToggleChange = useCallback((updates: Partial<CustomizationOptions>) => {
    onChange({...options, ...updates});
  }, [options, onChange]);
  
  // For dragging operations (sliders, color pickers) - don't create history entries during dragging
  const handleDragChange = useCallback((updates: Partial<CustomizationOptions>) => {
    // Start dragging if not already
    if (!isDragging) {
      setIsDragging(true);
    }
    
    // Update temp state
    const newTempOptions = {...tempOptions, ...updates};
    setTempOptions(newTempOptions);
    
    // Update UI without creating history
    onChange({...newTempOptions, __skipHistory: true});
  }, [isDragging, tempOptions, onChange]);
  
  // When dragging ends, commit the changes and create history
  const handleDragComplete = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onChange(tempOptions); // Creates history entry without __skipHistory flag
    }
  }, [isDragging, tempOptions, onChange]);
  
  // Apply a preset with history
  const applyPreset = useCallback((preset: StylePreset) => {
    setIsDragging(false);
    
    // Merge preset settings with options
    const newOptions = { 
      ...options, 
      ...preset.settings,
      __presetId: preset.id 
    };
    
    setTempOptions(newOptions);
    onChange(newOptions);
  }, [options, onChange]);

  // Shared style classes
  const sectionHeaderClass = "flex items-center justify-between w-full py-1.5 px-1.5 rounded-md transition-colors";
  const sectionContainerClass = "p-1 rounded-md";

  return (
    <div className="flex flex-col min-[640px]:flex-row min-[640px]:space-x-2 space-y-0 min-[640px]:space-y-0">
      <div className={`${sectionContainerClass} flex-1`}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className={`${sectionHeaderClass} bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700`}>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-purple-100">STYLE CUSTOMIZATION</h3>
            </div>
            {isOpen ? 
              <ChevronUp className="w-3 h-3 text-purple-200" /> : 
              <ChevronDown className="w-3 h-3 text-purple-200" />
            }
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1.5 pb-0.5">
            {/* Background and Fill Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Background */}
              <ControlRow
                label="BG"
                enabled={options.backgroundEnabled}
                onToggle={(enabled) => handleToggleChange({ backgroundEnabled: enabled })}
                color={options.backgroundColor}
                onColorChange={(color) => handleDragChange({ backgroundColor: color })}
                onColorComplete={handleDragComplete}
              />

              {/* Fill */}
              <ControlRow
                label="FILL"
                color={options.fillColor}
                onColorChange={(color) => handleDragChange({ fillColor: color })}
                onColorComplete={handleDragComplete}
              />
            </div>
            
            {/* Outline - moved before Shield */}
            <ControlRow
              label="OUTLINE"
              enabled={options.stampEnabled}
              onToggle={(enabled) => handleToggleChange({ stampEnabled: enabled })}
              color={options.stampColor}
              onColorChange={(color) => handleDragChange({ stampColor: color })}
              onColorComplete={handleDragComplete}
              width={options.stampWidth}
              onWidthChange={(width) => handleDragChange({ stampWidth: width })}
              onSliderComplete={handleDragComplete}
            />

            {/* Shield */}
            <ControlRow
              label="FORCEFIELD"
              enabled={options.shieldEnabled}
              onToggle={(enabled) => handleToggleChange({ shieldEnabled: enabled })}
              color={options.shieldColor}
              onColorChange={(color) => handleDragChange({ shieldColor: color })}
              onColorComplete={handleDragComplete}
              width={options.shieldWidth}
              onWidthChange={(width) => handleDragChange({ shieldWidth: width })}
              onSliderComplete={handleDragComplete}
            />

            {/* Shadow */}
            <ShadowControl
              enabled={options.shadowEffectEnabled}
              onToggle={(enabled) => handleToggleChange({ shadowEffectEnabled: enabled })}
              offsetX={options.shadowEffectOffsetX}
              onOffsetXChange={(x) => handleDragChange({ shadowEffectOffsetX: x })}
              offsetY={options.shadowEffectOffsetY}
              onOffsetYChange={(y) => handleDragChange({ shadowEffectOffsetY: y })}
              onSliderComplete={handleDragComplete}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {/* Style Presets */}
      <div className={`${sectionContainerClass} flex-1`}>
        <StylePresetsPanel
          options={options}
          onPresetSelect={applyPreset}
        />
      </div>
    </div>
  );
}; 