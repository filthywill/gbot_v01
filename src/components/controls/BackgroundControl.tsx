import React from 'react';
import { Switch } from '../ui/switch';
import { ColorPicker } from '../ui/color-picker';
import { CustomizationOptions } from '../../types';

interface BackgroundControlProps {
  backgroundEnabled: boolean;
  backgroundColor: string;
  onToggleChange: (enabled: boolean) => void;
  onColorChange: (color: string) => void;
  onColorChangeComplete: () => void;
}

export const BackgroundControl: React.FC<BackgroundControlProps> = ({
  backgroundEnabled,
  backgroundColor,
  onToggleChange,
  onColorChange,
  onColorChangeComplete
}) => {
  return (
    <div className="bg-zinc-700 rounded-md mb-1 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <Switch 
            id="bg-toggle"
            checked={backgroundEnabled}
            onCheckedChange={(checked: boolean) => onToggleChange(checked)}
          />
          <label htmlFor="bg-toggle" className="text-xs font-medium text-zinc-200">Background</label>
        </div>
        <ColorPicker
          value={backgroundColor}
          onChange={(color) => onColorChange(color)}
          onChangeComplete={onColorChangeComplete}
          disabled={!backgroundEnabled}
          className={!backgroundEnabled ? 'opacity-50' : ''}
        />
      </div>
    </div>
  );
}; 