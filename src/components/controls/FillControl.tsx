import React from 'react';
import { ColorPicker } from '../ui/color-picker';

interface FillControlProps {
  fillColor: string;
  onColorChange: (color: string) => void;
  onColorChangeComplete: () => void;
}

export const FillControl: React.FC<FillControlProps> = ({
  fillColor,
  onColorChange,
  onColorChangeComplete
}) => {
  return (
    <div className="bg-zinc-700 rounded-md mb-1 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7"></div> {/* Spacer to align with other controls */}
          <label className="text-xs font-medium text-zinc-200">Fill</label>
        </div>
        <ColorPicker
          value={fillColor}
          onChange={(color) => onColorChange(color)}
          onChangeComplete={onColorChangeComplete}
        />
      </div>
    </div>
  );
}; 