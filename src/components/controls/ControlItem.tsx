import React from 'react';
import { ColorPicker } from '../ui/color-picker';
import { ValueSlider } from '../ui/value-slider';
import { DevValueDisplay } from '../ui/dev-value-display';
import { ValueConfig } from '../../utils/sliderValueConversion';
import { ControlContainer } from './ControlContainer';

interface ControlItemProps {
  // Base props
  label: string;
  
  // Feature flags
  hasToggle?: boolean;
  hasColorPicker?: boolean;
  hasSlider?: boolean;
  isCollapsible?: boolean;
  
  // Toggle props
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  
  // Color picker props
  color?: string;
  onColorChange?: (color: string) => void;
  onColorComplete?: () => void;
  
  // Slider props
  value?: number;
  onValueChange?: (value: number) => void;
  onSliderComplete?: () => void;
  valueConfig?: ValueConfig;
  sliderLabel?: string;
}

export const ControlItem: React.FC<ControlItemProps> = ({
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
  // Calculate display value for slider
  const displayValue = valueConfig ? valueConfig.toDisplayValue(value) : value;

  // Create color picker element for header
  const headerRightContent = hasColorPicker ? (
    <div className="w-6 h-6 flex items-center justify-end">
      <ColorPicker
        value={color}
        onChange={onColorChange || (() => {})}
        onChangeComplete={onColorComplete}
        className="w-6 h-6"
      />
    </div>
  ) : undefined;

  // Create slider content
  const sliderContent = hasSlider ? (
    <div className="mt-0.5">
      <div className="flex items-center">
        <span className="text-xs text-zinc-400 w-[65px] pl-[35px]">{sliderLabel}</span>
        <div className="flex-1 overflow-visible relative pr-[28px]">
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
    <ControlContainer
      label={label}
      hasToggle={hasToggle}
      enabled={enabled}
      onToggle={onToggle}
      isCollapsible={isCollapsible}
      headerRightContent={headerRightContent}
      contentHeight={hasSlider ? "h-[18px]" : undefined}
    >
      {sliderContent}
    </ControlContainer>
  );
}; 