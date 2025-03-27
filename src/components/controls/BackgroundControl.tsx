import React, { useEffect, useState } from 'react';
import { ModernControlItem } from './ModernControlItem';

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
    <ModernControlItem
      label="BG"
      hasToggle={true}
      hasColorPicker={true}
      isCollapsible={false}
      enabled={enabled}
      onToggle={onToggle}
      color={color}
      onColorChange={onColorChange}
      onColorComplete={onColorComplete}
    />
  );
}; 