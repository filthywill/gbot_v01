import React from 'react';
import { ValueSlider } from '../ui/value-slider';
import { DevValueDisplay } from '../ui/dev-value-display';
import { ValueConfig } from '../../utils/sliderValueConversion';
import { ControlContainer } from './ControlContainer';

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
  sliderConfig?: ValueConfig;
  firstSliderConfig?: ValueConfig;
  secondSliderConfig?: ValueConfig;
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
  sliderConfig,
  firstSliderConfig,
  secondSliderConfig
}) => {
  // Use appropriate slider configs based on what's provided
  const firstConfig = firstSliderConfig || sliderConfig;
  const secondConfig = secondSliderConfig || sliderConfig;

  if (!firstConfig || !secondConfig) {
    console.error('No slider configuration provided for EffectControlItem');
    return null;
  }

  // Convert actual values to display values for sliders
  const firstDisplayValue = firstConfig.toDisplayValue(firstSliderValue);
  const secondDisplayValue = secondConfig.toDisplayValue(secondSliderValue);

  // Create dual slider content
  const dualSliderContent = (
    <div className="space-y-1 mt-1">
      {/* First Slider */}
      <div className="flex items-center">
        <span className="text-xs text-zinc-400 w-[100px] pl-[35px]">{firstSliderLabel}</span>
        <div className="flex-1 overflow-visible relative pt-[6px]">
          <DevValueDisplay 
            value={firstSliderValue} 
            displayValue={firstDisplayValue} 
          />
          <ValueSlider
            value={[firstDisplayValue]}
            min={firstConfig.displayMin}
            max={firstConfig.displayMax}
            step={firstConfig.step}
            onValueChange={([value]: number[]) => {
              const actualValue = firstConfig.toActualValue(value);
              onFirstSliderChange(actualValue);
            }}
            onValueCommit={onSliderComplete}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>
      </div>

      {/* Second Slider */}
      <div className="flex items-center">
        <span className="text-xs text-zinc-400 w-[100px] pl-[35px]">{secondSliderLabel}</span>
        <div className="flex-1 overflow-visible relative pt-[6px]">
          <DevValueDisplay 
            value={secondSliderValue} 
            displayValue={secondDisplayValue} 
          />
          <ValueSlider
            value={[secondDisplayValue]}
            min={secondConfig.displayMin}
            max={secondConfig.displayMax}
            step={secondConfig.step}
            onValueChange={([value]: number[]) => {
              const actualValue = secondConfig.toActualValue(value);
              onSecondSliderChange(actualValue);
            }}
            onValueCommit={onSliderComplete}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>
      </div>
    </div>
  );

  return (
    <ControlContainer
      label={label}
      hasToggle={true}
      enabled={enabled}
      onToggle={onToggle}
      isCollapsible={true}
      contentHeight="h-[38px]"
    >
      {dualSliderContent}
    </ControlContainer>
  );
}; 