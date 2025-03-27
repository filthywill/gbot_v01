import React from 'react';
import { ValueSlider } from '../ui/value-slider';
import { DevValueDisplay } from '../ui/dev-value-display';
import { ValueConfig } from '../../utils/sliderValueConversion';
import { BaseControlItem } from './BaseControlItem';

/**
 * EffectControlItem is a specialized control component that extends BaseControlItem
 * with dual slider functionality for 2D effects.
 * 
 * It's used for controls that need two adjustable values, such as:
 * - Shadow (horizontal and vertical offset)
 * - Position (x and y coordinates)
 * 
 * This component handles value conversion between display values (what the user sees)
 * and actual values (what the application uses) for both sliders using the same
 * conversion configuration.
 */
interface EffectControlItemProps {
  /** Label displayed next to the control */
  label: string;
  /** Current enabled state of the toggle switch */
  enabled: boolean;
  /** Callback when toggle state changes */
  onToggle: (enabled: boolean) => void;
  /** Label for the first slider (usually horizontal) */
  firstSliderLabel: string;
  /** Current value for the first slider (actual value) */
  firstSliderValue: number;
  /** Callback when first slider value changes */
  onFirstSliderChange: (value: number) => void;
  /** Label for the second slider (usually vertical) */
  secondSliderLabel: string;
  /** Current value for the second slider (actual value) */
  secondSliderValue: number;
  /** Callback when second slider value changes */
  onSecondSliderChange: (value: number) => void;
  /** Callback when slider change is completed */
  onSliderComplete?: () => void;
  /** Configuration for value conversion between display and actual values */
  sliderConfig: ValueConfig;
  /** Whether this control can be collapsed/expanded */
  isCollapsible?: boolean;
}

/**
 * A control component that provides a toggle and dual sliders.
 * Used for 2D effect controls like shadow offset (horizontal/vertical).
 */
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
  isCollapsible = true
}) => {
  // Convert actual values to display values for sliders
  const firstDisplayValue = sliderConfig.toDisplayValue(firstSliderValue);
  const secondDisplayValue = sliderConfig.toDisplayValue(secondSliderValue);

  // Prepare dual slider content
  const dualSliderContent = (
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
  );

  return (
    <BaseControlItem
      label={label}
      hasToggle={true}
      isCollapsible={isCollapsible}
      enabled={enabled}
      onToggle={onToggle}
      contentSlot={dualSliderContent}
      contentHeight="h-[38px]"
    />
  );
}; 