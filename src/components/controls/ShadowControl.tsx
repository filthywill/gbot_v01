import React from 'react';
import { EffectControlItem } from './EffectControlItem';
import { shadowHorizontalValueConfig, shadowVerticalValueConfig } from '../../utils/sliderValueConversion';

interface ShadowControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  offsetX: number;
  onOffsetXChange: (x: number) => void;
  offsetY: number;
  onOffsetYChange: (y: number) => void;
  onSliderComplete?: () => void;
}

export const ShadowControl: React.FC<ShadowControlProps> = ({
  enabled,
  onToggle,
  offsetX,
  onOffsetXChange,
  offsetY,
  onOffsetYChange,
  onSliderComplete
}) => {
  return (
    <EffectControlItem
      label="SHADOW"
      enabled={enabled}
      onToggle={onToggle}
      firstSliderLabel="Horizontal"
      firstSliderValue={offsetX}
      onFirstSliderChange={onOffsetXChange}
      secondSliderLabel="Vertical"
      secondSliderValue={offsetY}
      onSecondSliderChange={onOffsetYChange}
      onSliderComplete={onSliderComplete}
      firstSliderConfig={shadowHorizontalValueConfig}
      secondSliderConfig={shadowVerticalValueConfig}
    />
  );
}; 