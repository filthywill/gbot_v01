# ModernCustomizationToolbar.tsx - Part 1

This file contains the first part of the ModernCustomizationToolbar component implementation. 
Due to size limitations, the file has been split into parts for documentation purposes.

```tsx
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
```