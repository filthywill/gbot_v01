import React from 'react';
import { GraffitiStyle } from '../../types';
import { PencilLine } from 'lucide-react';

interface StyleSelectorConceptProps {
  styles: GraffitiStyle[];
  selectedStyleId: string;
  onStyleSelect: (styleId: string) => void;
}

/**
 * Concept 1: Elevated Selection with Shadow & Scale
 * 
 * This concept uses increased scale and elevation (shadow) to indicate the 
 * selected item. It creates a clear visual hierarchy without needing checkmarks.
 */
export const StyleSelectorConcept1: React.FC<StyleSelectorConceptProps> = ({ 
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
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-lg transform scale-105 z-10'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shadow-sm hover:shadow-md'
              } ${!style.available && 'opacity-50 cursor-not-allowed'}`}
              onClick={() => style.available && onStyleSelect(style.id)}
            >
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