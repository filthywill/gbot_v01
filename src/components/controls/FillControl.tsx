import React from 'react';
import { ControlItem } from './ControlItem';

interface FillControlProps {
  color: string;
  onColorChange: (color: string) => void;
  onColorComplete?: () => void;
}

/**
 * FillControl component for selecting fill color
 * Memoized to prevent unnecessary re-renders during color picker interactions
 */
export const FillControl: React.FC<FillControlProps> = React.memo(({
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
}); 