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
    <div className="mb-1">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {styles.map((style) => {
          const isSelected = style.id === selectedStyle;
          
          return (
            <button
              key={style.id}
              onClick={() => style.available && onSelectStyle(style.id)}
              className={`
                relative px-2 py-0 rounded-md transition-all text-center shadow-sm
                ${isSelected 
                  ? 'bg-brand-primary-600 text-control' 
                  : 'bg-control hover:bg-control-hover text-control-secondary border border-zinc-600 hover:border-zinc-500'
                } 
                ${!style.available && 'opacity-60 cursor-not-allowed'}
              `}
              disabled={!style.available}
            >
              <div className="flex items-center justify-center">
                <span className={`font-medium ${isSelected ? 'text-control' : ''}`}>
                  {style.name}
                </span>
                {!style.available && <Lock className="w-3 h-3 ml-1 opacity-70" />}
              </div>
              
              {style.description && (
                <p className={`text-xs ${isSelected ? 'text-control/80' : 'text-control-secondary'} line-clamp-1 text-[10px]`}>
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