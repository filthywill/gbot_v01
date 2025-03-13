// src/components/StyleSelector.tsx
import React from 'react';
import { Lock } from 'lucide-react';
import { GraffitiStyle } from '../types';

interface StyleSelectorProps {
  styles: GraffitiStyle[];
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ 
  styles, 
  selectedStyle, 
  onSelectStyle 
}) => {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2">
      {styles.map((style) => (
        <button
          key={style.id}
          onClick={() => style.available && onSelectStyle(style.id)}
          className={`relative py-1 px-2 rounded-lg border-2 transition-all text-center ${
            style.id === selectedStyle
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${!style.available && 'opacity-50 cursor-not-allowed'}`}
        >
          <div className="flex items-center justify-center">
            <span className="font-bold text-xs">{style.name}</span>
            {!style.available && <Lock className="w-3 h-3 text-gray-400 ml-1" />}
          </div>
          <p className="text-xs text-gray-600 line-clamp-1">{style.description}</p>
          {style.id === selectedStyle && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};