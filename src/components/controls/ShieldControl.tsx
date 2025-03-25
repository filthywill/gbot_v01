import React from 'react';
import { Switch } from '../ui/switch';
import { ColorPicker } from '../ui/color-picker';
import { Slider } from '../ui/slider';
import { DevValueDisplay } from './DevValueDisplay';

interface ShieldControlProps {
  shieldEnabled: boolean;
  shieldColor: string;
  shieldWidth: number;
  onToggleChange: (enabled: boolean) => void;
  onColorChange: (color: string) => void;
  onColorChangeComplete: () => void;
  onWidthChange: (width: number) => void;
  onWidthChangeComplete: () => void;
}

export const ShieldControl: React.FC<ShieldControlProps> = ({
  shieldEnabled,
  shieldColor,
  shieldWidth,
  onToggleChange,
  onColorChange,
  onColorChangeComplete,
  onWidthChange,
  onWidthChangeComplete
}) => {
  return (
    <div className="bg-zinc-700 rounded-md mb-1 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <Switch 
            id="shield-toggle"
            checked={shieldEnabled}
            onCheckedChange={(checked: boolean) => onToggleChange(checked)}
          />
          <label htmlFor="shield-toggle" className="text-xs font-medium text-zinc-200">Forcefield</label>
        </div>
        <ColorPicker
          value={shieldColor}
          onChange={(color) => onColorChange(color)}
          onChangeComplete={onColorChangeComplete}
          disabled={!shieldEnabled}
          className={!shieldEnabled ? 'opacity-50' : ''}
        />
      </div>
      
      {/* Size slider */}
      {shieldEnabled && (
        <div className="px-2.5 pb-1.5 bg-zinc-600">
          <div className="flex items-center gap-1">
            <div className="w-8"></div> {/* Spacer to align with switch */}
            <span className="text-xs text-zinc-300">Size</span>
            <Slider
              value={[shieldWidth]}
              min={5}
              max={150}
              step={1}
              onValueChange={(value: number[]) => onWidthChange(value[0])}
              onValueCommit={onWidthChangeComplete}
              className="flex-1"
            />
            <DevValueDisplay value={shieldWidth} />
          </div>
        </div>
      )}
    </div>
  );
}; 