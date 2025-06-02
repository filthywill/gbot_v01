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
  const handleKeyDown = (e: React.KeyboardEvent, styleId: string) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = styles.findIndex(style => style.id === selectedStyle);
      let newIndex;
      
      if (e.key === 'ArrowLeft') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : styles.length - 1;
      } else {
        newIndex = currentIndex < styles.length - 1 ? currentIndex + 1 : 0;
      }
      
      // Skip disabled styles
      while (!styles[newIndex].available) {
        if (e.key === 'ArrowLeft') {
          newIndex = newIndex > 0 ? newIndex - 1 : styles.length - 1;
        } else {
          newIndex = newIndex < styles.length - 1 ? newIndex + 1 : 0;
        }
      }
      
      onSelectStyle(styles[newIndex].id);
      
      // Focus the newly selected button
      const newButton = document.querySelector(`[data-style-id="${styles[newIndex].id}"]`) as HTMLButtonElement;
      if (newButton) {
        newButton.focus();
      }
    }
  };

  return (
    <div className="mb-1">
      <div 
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Choose graffiti style"
      >
        {styles.map((style) => {
          const isSelected = style.id === selectedStyle;
          
          return (
            <button
              key={style.id}
              data-style-id={style.id}
              onClick={() => style.available && onSelectStyle(style.id)}
              onKeyDown={(e) => handleKeyDown(e, style.id)}
              className={`
                relative px-2 py-0 rounded-md transition-all text-center shadow-sm
                ${isSelected 
                  ? 'bg-brand-primary-600 text-control' 
                  : 'bg-control hover:bg-control-hover text-control-secondary border border-zinc-600 hover:border-zinc-500'
                } 
                ${!style.available && 'opacity-60 cursor-not-allowed'}
              `}
              disabled={!style.available}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${style.name} style${style.description ? `: ${style.description}` : ''}${!style.available ? ' (unavailable)' : ''}`}
              tabIndex={isSelected ? 0 : -1}
              aria-describedby={style.description ? `style-desc-${style.id}` : undefined}
            >
              <div className="flex items-center justify-center">
                <span className={`font-medium ${isSelected ? 'text-control' : ''}`}>
                  {style.name}
                </span>
                {!style.available && <Lock className="w-3 h-3 ml-1 opacity-70" aria-hidden="true" />}
              </div>
              
              {style.description && (
                <p 
                  id={`style-desc-${style.id}`}
                  className={`text-xs ${isSelected ? 'text-control/80' : 'text-control-secondary'} line-clamp-1 text-[10px]`}
                >
                  {style.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
      {/* Screen reader announcement for style changes */}
      <div className="sr-only" aria-live="polite" role="status">
        {selectedStyle && `Selected style: ${styles.find(s => s.id === selectedStyle)?.name}`}
      </div>
    </div>
  );
};