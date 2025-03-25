import React from 'react';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { DevValueDisplay } from './DevValueDisplay';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface ShadowControlProps {
  shadowEffectEnabled: boolean;
  shadowEffectOffsetX: number;
  shadowEffectOffsetY: number;
  onToggleChange: (enabled: boolean) => void;
  onOffsetXChange: (offset: number) => void;
  onOffsetYChange: (offset: number) => void;
  onSliderComplete: () => void;
}

export const ShadowControl: React.FC<ShadowControlProps> = ({
  shadowEffectEnabled,
  shadowEffectOffsetX,
  shadowEffectOffsetY,
  onToggleChange,
  onOffsetXChange,
  onOffsetYChange,
  onSliderComplete
}) => {
  return (
    <div className="bg-zinc-700 rounded-md mb-1 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <Switch 
            id="shadow-effect-toggle"
            checked={shadowEffectEnabled}
            onCheckedChange={(checked: boolean) => onToggleChange(checked)}
          />
          <label htmlFor="shadow-effect-toggle" className="text-xs font-medium text-zinc-200">Shadow</label>
        </div>
      </div>
      
      {/* Shadow sliders */}
      {shadowEffectEnabled && (
        <div className="px-2.5 pb-1.5 space-y-1.5 bg-zinc-600">
          <div className="flex items-center gap-1">
            <div className="w-8"></div> {/* Spacer to align with switch */}
            <span className="text-xs text-zinc-300">Horizontal</span>
            <ArrowLeft className="w-3 h-3 text-zinc-400" />
            <Slider
              value={[shadowEffectOffsetX]}
              min={-40}
              max={70}
              step={1}
              onValueChange={(value: number[]) => onOffsetXChange(value[0])}
              onValueCommit={onSliderComplete}
              className="flex-1"
            />
            <ArrowRight className="w-3 h-3 text-zinc-400" />
            <DevValueDisplay value={shadowEffectOffsetX} />
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-8"></div> {/* Spacer to align with switch */}
            <span className="text-xs text-zinc-300">Vertical</span>
            <ArrowUp className="w-3 h-3 text-zinc-400" />
            <Slider
              value={[shadowEffectOffsetY]}
              min={-30}
              max={30}
              step={1}
              onValueChange={(value: number[]) => onOffsetYChange(value[0])}
              onValueCommit={onSliderComplete}
              className="flex-1"
            />
            <ArrowDown className="w-3 h-3 text-zinc-400" />
            <DevValueDisplay value={shadowEffectOffsetY} />
          </div>
        </div>
      )}
    </div>
  );
}; 