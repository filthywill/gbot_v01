import React from 'react';
import { ModernControlItem } from './ModernControlItem';

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
    <ModernControlItem
      label="FILL"
      hasColorPicker={true}
      color={color}
      onColorChange={onColorChange}
      onColorComplete={onColorComplete}
    />
  );
}; 