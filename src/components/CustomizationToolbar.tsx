import React, { useState, useRef, useEffect } from 'react';
import { CustomizationOptions } from '../types';
import { Palette, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface StylePreset {
  id: string;
  name: string;
  icon?: React.ReactNode;
  settings: Partial<CustomizationOptions>;
}

interface CustomizationToolbarProps {
  options: CustomizationOptions;
  onChange: (newOptions: CustomizationOptions) => void;
}

export const CustomizationToolbar: React.FC<CustomizationToolbarProps> = ({ 
  options, 
  onChange
}) => {
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  
  // Use a ref to track the current working value for sliders and color pickers
  // These changes won't be added to history until interaction is complete
  const tempOptionsRef = useRef<CustomizationOptions>({...options});
  
  // Flag to track if a color picker is currently active
  const isColorPickerActive = useRef(false);
  
  // Update temp options when props change (except during active color picking)
  useEffect(() => {
    if (!isColorPickerActive.current) {
      tempOptionsRef.current = {...options};
    }
  }, [options]);
  
  // Regular change handler - for checkboxes
  // These create immediate history entries
  const handleChange = (updatedValues: Partial<CustomizationOptions>) => {
    const newOptions = { ...options, ...updatedValues };
    tempOptionsRef.current = newOptions; // Keep temp options in sync
    onChange(newOptions);
  };
  
  // Special handler for color picker inputs
  // This handles the start of color picking interaction
  const handleColorPickerStart = () => {
    isColorPickerActive.current = true;
  };
  
  // Special handler for color picker inputs during dragging
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
  
  // Special handler for slider inputs that are being dragged
  // This updates the UI without creating history entries
  const handleSliderDrag = (updatedValues: Partial<CustomizationOptions>) => {
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

  // Style presets
  const stylePresets: StylePreset[] = [
    {
      id: 'CLASSIC',
      name: 'CLASSIC',
      settings: {
        backgroundEnabled: false,
        fillEnabled: true,
        fillColor: '#ffffff',
        stampEnabled: true,
        stampColor: '#000000',
        stampWidth: 60,
        shineEnabled: false,
        shineColor: '#ffffff',
        shineOpacity: 1,
        shieldEnabled: true,
        shieldColor: '#f00000', // Red shield
        shieldWidth: 40,
        shadowEffectEnabled: true,
        shadowEffectOffsetX: -8,
        shadowEffectOffsetY: 2
      }
    },
    {
      id: 'SLAP',
      name: 'SLAP',
      settings: {
        backgroundEnabled: true,
        backgroundColor: '#f00000',
        fillEnabled: true,
        fillColor: '#ffffff',
        stampEnabled: true,
        stampColor: '#000000',
        stampWidth: 50,
        shineEnabled: false,
        shieldEnabled: true,
        shieldColor: '#ffffff',
        shieldWidth: 50
      }
    },
    {
      id: 'IGLOO',
      name: 'IGLOO',
      settings: {
        backgroundEnabled: true,
        backgroundColor: '#0a2e52',
        fillEnabled: true,
        fillColor: '#ffffff',
        stampEnabled: true,
        stampColor: '#00aeff',
        stampWidth: 40,
        shineEnabled: false,
        shieldEnabled: true,
        shieldColor: '#002171',
        shieldWidth: 15
      }
    },
    {
      id: 'SUNKIST',
      name: 'SUNKIST',
      settings: {
        backgroundEnabled: true,
        backgroundColor: '#ffeb3b',
        fillEnabled: true,
        fillColor: '#ff430a',
        stampEnabled: true,
        stampColor: '#fff176',
        stampWidth: 60,
        shineEnabled: false,
        shieldEnabled: true,
        shieldColor: '#ff430a',
        shieldWidth: 15
      }
    },
    {
      id: 'CONCRETE',
      name: 'CONCRETE',
      settings: {
        backgroundEnabled: true,
        backgroundColor: '#212121',
        fillEnabled: true,
        fillColor: '#e0e0e0',
        stampEnabled: true,
        stampColor: '#000000',
        stampWidth: 40,
        shineEnabled: false,
        shieldEnabled: true,
        shieldColor: '#f44336', // Red shield
        shieldWidth: 30,
        shadowEffectEnabled: true,
        shadowEffectOffsetX: -12,
        shadowEffectOffsetY: 12
      }
    }
  ];

  // Apply a preset's settings
  const applyPreset = (preset: StylePreset) => {
    // Presets should create history entries immediately
    const newOptions = { ...options, ...preset.settings };
    tempOptionsRef.current = newOptions; // Keep temp values in sync
    isColorPickerActive.current = false; // Reset any active color picking
    onChange(newOptions);
  };

  // Toggle the preset dropdown section
  const togglePresetDropdown = () => {
    setIsPresetDropdownOpen(!isPresetDropdownOpen);
  };

  // Handle click outside color picker to complete the interaction
  useEffect(() => {
    const handleClickOutside = () => {
      if (isColorPickerActive.current) {
        handleColorPickerComplete();
      }
    };

    document.addEventListener('mouseup', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
  }, []);

  return (
    <div className="pt-1">
      {/* Main Controls - Responsive layout with custom grid */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
        {/* Background Color - 10% width on large screens */}
        <div className="bg-gray-100 rounded p-2 md:col-span-2" style={{ minWidth: "0" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id="bg-toggle"
                checked={options.backgroundEnabled}
                onChange={(e) => handleChange({ backgroundEnabled: e.target.checked })}
                className="h-3 w-3"
              />
              <label htmlFor="bg-toggle" className="text-xs">BG</label>
            </div>
            <div className="ml-1 flex-grow">
              <input
                type="color"
                value={options.backgroundColor}
                onMouseDown={handleColorPickerStart}
                onChange={(e) => handleColorPickerChange({ backgroundColor: e.target.value })}
                onMouseUp={handleColorPickerComplete}
                onBlur={handleColorPickerComplete}
                disabled={!options.backgroundEnabled}
                className={`h-4 w-full rounded-sm ${!options.backgroundEnabled ? 'opacity-50' : ''}`}
              />
            </div>
          </div>
        </div>
        
        {/* Fill Color - 10% width on large screens */}
        <div className="bg-gray-100 rounded p-2 md:col-span-2" style={{ minWidth: "0" }}>
          <div className="flex items-center justify-between">
            <label htmlFor="fill-color" className="text-xs">FILL</label>
            <div className="ml-1 flex-grow">
              <input
                type="color"
                id="fill-color"
                value={options.fillColor}
                onMouseDown={handleColorPickerStart}
                onChange={(e) => handleColorPickerChange({ fillColor: e.target.value })}
                onMouseUp={handleColorPickerComplete}
                onBlur={handleColorPickerComplete}
                className="h-4 w-full rounded-sm"
              />
            </div>
          </div>
        </div>
        
        {/* OUTLINE (STAMP) effect - 20% width on large screens */}
        <div className="bg-gray-100 rounded p-2 md:col-span-3" style={{ minWidth: "0" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id="stamp-toggle"
                checked={options.stampEnabled}
                onChange={(e) => handleChange({ stampEnabled: e.target.checked })}
                className="h-3 w-3"
              />
              <label htmlFor="stamp-toggle" className="text-xs">OUTLINE</label>
            </div>
            <div className="ml-1 flex-grow">
              <input
                type="color"
                value={options.stampColor}
                onMouseDown={handleColorPickerStart}
                onChange={(e) => handleColorPickerChange({ stampColor: e.target.value })}
                onMouseUp={handleColorPickerComplete}
                onBlur={handleColorPickerComplete}
                disabled={!options.stampEnabled}
                className={`h-4 w-full rounded-sm ${!options.stampEnabled ? 'opacity-50' : ''}`}
              />
            </div>
          </div>
          
          {/* Size slider */}
          <div className="mt-1 pl-4">
            <input
              type="range"
              min="50"
              max="150"
              value={options.stampWidth}
              onChange={(e) => handleSliderDrag({ stampWidth: parseInt(e.target.value) })}
              onMouseUp={handleSliderComplete}
              onTouchEnd={handleSliderComplete}
              disabled={!options.stampEnabled}
              className={`w-full h-1 ${!options.stampEnabled ? 'opacity-50' : ''}`}
            />
          </div>
        </div>
        
        {/* AURA Effect (SHIELD) - 20% width on large screens */}
        <div className="bg-gray-100 rounded p-2 md:col-span-3" style={{ minWidth: "0" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id="shield-toggle"
                checked={options.shieldEnabled}
                onChange={(e) => handleChange({ shieldEnabled: e.target.checked })}
                className="h-3 w-3"
              />
              <label htmlFor="shield-toggle" className="text-xs">AURA</label>
            </div>
            <div className="ml-1 flex-grow">
              <input
                type="color"
                value={options.shieldColor}
                onMouseDown={handleColorPickerStart}
                onChange={(e) => handleColorPickerChange({ shieldColor: e.target.value })}
                onMouseUp={handleColorPickerComplete}
                onBlur={handleColorPickerComplete}
                disabled={!options.shieldEnabled}
                className={`h-4 w-full rounded-sm ${!options.shieldEnabled ? 'opacity-50' : ''}`}
              />
            </div>
          </div>
          
          {/* Size slider */}
          <div className="mt-1 pl-4">
            <input
              type="range"
              min="5"
              max="150"
              value={options.shieldWidth}
              onChange={(e) => handleSliderDrag({ shieldWidth: parseInt(e.target.value) })}
              onMouseUp={handleSliderComplete}
              onTouchEnd={handleSliderComplete}
              disabled={!options.shieldEnabled}
              className={`w-full h-1 ${!options.shieldEnabled ? 'opacity-50' : ''}`}
            />
          </div>
        </div>
        
        {/* Shadow Effect - 40% width on large screens */}
        <div className="bg-gray-100 rounded p-2 col-span-2 md:col-span-2" style={{ minWidth: "0", overflow: "hidden" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id="shadow-effect-toggle"
                checked={options.shadowEffectEnabled}
                onChange={(e) => handleChange({ shadowEffectEnabled: e.target.checked })}
                className="h-3 w-3"
              />
              <label htmlFor="shadow-effect-toggle" className="text-xs">SHADOW</label>
            </div>
          </div>
          
          {/* Shadow sliders with improved layout */}
          {options.shadowEffectEnabled && (
            <div className="mt-1 pl-4 pr-2 space-y-2 w-full">
              <div className="flex items-center w-full">
                <ArrowLeft className="w-3 h-3 text-gray-400 flex-shrink-0 mr-1" />
                <input
                  type="range"
                  min="-40"
                  max="70"
                  value={options.shadowEffectOffsetX}
                  onChange={(e) => handleSliderDrag({ shadowEffectOffsetX: parseInt(e.target.value) })}
                  onMouseUp={handleSliderComplete}
                  onTouchEnd={handleSliderComplete}
                  className="flex-1 w-full h-1 min-w-0"
                />
                <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />
              </div>
              
              <div className="flex items-center w-full">
                <ArrowUp className="w-3 h-3 text-gray-400 flex-shrink-0 mr-1" />
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={options.shadowEffectOffsetY}
                  onChange={(e) => handleSliderDrag({ shadowEffectOffsetY: parseInt(e.target.value) })}
                  onMouseUp={handleSliderComplete}
                  onTouchEnd={handleSliderComplete}
                  className="flex-1 w-full h-1 min-w-0"
                />
                <ArrowDown className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Style Presets Button */}
      <div className="mt-2">
        <button 
          onClick={togglePresetDropdown}
          className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 p-1 rounded w-full text-xs transition-colors"
        >
          <Palette className="w-3 h-3 text-gray-600" />
          <span className="text-gray-700">Style Presets</span>
          {isPresetDropdownOpen ? 
            <ChevronUp className="w-3 h-3 text-gray-600" /> : 
            <ChevronDown className="w-3 h-3 text-gray-600" />
          }
        </button>
      </div>
      
      {/* Style Presets Dropdown Content */}
      {isPresetDropdownOpen && (
        <div className="mt-1 p-2 border border-gray-200 rounded bg-white shadow-sm">
          <div className="flex flex-wrap gap-2">
            {stylePresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-xs transition-colors"
              >
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};