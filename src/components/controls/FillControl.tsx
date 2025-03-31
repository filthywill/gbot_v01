import React from 'react';
import { ControlItem } from './ControlItem';

interface FillControlProps {
  color: string;
  onColorChange: (color: string) => void;
  onColorComplete?: () => void;
}

export const FillControl: React.FC<FillControlProps> = ({
  color,
  onColorChange,
  onColorComplete
}) => {
  return (
    <ControlItem
      label="FILL"
      hasColorPicker={true}
      color={color}
      onColorChange={onColorChange}
      onColorComplete={onColorComplete}
    />
  );
}; 