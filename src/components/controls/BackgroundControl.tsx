import React from 'react';
import { ControlItem } from './ControlItem';

interface BackgroundControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  color: string;
  onColorChange: (color: string) => void;
  onColorComplete?: () => void;
}

export const BackgroundControl: React.FC<BackgroundControlProps> = ({
  enabled,
  onToggle,
  color,
  onColorChange,
  onColorComplete
}) => {
  return (
    <ControlItem
      label="BG"
      hasToggle={true}
      enabled={enabled}
      onToggle={onToggle}
      hasColorPicker={true}
      color={color}
      onColorChange={onColorChange}
      onColorComplete={onColorComplete}
    />
  );
}; 