import React from 'react';
import { ControlItem } from './ControlItem';
import { forcefieldValueConfig } from '../../utils/sliderValueConversion';

interface ShieldControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  color: string;
  onColorChange: (color: string) => void;
  onColorComplete?: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  onSliderComplete?: () => void;
}

export const ShieldControl: React.FC<ShieldControlProps> = ({
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
      label="FORCEFIELD"
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
      valueConfig={forcefieldValueConfig}
      sliderLabel="Size"
    />
  );
}; 