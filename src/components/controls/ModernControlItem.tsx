import React from 'react';
import { ColorPicker } from '../ui/color-picker';
import { ValueSlider } from '../ui/value-slider';
import { DevValueDisplay } from '../ui/dev-value-display';
import { ValueConfig } from '../../utils/sliderValueConversion';
import { BaseControlItem } from './BaseControlItem';

/**
 * ModernControlItem is a specialized control component that extends BaseControlItem
 * with color picker and single slider functionality.
 * 
 * It's used for controls like:
 * - Background (toggle + color)
 * - Fill (color only)
 * - Outline (toggle + color + width slider)
 * - Forcefield (toggle + color + width slider)
 * 
 * This component handles value conversion between display values (what the user sees)
 * and actual values (what the application uses).
 */
interface ModernControlItemProps {
  // Base props
  /** Label displayed next to the control */
  label: string;
  
  // Feature flags
  /** Whether this control has a toggle switch */
  hasToggle?: boolean;
  /** Whether this control has a color picker */
  hasColorPicker?: boolean;
  /** Whether this control has a slider */
  hasSlider?: boolean;
  /** Whether this control can be collapsed/expanded */
  isCollapsible?: boolean;
  
  // Toggle props
  /** Current enabled state of the toggle switch */
  enabled?: boolean;
  /** Callback when toggle state changes */
  onToggle?: (enabled: boolean) => void;
  
  // Color picker props
  /** Current color value */
  color?: string;
  /** Callback when color changes */
  onColorChange?: (color: string) => void;
  /** Callback when color change is completed */
  onColorComplete?: () => void;
  
  // Slider props
  /** Current slider value (actual value, not display value) */
  value?: number;
  /** Callback when slider value changes */
  onValueChange?: (value: number) => void;
  /** Callback when slider change is completed */
  onSliderComplete?: () => void;
  /** Configuration for value conversion between display and actual values */
  valueConfig?: ValueConfig;
  /** Label displayed next to the slider */
  sliderLabel?: string;
}

/**
 * A control component that provides a toggle, color picker, and single slider.
 * Used for controls that need a single adjustable value and/or color selection.
 */
export const ModernControlItem: React.FC<ModernControlItemProps> = ({
  label,
  hasToggle = false,
  hasColorPicker = false,
  hasSlider = false,
  isCollapsible = false,
  enabled = false,
  onToggle,
  color = '#000000',
  onColorChange,
  onColorComplete,
  value = 0,
  onValueChange,
  onSliderComplete,
  valueConfig,
  sliderLabel = 'Size'
}) => {
  const displayValue = valueConfig ? valueConfig.toDisplayValue(value) : value;

  // Prepare color picker for header right content
  const headerRightContent = hasColorPicker ? (
    <ColorPicker
      value={color}
      onChange={onColorChange || (() => {})}
      onChangeComplete={onColorComplete}
      className="w-6 h-6"
    />
  ) : undefined;

  // Prepare slider content
  const sliderContent = hasSlider ? (
    <div className="mt-1.5">
      <div className="grid grid-cols-[65px_1fr] items-center gap-3.5">
        <span className="text-xs text-zinc-400 pl-[35px] -mt-1">{sliderLabel}</span>
        <div className="relative max-w-[250px]">
          {valueConfig && <DevValueDisplay value={value} displayValue={displayValue} />}
          <ValueSlider
            value={[displayValue]}
            min={valueConfig?.displayMin ?? 0}
            max={valueConfig?.displayMax ?? 100}
            step={1}
            onValueChange={([newDisplayValue]) => {
              if (valueConfig && onValueChange) {
                const actualValue = valueConfig.toActualValue(newDisplayValue);
                onValueChange(actualValue);
              }
            }}
            onValueCommit={onSliderComplete}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <BaseControlItem
      label={label}
      hasToggle={hasToggle}
      isCollapsible={isCollapsible}
      enabled={enabled}
      onToggle={onToggle}
      headerRightContent={headerRightContent}
      contentSlot={sliderContent}
      bottomPadding={hasSlider}
    />
  );
}; 