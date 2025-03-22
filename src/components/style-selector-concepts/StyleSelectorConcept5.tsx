import React from 'react';
import { GraffitiStyle } from '../../types';
import { PencilLine } from 'lucide-react';

interface StyleSelectorConceptProps {
  styles: GraffitiStyle[];
  selectedStyleId: string;
  onStyleSelect: (styleId: string) => void;
}

/**
 * Concept 5: Underline Indicator Design
 * 
 * This concept uses a subtle but effective underline indicator to show
 * the selected item, inspired by modern tab designs and navigation patterns.
 */
export const StyleSelectorConcept5: React.FC<StyleSelectorConceptProps> = ({ 
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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3">
        {styles.map((style) => {
          const isSelected = selectedStyleId === style.id;
          
          return (
            <div
              key={style.id}
              className={`
                relative px-3 py-2 cursor-pointer transition-all overflow-hidden
                ${isSelected 
                  ? 'text-white' 
                  : 'text-zinc-400 hover:text-zinc-200'
                }
                ${!style.available && 'opacity-50 cursor-not-allowed'}
              `}
              onClick={() => style.available && onStyleSelect(style.id)}
            >
              {/* Background for hover state */}
              <div className={`absolute inset-0 bg-zinc-800 rounded-md opacity-0 transition-opacity duration-200 ${
                !isSelected ? 'group-hover:opacity-100' : ''
              }`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="font-medium text-sm">{style.name}</div>
                {style.description && (
                  <div className="text-xs opacity-80 mt-0.5 line-clamp-1">{style.description}</div>
                )}
              </div>
              
              {/* Underline indicator for selected item */}
              <div className={`
                absolute bottom-0 left-0 h-[2px] bg-purple-500 transition-all duration-300 ease-out
                ${isSelected ? 'w-full' : 'w-0'}
              `}></div>
              
              {/* Top dot indicator */}
              <div className={`
                absolute top-0 left-3 w-1 h-1 rounded-full transition-all duration-300
                ${isSelected ? 'bg-purple-500' : 'bg-transparent'}
              `}></div>
            </div>
          );
        })}
      </div>
      
      {/* Style details section */}
      <div className="mt-3 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
        {styles.map((style) => {
          if (style.id !== selectedStyleId) return null;
          
          return (
            <div key={`${style.id}-details`}>
              <div className="text-sm text-zinc-200 font-medium">{style.name}</div>
              {style.description && (
                <div className="text-xs text-zinc-400 mt-1">{style.description}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 