import React from 'react';
import { GraffitiStyle } from '../../types';
import { PencilLine } from 'lucide-react';

interface StyleSelectorConceptProps {
  styles: GraffitiStyle[];
  selectedStyleId: string;
  onStyleSelect: (styleId: string) => void;
}

/**
 * Concept 3: Segmented Control / Pill Design
 * 
 * This concept takes inspiration from segmented controls and pill selectors,
 * using a more compact horizontal layout with distinct visual differences
 * for the selected state.
 */
export const StyleSelectorConcept3: React.FC<StyleSelectorConceptProps> = ({ 
  styles,
  selectedStyleId, 
  onStyleSelect
}) => {
  return (
    <div className="mb-4">
      <div className="font-medium text-zinc-200 flex items-center mb-2 gap-1">
        <PencilLine className="w-4 h-4" />
        <span>Style</span>
      </div>
      
      {/* Horizontal scrollable container */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex space-x-2">
          {styles.map((style) => {
            const isSelected = selectedStyleId === style.id;
            
            return (
              <div
                key={style.id}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full cursor-pointer transition-all
                  ${isSelected 
                    ? 'bg-purple-600 text-white shadow' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }
                  ${!style.available && 'opacity-50 cursor-not-allowed'}
                `}
                onClick={() => style.available && onStyleSelect(style.id)}
              >
                <div className="whitespace-nowrap">
                  <span className="font-medium text-sm">{style.name}</span>
                  {style.description && (
                    <span className="hidden md:inline-block text-xs opacity-80 ml-1">
                      • {style.description}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Grid layout for descriptions on smaller screens */}
      <div className="grid grid-cols-2 gap-2 mt-2 md:hidden">
        {styles.map((style) => {
          const isSelected = selectedStyleId === style.id;
          
          if (!style.description) return null;
          
          return (
            <div 
              key={`${style.id}-desc`}
              className={`
                text-xs p-2 rounded-md border border-zinc-700
                ${isSelected ? 'border-purple-500 bg-zinc-800' : 'bg-zinc-800/50'}
              `}
            >
              <span className="font-medium">{style.name}:</span>{' '}
              <span className="opacity-80">{style.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 