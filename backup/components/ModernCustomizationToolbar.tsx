import React, { useState, useRef, useEffect } from 'react';
import { CustomizationOptions } from '../types';
import { 
  Palette, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  PaintBucket,
  Brush,
  Droplets,
  SunMoon,
  Sparkles,
  CircleDashed
} from 'lucide-react';
import { STYLE_PRESETS, StylePreset } from '../data/stylePresets';

import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { ColorPicker } from './ui/color-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { PresetGrid } from './PresetCard';

interface ModernCustomizationToolbarProps {
  options: CustomizationOptions;
  onChange: (options: CustomizationOptions) => void;
}

export const ModernCustomizationToolbar: React.FC<ModernCustomizationToolbarProps> = ({ 
  options,
  onChange,
}) => {
  // State for collapsible sections
  const [isColorsOpen, setIsColorsOpen] = useState(true);
  const [isEffectsOpen, setIsEffectsOpen] = useState(true);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  
  // Refs for handling color picker state
  const tempOptionsRef = useRef<CustomizationOptions>(options);
  const isColorPickerActive = useRef(false);
  
  // Update temp options when props change (except during active color picking)
  useEffect(() => {
    if (!isColorPickerActive.current) {
      tempOptionsRef.current = {...options};
    }
  }, [options]);
  
  // Regular change handler - for checkboxes/switches
  // These create immediate history entries
  const handleChange = (updatedValues: Partial<CustomizationOptions>) => {
    const newOptions = { ...options, ...updatedValues };
    tempOptionsRef.current = newOptions; // Keep temp options in sync
    onChange(newOptions);
  };
  
  // Special handler for color picker inputs
  // This updates the UI without creating history entries
  const handleColorPickerChange = (updatedValues: Partial<CustomizationOptions>) => {
    if (!isColorPickerActive.current) {
      isColorPickerActive.current = true;
    }
    
    // Update the temporary options
    tempOptionsRef.current = { ...tempOptionsRef.current, ...updatedValues };
    
    // Update the UI without creating a history entry
    onChange({
      ...tempOptionsRef.current,
      __skipHistory: true
    });
  };
  
  // Handler for when color picker interaction completes
  const handleColorPickerComplete = () => {
    if (isColorPickerActive.current) {
      isColorPickerActive.current = false;
      
      // Remove the special flag and create a proper history entry
      const { __skipHistory, ...finalOptions } = tempOptionsRef.current;
      onChange(finalOptions as CustomizationOptions);
    }
  };
  
  // Handler for slider inputs
  const handleSliderChange = (updatedValues: Partial<CustomizationOptions>) => {
    // Update the temporary options
    tempOptionsRef.current = { ...tempOptionsRef.current, ...updatedValues };
    
    // Update the UI without creating a history entry
    onChange({
      ...tempOptionsRef.current,
      __skipHistory: true
    });
  };
  
  // Handler for when slider interaction completes
  const handleSliderComplete = () => {
    // Remove the special flag and create a proper history entry
    const { __skipHistory, ...finalOptions } = tempOptionsRef.current;
    onChange(finalOptions as CustomizationOptions);
  };

  // Style presets are now imported from stylePresets.ts
  const stylePresets = STYLE_PRESETS;

  // Apply a preset's settings
  const applyPreset = (preset: StylePreset) => {
    // Create a copy of the preset settings
    const presetSettings = { ...preset.settings };
    
    // Presets should create history entries immediately
    const newOptions = { 
      ...options, 
      ...presetSettings,
      // Add a special property to indicate this came from a preset
      __presetId: preset.id
    };
    
    tempOptionsRef.current = newOptions; // Keep temp values in sync
    isColorPickerActive.current = false; // Reset any active color picking
    onChange(newOptions);
  };

  // Shared header style for section headers
  const sectionHeaderClass = "flex items-center justify-between w-full py-1.5 px-2 rounded-md transition-colors";
  
  // Control container style for consistent visual separation - increased contrast
  const controlContainerClass = "bg-gray-100 rounded-md mb-1.5 overflow-hidden border border-gray-200 shadow-sm";

  return (
    <div className="space-y-2">
      {/* Main Controls - Single Collapsible Section */}
      <div className="bg-white p-2 rounded-md border border-gray-200 shadow-sm">
        {/* Colors Section */}
        <Collapsible open={isColorsOpen} onOpenChange={() => setIsColorsOpen(!isColorsOpen)}>
          <CollapsibleTrigger className={`${sectionHeaderClass} bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300`}>
            <div className="flex items-center gap-2">
              <PaintBucket className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-medium text-purple-800">COLORS</h3>
            </div>
            {isColorsOpen ? 
              <ChevronUp className="w-3 h-3 text-purple-500" /> : 
              <ChevronDown className="w-3 h-3 text-purple-500" />
            }
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 pt-2 pb-1">
            {/* Background */}
            <div className={controlContainerClass}>
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="bg-toggle"
                    checked={options.backgroundEnabled}
                    onCheckedChange={(checked) => handleChange({ backgroundEnabled: checked })}
                  />
                  <label htmlFor="bg-toggle" className="text-xs font-medium">Background</label>
                </div>
                <ColorPicker
                  value={options.backgroundColor}
                  onChange={(color) => handleColorPickerChange({ backgroundColor: color })}
                  onChangeComplete={handleColorPickerComplete}
                  disabled={!options.backgroundEnabled}
                  className={!options.backgroundEnabled ? 'opacity-50' : ''}
                />
              </div>
            </div>
            
            {/* Fill - Always enabled, no toggle */}
            <div className={controlContainerClass}>
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7"></div> {/* Spacer to align with other controls */}
                  <label className="text-xs font-medium">Fill</label>
                </div>
                <ColorPicker
                  value={options.fillColor}
                  onChange={(color) => handleColorPickerChange({ fillColor: color })}
                  onChangeComplete={handleColorPickerComplete}
                />
              </div>
            </div>

            {/* Outline (Stamp) */}
            <div className={controlContainerClass}>
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="stamp-toggle"
                    checked={options.stampEnabled}
                    onCheckedChange={(checked) => handleChange({ stampEnabled: checked })}
                  />
                  <label htmlFor="stamp-toggle" className="text-xs font-medium">Outline</label>
                </div>
                <ColorPicker
                  value={options.stampColor}
                  onChange={(color) => handleColorPickerChange({ stampColor: color })}
                  onChangeComplete={handleColorPickerComplete}
                  disabled={!options.stampEnabled}
                  className={!options.stampEnabled ? 'opacity-50' : ''}
                />
              </div>
              
              {/* Size slider */}
              {options.stampEnabled && (
                <div className="px-3 pb-1.5 bg-gray-50">
                  <div className="flex items-center gap-1">
                    <div className="w-8"></div> {/* Spacer to align with switch */}
                    <span className="text-xs text-gray-500">Size</span>
                    <Slider
                      value={[options.stampWidth]}
                      min={20}
                      max={150}
                      step={1}
                      onValueChange={(value) => handleSliderChange({ stampWidth: value[0] })}
                      onValueCommit={handleSliderComplete}
                      className="flex-1"
                    />
                    {import.meta.env.DEV && (
                      <span className="text-[10px] text-gray-400 ml-1 tabular-nums">
                        {options.stampWidth}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Forcefield (Shield) */}
            <div className={controlContainerClass}>
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="shield-toggle"
                    checked={options.shieldEnabled}
                    onCheckedChange={(checked) => handleChange({ shieldEnabled: checked })}
                  />
                  <label htmlFor="shield-toggle" className="text-xs font-medium">Forcefield</label>
                </div>
                <ColorPicker
                  value={options.shieldColor}
                  onChange={(color) => handleColorPickerChange({ shieldColor: color })}
                  onChangeComplete={handleColorPickerComplete}
                  disabled={!options.shieldEnabled}
                  className={!options.shieldEnabled ? 'opacity-50' : ''}
                />
              </div>
              
              {/* Size slider */}
              {options.shieldEnabled && (
                <div className="px-3 pb-1.5 bg-gray-50">
                  <div className="flex items-center gap-1">
                    <div className="w-8"></div> {/* Spacer to align with switch */}
                    <span className="text-xs text-gray-500">Size</span>
                    <Slider
                      value={[options.shieldWidth]}
                      min={5}
                      max={150}
                      step={1}
                      onValueChange={(value) => handleSliderChange({ shieldWidth: value[0] })}
                      onValueCommit={handleSliderComplete}
                      className="flex-1"
                    />
                    {import.meta.env.DEV && (
                      <span className="text-[10px] text-gray-400 ml-1 tabular-nums">
                        {options.shieldWidth}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Shadow Effect */}
            <div className={controlContainerClass}>
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="shadow-effect-toggle"
                    checked={options.shadowEffectEnabled}
                    onCheckedChange={(checked) => handleChange({ shadowEffectEnabled: checked })}
                  />
                  <label htmlFor="shadow-effect-toggle" className="text-xs font-medium">Shadow</label>
                </div>
              </div>
              
              {/* Shadow sliders */}
              {options.shadowEffectEnabled && (
                <div className="px-3 pb-1.5 space-y-1.5 bg-gray-50">
                  <div className="flex items-center gap-1">
                    <div className="w-8"></div> {/* Spacer to align with switch */}
                    <span className="text-xs text-gray-500">Horizontal</span>
                    <ArrowLeft className="w-3 h-3 text-gray-400" />
                    <Slider
                      value={[options.shadowEffectOffsetX]}
                      min={-40}
                      max={70}
                      step={1}
                      onValueChange={(value) => handleSliderChange({ shadowEffectOffsetX: value[0] })}
                      onValueCommit={handleSliderComplete}
                      className="flex-1"
                    />
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    {import.meta.env.DEV && (
                      <span className="text-[10px] text-gray-400 ml-1 tabular-nums">
                        {options.shadowEffectOffsetX}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <div className="w-8"></div> {/* Spacer to align with switch */}
                    <span className="text-xs text-gray-500">Vertical</span>
                    <ArrowUp className="w-3 h-3 text-gray-400" />
                    <Slider
                      value={[options.shadowEffectOffsetY]}
                      min={-30}
                      max={30}
                      step={1}
                      onValueChange={(value) => handleSliderChange({ shadowEffectOffsetY: value[0] })}
                      onValueCommit={handleSliderComplete}
                      className="flex-1"
                    />
                    <ArrowDown className="w-3 h-3 text-gray-400" />
                    {import.meta.env.DEV && (
                      <span className="text-[10px] text-gray-400 ml-1 tabular-nums">
                        {options.shadowEffectOffsetY}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Style Presets - Moved to bottom */}
      <div className="bg-white p-2 rounded-md border border-gray-200 shadow-sm">
        <Collapsible open={isPresetsOpen} onOpenChange={() => setIsPresetsOpen(!isPresetsOpen)}>
          <CollapsibleTrigger className={`${sectionHeaderClass} bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300`}>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-medium text-purple-800">STYLE PRESETS</h3>
            </div>
            {isPresetsOpen ? 
              <ChevronUp className="w-3 h-3 text-purple-500" /> : 
              <ChevronDown className="w-3 h-3 text-purple-500" />
            }
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <PresetGrid
              presets={STYLE_PRESETS}
              activePresetId={options.__presetId}
              onPresetSelect={(preset) => applyPreset(preset)}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}; 