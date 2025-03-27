import React, { useRef, useEffect, useCallback } from 'react';
import { useState } from 'react';
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
  CircleDashed,
  Save,
  BatteryFull,
  Settings
} from 'lucide-react';
import { FaChevronCircleUp, FaChevronCircleDown } from "react-icons/fa";
import { STYLE_PRESETS, StylePreset } from '../data/stylePresets';
import { StylePresetsPanel } from './StylePresetsPanel';
import { Switch } from './ui/switch';
import { ValueSlider } from './ui/value-slider';
import { ColorPicker } from './ui/color-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useDevStore } from '../store/useDevStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { OutlineControl } from './controls/OutlineControl';
import { ShadowControl } from './controls/ShadowControl';
import { BackgroundControl } from './controls/BackgroundControl';
import { FillControl } from './controls/FillControl';
import { ShieldControl } from './controls/ShieldControl';
import { DevValueDisplay } from './ui/dev-value-display';

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
          step: 1,
          displayMin: 1,
          displayMax: 25,
          toDisplayValue: (value: number) => Math.round(((value - 25) / (200 - 25)) * 24 + 1),
          toActualValue: (display: number) => Math.round(((display - 1) / 24) * (200 - 25) + 25)
        };
      case "FORCEFIELD":
        return {
          min: 1,
          max: 250,
          step: 2,
          displayMin: 1,
          displayMax: 50,
          toDisplayValue: (value: number) => Math.round(((value - 1) / (250 - 1)) * 49 + 1),
          toActualValue: (display: number) => Math.round(((display - 1) / 49) * (250 - 1) + 1)
        };
      default:
        return {
          min: 0,
          max: 10,
          step: 2,
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

export const ModernCustomizationToolbar: React.FC<ModernCustomizationToolbarProps> = ({ 
  options,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isPresetsOpen, setIsPresetsOpen] = useState(true);
  
  // State for tracking dragging status
  const [isDragging, setIsDragging] = useState(false);
  const [tempOptions, setTempOptions] = useState<CustomizationOptions>(options);
  
  // State for user presets
  const [userPresets, setUserPresets] = useState<StylePreset[]>([]);
  
  // State for save preset dialog
  const [isSavePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
  // Check if we're in development mode
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  
  // Load user presets from localStorage on component mount
  useEffect(() => {
    if (isDev) {
      try {
        const savedPresets = localStorage.getItem('userPresets');
        if (savedPresets) {
          setUserPresets(JSON.parse(savedPresets));
        }
      } catch (error) {
        console.error('Error loading user presets:', error);
      }
    }
  }, [isDev]);
  
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
  
  // Handler for when slider interaction completes
  const handleSliderComplete = () => {
    // Remove the special flag and create a proper history entry
    const { __skipHistory, ...finalOptions } = tempOptions;
    onChange(finalOptions as CustomizationOptions);
  };
  
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
  
  // Handler for saving a new preset
  const savePreset = () => {
    // Validate preset name
    if (!newPresetName.trim()) {
      alert('Please enter a valid name for your preset');
      return;
    }
    
    try {
      // Create preset ID (uppercase version of name)
      const presetId = newPresetName.toUpperCase().replace(/\s+/g, '_');
      
      // Extract the current settings, removing any special flags
      const { __skipHistory, __presetId, ...currentSettings } = options;
      
      // Create the new preset object
      const newPreset: StylePreset = {
        id: presetId,
        name: newPresetName,
        settings: currentSettings as CustomizationOptions
      };
      
      // Check if preset with this ID already exists in current userPresets state
      const existingIndex = userPresets.findIndex(p => p.id === presetId);
      
      let updatedUserPresets: StylePreset[];
      
      if (existingIndex >= 0) {
        if (confirm(`A preset with name "${newPresetName}" already exists. Replace it?`)) {
          // Create a new array with the updated preset
          updatedUserPresets = [
            ...userPresets.slice(0, existingIndex),
            newPreset,
            ...userPresets.slice(existingIndex + 1)
          ];
        } else {
          return; // User cancelled
        }
      } else {
        // Add the new preset to the array
        updatedUserPresets = [...userPresets, newPreset];
      }
      
      // Save to localStorage
      localStorage.setItem('userPresets', JSON.stringify(updatedUserPresets));
      
      // Update state
      setUserPresets(updatedUserPresets);
      
      // Show success message
      alert(`Preset "${newPresetName}" saved successfully!`);
      
      // Close the dialog and reset the form
      setSavePresetDialogOpen(false);
      setNewPresetName('');
      
      // Log for development
      console.log('User presets updated:', updatedUserPresets);
      
    } catch (error) {
      console.error('Error saving preset:', error);
      alert('Failed to save preset. See console for details.');
    }
  };
  
  // Handler for deleting a user preset (Dev mode only)
  const deleteUserPreset = (presetId: string) => {
    if (confirm(`Are you sure you want to delete preset "${presetId}"?`)) {
      try {
        // Filter out the deleted preset
        const updatedUserPresets = userPresets.filter(p => p.id !== presetId);
        
        // Save to localStorage
        localStorage.setItem('userPresets', JSON.stringify(updatedUserPresets));
        
        // Update state
        setUserPresets(updatedUserPresets);
        
        // Log for development
        console.log('User preset deleted:', presetId);
        
      } catch (error) {
        console.error('Error deleting preset:', error);
        alert('Failed to delete preset. See console for details.');
      }
    }
  };

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
          <CollapsibleContent className="space-y-1 pt-1 pb-0.5">
            {/* Background and Fill Row */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* Background */}
              <div className="flex justify-center w-full">
                <BackgroundControl
                  enabled={options.backgroundEnabled}
                  onToggle={(enabled) => handleToggleChange({ backgroundEnabled: enabled })}
                  color={options.backgroundColor}
                  onColorChange={(color) => handleDragChange({ backgroundColor: color })}
                  onColorComplete={handleDragComplete}
                />
              </div>

              {/* Fill */}
              <div className="flex justify-center w-full">
                <FillControl
                  color={options.fillColor}
                  onColorChange={(color) => handleDragChange({ fillColor: color })}
                  onColorComplete={handleDragComplete}
                />
              </div>
            </div>
            
            {/* Outline */}
            <div className="space-y-1">
              <OutlineControl
                enabled={options.stampEnabled}
                onToggle={(enabled) => handleToggleChange({ stampEnabled: enabled })}
                color={options.stampColor}
                onColorChange={(color) => handleDragChange({ stampColor: color })}
                onColorComplete={handleDragComplete}
                width={options.stampWidth}
                onWidthChange={(width) => handleDragChange({ stampWidth: width })}
                onSliderComplete={handleDragComplete}
              />
            </div>

            {/* Shield */}
            <div className="space-y-1">
              <ShieldControl
                enabled={options.shieldEnabled}
                onToggle={(enabled) => handleToggleChange({ shieldEnabled: enabled })}
                color={options.shieldColor}
                onColorChange={(color) => handleDragChange({ shieldColor: color })}
                onColorComplete={handleDragComplete}
                width={options.shieldWidth}
                onWidthChange={(width) => handleDragChange({ shieldWidth: width })}
                onSliderComplete={handleDragComplete}
              />
            </div>

            {/* Shadow */}
            <div className="space-y-1">
              <ShadowControl
                enabled={options.shadowEffectEnabled}
                onToggle={(enabled) => handleToggleChange({ shadowEffectEnabled: enabled })}
                offsetX={options.shadowEffectOffsetX}
                offsetY={options.shadowEffectOffsetY}
                onOffsetXChange={(x: number) => handleDragChange({ shadowEffectOffsetX: x })}
                onOffsetYChange={(y: number) => handleDragChange({ shadowEffectOffsetY: y })}
                onSliderComplete={handleDragComplete}
              />
            </div>
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

      {/* Save Preset Dialog */}
      {isDev && (
        <Dialog open={isSavePresetDialogOpen} onOpenChange={setSavePresetDialogOpen}>
          <DialogContent className="max-w-[350px]">
            <DialogHeader>
              <DialogTitle>Save as New Preset</DialogTitle>
            </DialogHeader>
            <div className="py-3">
              <label htmlFor="preset-name" className="text-xs font-medium block mb-1.5">
                Preset Name
              </label>
              <Input
                id="preset-name"
                value={newPresetName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPresetName(e.target.value)}
                placeholder="My Awesome Preset"
                className="w-full text-sm"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSavePresetDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={savePreset}
              >
                Save Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 