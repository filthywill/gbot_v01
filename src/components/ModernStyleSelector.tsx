import React from 'react';
import { Lock, Check } from 'lucide-react';
import { GraffitiStyle } from '../types';

interface ModernStyleSelectorProps {
  styles: GraffitiStyle[];
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
}

export const ModernStyleSelector: React.FC<ModernStyleSelectorProps> = ({ 
  styles, 
  selectedStyle, 
  onSelectStyle 
}) => {
  return (
    <div className="mb-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
        {styles.map((style) => {
          const isSelected = style.id === selectedStyle;
          
          return (
            <button
              key={style.id}
              onClick={() => style.available && onSelectStyle(style.id)}
              className={`
                relative py-1 px-2 rounded-md border transition-all text-center
                ${isSelected 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                } 
                ${!style.available && 'opacity-60 cursor-not-allowed'}
              `}
              disabled={!style.available}
            >
              <div className="flex items-center justify-center">
                <span className={`font-medium text-xs ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                  {style.name}
                </span>
                {!style.available && <Lock className="w-3 h-3 text-gray-400 ml-1" />}
              </div>
              
              <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{style.description}</p>
              
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}; 