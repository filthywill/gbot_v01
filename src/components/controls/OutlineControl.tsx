import React from 'react';
import { ControlItem } from './ControlItem';
import { outlineValueConfig } from '../../utils/sliderValueConversion';

interface OutlineControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  color: string;
  onColorChange: (color: string) => void;
  onColorComplete?: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  onSliderComplete?: () => void;
}

/**
 * OutlineControl component for stroke/outline customization
 * Memoized to prevent unnecessary re-renders during outline interactions
 */
export const OutlineControl: React.FC<OutlineControlProps> = React.memo(({
  enabled,
  onToggle,
  color,
  onColorChange,
  onColorComplete,
  width,
  onWidthChange,
  onSliderComplete
}) => {
  return (
    <ControlItem
      label="OUTLINE"
      hasToggle={true}
      enabled={enabled}
      onToggle={onToggle}
      hasColorPicker={true}
      color={color}
      onColorChange={onColorChange}
      onColorComplete={onColorComplete}
      hasSlider={true}
      isCollapsible={true}
      value={width}
      onValueChange={onWidthChange}
      onSliderComplete={onSliderComplete}
      valueConfig={outlineValueConfig}
      sliderLabel="Size"
    />
  );
}); 