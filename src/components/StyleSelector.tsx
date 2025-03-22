// src/components/StyleSelector.tsx
import React from 'react';
import { GraffitiStyle } from '../types';
import { PencilLine } from 'lucide-react';

interface StyleSelectorProps {
  styles: GraffitiStyle[];
  selectedStyleId: string;
  onStyleSelect: (styleId: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ 
  styles,
  selectedStyleId, 
  onStyleSelect
}) => {
  return (
    <div className="mb-3">
      <div className="font-medium text-zinc-200 flex items-center mb-1.5 gap-1">
        <PencilLine className="w-4 h-4" />
        <span>Style</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {styles.map((style) => {
          const isSelected = selectedStyleId === style.id;
          
          return (
            <div
              key={style.id}
              className={`px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shadow-sm'
              } ${!style.available && 'opacity-50 cursor-not-allowed'}`}
              onClick={() => style.available && onStyleSelect(style.id)}
            >
              <div className="text-center">
                <div className="font-medium text-xs">{style.name}</div>
                {style.description && (
                  <div className="text-[10px] opacity-80 line-clamp-1">{style.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};