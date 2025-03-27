import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Switch } from '../ui/switch';
import { ValueSlider } from '../ui/value-slider';
import { FaChevronCircleUp, FaChevronCircleDown } from "react-icons/fa";
import { DevValueDisplay } from '../ui/dev-value-display';
import { ValueConfig } from '../../utils/sliderValueConversion';

interface EffectControlItemProps {
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  firstSliderLabel: string;
  firstSliderValue: number;
  onFirstSliderChange: (value: number) => void;
  secondSliderLabel: string;
  secondSliderValue: number;
  onSecondSliderChange: (value: number) => void;
  onSliderComplete?: () => void;
  sliderConfig: ValueConfig;
}

export const EffectControlItem: React.FC<EffectControlItemProps> = ({
  label,
  enabled,
  onToggle,
  firstSliderLabel,
  firstSliderValue,
  onFirstSliderChange,
  secondSliderLabel,
  secondSliderValue,
  onSecondSliderChange,
  onSliderComplete,
  sliderConfig
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(enabled && isExpanded);
  
  // Update content visibility based on both toggle state and expand state
  useEffect(() => {
    setIsContentVisible(enabled && isExpanded);
  }, [enabled, isExpanded]);

  // Convert actual values to display values for sliders
  const firstDisplayValue = sliderConfig.toDisplayValue(firstSliderValue);
  const secondDisplayValue = sliderConfig.toDisplayValue(secondSliderValue);

  return (
    <div className={cn(
      "bg-zinc-500/25 rounded-lg pt-1 px-1.5 relative",
      isContentVisible ? "pb-1" : "pb-0"
    )}>
      {/* Header row with label and toggle */}
      <div className="flex items-center justify-between gap-1.5 min-h-[28px]">
        <div className="flex items-center gap-1.5">
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-purple-600"
          />
          <div className="flex items-center gap-0.5">
            <span className="text-sm text-zinc-200 leading-none">
              {label}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center w-4 h-4 hover:bg-zinc-600/30 rounded"
            >
              {isExpanded ? (
                <FaChevronCircleUp className="w-3 h-3 text-zinc-500" />
              ) : (
                <FaChevronCircleDown className="w-3 h-3 text-zinc-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sliders section */}
      <div className="overflow-visible">
        <div 
          className={cn(
            "transition-all duration-150 ease-in-out",
            !isContentVisible ? "h-0 opacity-0 -translate-y-2 -mb-px" : "h-[38px] opacity-100 translate-y-0"
          )}
        >
          <div className="space-y-1 mt-1">
            {/* First Slider */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400 w-[100px] pl-[35px]">{firstSliderLabel}</span>
              <div className="flex-1 overflow-visible relative">
                <DevValueDisplay 
                  value={firstSliderValue} 
                  displayValue={firstDisplayValue} 
                />
                <ValueSlider
                  value={[firstDisplayValue]}
                  min={sliderConfig.displayMin}
                  max={sliderConfig.displayMax}
                  step={sliderConfig.step}
                  onValueChange={([value]: number[]) => {
                    const actualValue = sliderConfig.toActualValue(value);
                    onFirstSliderChange(actualValue);
                  }}
                  onValueCommit={onSliderComplete}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </div>

            {/* Second Slider */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400 w-[100px] pl-[35px]">{secondSliderLabel}</span>
              <div className="flex-1 overflow-visible relative">
                <DevValueDisplay 
                  value={secondSliderValue} 
                  displayValue={secondDisplayValue} 
                />
                <ValueSlider
                  value={[secondDisplayValue]}
                  min={sliderConfig.displayMin}
                  max={sliderConfig.displayMax}
                  step={sliderConfig.step}
                  onValueChange={([value]: number[]) => {
                    const actualValue = sliderConfig.toActualValue(value);
                    onSecondSliderChange(actualValue);
                  }}
                  onValueCommit={onSliderComplete}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 