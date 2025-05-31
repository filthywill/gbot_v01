import React from 'react';
import { ControlItem } from './ControlItem';

interface BackgroundControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  color: string;
  onColorChange: (color: string) => void;
  onColorComplete?: () => void;
}

/**
 * BackgroundControl component for background customization
 * Memoized to prevent unnecessary re-renders during background interactions
 */
export const BackgroundControl: React.FC<BackgroundControlProps> = React.memo(({
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
      hasColorPicker={true}
      enabled={enabled}
      onToggle={onToggle}
      color={color}
      onColorChange={onColorChange}
      onColorComplete={onColorComplete}
    />
  );
}); 