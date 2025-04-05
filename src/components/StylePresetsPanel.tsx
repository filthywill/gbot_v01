import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { STYLE_PRESETS, StylePreset } from '../data/stylePresets';
import { PresetGrid } from './PresetCard';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { CustomizationOptions } from '../types';
import { isDevelopment } from '../lib/env';

interface StylePresetsPanelProps {
  options: CustomizationOptions;
  onPresetSelect: (preset: StylePreset) => void;
}

export const StylePresetsPanel: React.FC<StylePresetsPanelProps> = ({
  options,
  onPresetSelect,
}) => {
  // State for collapsible sections
  const [isPresetsOpen, setIsPresetsOpen] = useState(true);
  
  // State for user presets
  const [userPresets, setUserPresets] = useState<StylePreset[]>([]);
  
  // State for save preset dialog
  const [isSavePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
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

  return (
    <>
      <Collapsible 
        open={isPresetsOpen} 
        onOpenChange={setIsPresetsOpen}
        className="animate-none"
      >
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
          <div className="mb-2 p-2 bg-zinc-700/80 rounded-lg">
            <h4 className="text-xs font-medium text-zinc-300 mb-1.5 px-1">FEATURED STYLES</h4>
            <PresetGrid
              presets={STYLE_PRESETS}
              activePresetId={options.__presetId}
              onPresetSelect={onPresetSelect}
            />
          </div>
          
          {/* User Presets (Dev Mode Only) */}
          {isDev && userPresets.length > 0 && (
            <div className="mt-2 mb-2 p-2 bg-zinc-700/80 rounded-lg">
              <h4 className="text-xs font-medium text-zinc-300 mb-1.5 px-1">CUSTOM STYLES</h4>
              <PresetGrid
                presets={userPresets}
                activePresetId={options.__presetId}
                onPresetSelect={onPresetSelect}
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

      {/* Save Preset Dialog */}
      <Dialog open={isSavePresetDialogOpen} onOpenChange={setSavePresetDialogOpen}>
        <DialogContent className="bg-zinc-800 border border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-purple-300">Save Custom Style Preset</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Preset Name
            </label>
            <Input
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Enter a name for your preset"
              className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSavePresetDialogOpen(false)}
              className="bg-transparent border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={savePreset}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 