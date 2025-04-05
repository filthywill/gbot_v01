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
import { useHistoryTracking } from '../hooks/useHistoryTracking';
import { isDevelopment } from '../lib/env';

interface CustomizationToolbarProps {
  options: CustomizationOptions;
  onChange: (options: CustomizationOptions) => void;
}

export const CustomizationToolbar: React.FC<CustomizationToolbarProps> = ({ 
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
  
  // Use the history tracking hook
  const { updateWithoutHistory, updateWithHistory } = useHistoryTracking();
  
  // Check if we're in development mode
  const isDev = isDevelopment();
  
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
    // Use updateWithHistory to create history entries immediately
    const updatedOptions = updateWithHistory(updates);
    onChange({...options, ...updatedOptions} as CustomizationOptions);
  }, [options, onChange, updateWithHistory]);
  
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
    const withoutHistory = updateWithoutHistory(newTempOptions);
    onChange(withoutHistory as CustomizationOptions);
  }, [isDragging, tempOptions, onChange, updateWithoutHistory]);
  
  // When dragging ends, commit the changes and create history
  const handleDragComplete = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Use updateWithHistory to create history entries on completion
      const withHistory = updateWithHistory(tempOptions);
      onChange(withHistory as CustomizationOptions);
    }
  }, [isDragging, tempOptions, onChange, updateWithHistory]);
  
  // Handler for when slider interaction completes
  const handleSliderComplete = () => {
    handleDragComplete();
  };
  
  // Apply a preset with history
  const applyPreset = useCallback((preset: StylePreset) => {
    setIsDragging(false);
    
    // Merge preset settings with options and mark with preset ID
    const withHistory = updateWithHistory(preset.settings, preset.id);
    onChange({ ...options, ...withHistory } as CustomizationOptions);
    
    // Update temp options to match
    setTempOptions({ ...options, ...preset.settings } as CustomizationOptions);
  }, [options, onChange, updateWithHistory]);
  
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
    <div className="flex flex-col min-[600px]:flex-row min-[640px]:space-x-2 space-y-0 min-[600px]:space-y-0">
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
            <div className="grid grid-cols-2 gap-1.5 items-start">
              {/* Background */}
              <div className="space-y-1 flex-grow">
                <BackgroundControl
                  enabled={options.backgroundEnabled}
                  onToggle={(enabled) => handleToggleChange({ backgroundEnabled: enabled })}
                  color={options.backgroundColor}
                  onColorChange={(color) => handleDragChange({ backgroundColor: color })}
                  onColorComplete={handleDragComplete}
                />
              </div>

              {/* Fill */}
              <div className="space-y-1 flex-grow">
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