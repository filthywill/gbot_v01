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
  CircleDashed,
  Save
} from 'lucide-react';
import { STYLE_PRESETS, StylePreset } from '../data/stylePresets';
import { PresetGrid } from './PresetCard';

import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { ColorPicker } from './ui/color-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';

// Helper component to display values in dev mode
const DevValueDisplay = ({ value }: { value: number }) => {
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  
  if (!isDev) return null;
  
  return (
    <span className="ml-1 text-xs text-zinc-500 font-mono">
      {value}
    </span>
  );
};

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
  
  // State for user presets
  const [userPresets, setUserPresets] = useState<StylePreset[]>([]);
  
  // State for save preset dialog
  const [isSavePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
  // Check if we're in development mode
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  
  // Refs for handling color picker state
  const tempOptionsRef = useRef<CustomizationOptions>(options);
  const isColorPickerActive = useRef(false);
  
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

  // Combine built-in and user presets
  const allPresets = [...STYLE_PRESETS, ...userPresets];

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

  // Shared header style for section headers
  const sectionHeaderClass = "flex items-center justify-between w-full py-1.5 px-1.5 rounded-md transition-colors";
  
  // Control container style for consistent visual separation - increased contrast
  const controlContainerClass = "bg-zinc-700 rounded-md mb-1 overflow-hidden shadow-sm";

  return (
    <div className="space-y-1.5">
      {/* Main Controls - Single Collapsible Section */}
      <div className="p-1 rounded-md shadow-sm">
        {/* Colors Section */}
        <Collapsible open={isColorsOpen} onOpenChange={() => setIsColorsOpen(!isColorsOpen)}>
          <CollapsibleTrigger className={`${sectionHeaderClass} bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700`}>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-purple-100">STYLE CUSTOMIZATION</h3>
            </div>
            {isColorsOpen ? 
              <ChevronUp className="w-3 h-3 text-purple-200" /> : 
              <ChevronDown className="w-3 h-3 text-purple-200" />
            }
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 pt-1.5 pb-0.5">
            {/* Background */}
            <div className={controlContainerClass}>
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="bg-toggle"
                    checked={options.backgroundEnabled}
                    onCheckedChange={(checked: boolean) => handleChange({ backgroundEnabled: checked })}
                  />
                  <label htmlFor="bg-toggle" className="text-xs font-medium text-zinc-200">Background</label>
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
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7"></div> {/* Spacer to align with other controls */}
                  <label className="text-xs font-medium text-zinc-200">Fill</label>
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
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="stamp-toggle"
                    checked={options.stampEnabled}
                    onCheckedChange={(checked: boolean) => handleChange({ stampEnabled: checked })}
                  />
                  <label htmlFor="stamp-toggle" className="text-xs font-medium text-zinc-200">Outline</label>
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
                <div className="px-2.5 pb-1.5 bg-zinc-600">
                  <div className="flex items-center gap-1">
                    <div className="w-8"></div> {/* Spacer to align with switch */}
                    <span className="text-xs text-zinc-300">Size</span>
                    <Slider
                      value={[options.stampWidth]}
                      min={50}
                      max={150}
                      step={1}
                      onValueChange={(value: number[]) => handleSliderChange({ stampWidth: value[0] })}
                      onValueCommit={handleSliderComplete}
                      className="flex-1"
                    />
                    <DevValueDisplay value={options.stampWidth} />
                  </div>
                </div>
              )}
            </div>

            {/* Forcefield (Shield) */}
            <div className={controlContainerClass}>
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="shield-toggle"
                    checked={options.shieldEnabled}
                    onCheckedChange={(checked: boolean) => handleChange({ shieldEnabled: checked })}
                  />
                  <label htmlFor="shield-toggle" className="text-xs font-medium text-zinc-200">Forcefield</label>
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
                <div className="px-2.5 pb-1.5 bg-zinc-600">
                  <div className="flex items-center gap-1">
                    <div className="w-8"></div> {/* Spacer to align with switch */}
                    <span className="text-xs text-zinc-300">Size</span>
                    <Slider
                      value={[options.shieldWidth]}
                      min={5}
                      max={150}
                      step={1}
                      onValueChange={(value: number[]) => handleSliderChange({ shieldWidth: value[0] })}
                      onValueCommit={handleSliderComplete}
                      className="flex-1"
                    />
                    <DevValueDisplay value={options.shieldWidth} />
                  </div>
                </div>
              )}
            </div>

            {/* Shadow Effect */}
            <div className={controlContainerClass}>
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="shadow-effect-toggle"
                    checked={options.shadowEffectEnabled}
                    onCheckedChange={(checked: boolean) => handleChange({ shadowEffectEnabled: checked })}
                  />
                  <label htmlFor="shadow-effect-toggle" className="text-xs font-medium text-zinc-200">Shadow</label>
                </div>
              </div>
              
              {/* Shadow sliders */}
              {options.shadowEffectEnabled && (
                <div className="px-2.5 pb-1.5 space-y-1.5 bg-zinc-600">
                  <div className="flex items-center gap-1">
                    <div className="w-8"></div> {/* Spacer to align with switch */}
                    <span className="text-xs text-zinc-300">Horizontal</span>
                    <ArrowLeft className="w-3 h-3 text-zinc-400" />
                    <Slider
                      value={[options.shadowEffectOffsetX]}
                      min={-40}
                      max={70}
                      step={1}
                      onValueChange={(value: number[]) => handleSliderChange({ shadowEffectOffsetX: value[0] })}
                      onValueCommit={handleSliderComplete}
                      className="flex-1"
                    />
                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                    <DevValueDisplay value={options.shadowEffectOffsetX} />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <div className="w-8"></div> {/* Spacer to align with switch */}
                    <span className="text-xs text-zinc-300">Vertical</span>
                    <ArrowUp className="w-3 h-3 text-zinc-400" />
                    <Slider
                      value={[options.shadowEffectOffsetY]}
                      min={-30}
                      max={30}
                      step={1}
                      onValueChange={(value: number[]) => handleSliderChange({ shadowEffectOffsetY: value[0] })}
                      onValueCommit={handleSliderComplete}
                      className="flex-1"
                    />
                    <ArrowDown className="w-3 h-3 text-zinc-400" />
                    <DevValueDisplay value={options.shadowEffectOffsetY} />
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Style Presets - Moved to bottom */}
      <div className="p-1 rounded-md shadow-sm">
        <Collapsible open={isPresetsOpen} onOpenChange={() => setIsPresetsOpen(!isPresetsOpen)}>
          <CollapsibleTrigger className={`${sectionHeaderClass} bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700`}>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-purple-100">STYLE PRESETS</h3>
            </div>
            {isPresetsOpen ? 
              <ChevronUp className="w-3 h-3 text-purple-200" /> : 
              <ChevronDown className="w-3 h-3 text-purple-200" />
            }
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1.5 pb-0.5">
            {/* Built-in Presets */}
            <div className="mb-2 p-2 bg-zinc-700 rounded-lg shadow-sm">
             
              <h4 className="text-xs font-medium text-zinc-300 mb-1.5 px-1">FEATURED STYLES</h4>
              
              <PresetGrid
                presets={STYLE_PRESETS}
                activePresetId={options.__presetId}
                onPresetSelect={applyPreset}
              />
            </div>
            
            {/* User Presets (Dev Mode Only) */}
            {isDev && userPresets.length > 0 && (
              <div className="mt-2 mb-2 p-2 bg-zinc-700 rounded-lg shadow-sm">
                <h4 className="text-xs font-medium text-zinc-300 mb-1.5 px-1">CUSTOM STYLES</h4>
                <PresetGrid
                  presets={userPresets}
                  activePresetId={options.__presetId}
                  onPresetSelect={applyPreset}
                  onPresetDelete={deleteUserPreset}
                  areDeletable={true}
                />
              </div>
            )}
            
            {/* Save Preset Button (Dev Mode Only) */}
            {isDev && (
              <div className="mt-3 flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs flex items-center gap-1.5 border-purple-700 hover:bg-purple-900 text-purple-300"
                  onClick={() => setSavePresetDialogOpen(true)}
                >
                  <Save className="w-3 h-3" />
                  <span>Save Current as Preset</span>
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
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