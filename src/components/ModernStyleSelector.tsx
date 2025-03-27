import React from 'react';
import { Lock } from 'lucide-react';
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
    <div className="mb-1">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {styles.map((style) => {
          const isSelected = style.id === selectedStyle;
          
          return (
            <button
              key={style.id}
              onClick={() => style.available && onSelectStyle(style.id)}
              className={`
                relative px-2 py-1 rounded-md transition-all text-center shadow-sm
                ${isSelected 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-zinc-300'
                } 
                ${!style.available && 'opacity-60 cursor-not-allowed'}
              `}
              disabled={!style.available}
            >
              <div className="flex items-center justify-center">
                <span className={`font-medium text-xs ${isSelected ? 'text-white' : ''}`}>
                  {style.name}
                </span>
                {!style.available && <Lock className="w-3 h-3 ml-1 opacity-70" />}
              </div>
              
              {style.description && (
                <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-zinc-600'} line-clamp-1 text-[10px]`}>
                  {style.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};