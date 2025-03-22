import React from 'react';
import { GraffitiStyle } from '../../types';
import { PencilLine } from 'lucide-react';

interface StyleSelectorConceptProps {
  styles: GraffitiStyle[];
  selectedStyleId: string;
  onStyleSelect: (styleId: string) => void;
}

/**
 * Concept 2: Border Highlight with Gradient Accent
 * 
 * This concept uses a distinctive border with gradient accent to clearly 
 * indicate the selected item without using checkmarks or badges.
 */
export const StyleSelectorConcept2: React.FC<StyleSelectorConceptProps> = ({ 
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {styles.map((style) => {
          const isSelected = selectedStyleId === style.id;
          
          return (
            <div
              key={style.id}
              className={`
                relative p-3 rounded-lg cursor-pointer transition-all
                ${isSelected 
                  ? 'bg-zinc-800 border-0 text-zinc-100' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                }
                ${!style.available && 'opacity-50 cursor-not-allowed'}
              `}
              onClick={() => style.available && onStyleSelect(style.id)}
            >
              {/* Gradient border for selected state */}
              {isSelected && (
                <div className="absolute inset-0 rounded-lg p-[2px] -z-10 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600"></div>
              )}
              
              <div className="text-center">
                <div className="font-medium text-sm">{style.name}</div>
                <div className="text-xs opacity-80">{style.description || ''}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 