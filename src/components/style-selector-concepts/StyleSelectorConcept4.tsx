import React from 'react';
import { GraffitiStyle } from '../../types';
import { PencilLine } from 'lucide-react';

interface StyleSelectorConceptProps {
  styles: GraffitiStyle[];
  selectedStyleId: string;
  onStyleSelect: (styleId: string) => void;
}

/**
 * Concept 4: 3D Card Design
 * 
 * This concept uses 3D transformations and perspective to create a more
 * immersive and playful selection experience. The selected card appears
 * to "pop out" from the grid.
 */
export const StyleSelectorConcept4: React.FC<StyleSelectorConceptProps> = ({ 
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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" style={{ perspective: '1000px' }}>
        {styles.map((style) => {
          const isSelected = selectedStyleId === style.id;
          
          return (
            <div
              key={style.id}
              className={`
                p-3 rounded-lg cursor-pointer transition-all duration-300
                ${!style.available && 'opacity-50 cursor-not-allowed'}
              `}
              style={{
                transform: isSelected ? 'translateZ(20px) rotateX(5deg)' : 'translateZ(0) rotateX(0)',
                transformOrigin: 'center bottom',
                transition: 'all 0.3s ease'
              }}
              onClick={() => style.available && onStyleSelect(style.id)}
            >
              {/* Style card with gradient background */}
              <div 
                className={`
                  h-full p-3 rounded-lg shadow-lg transition-all
                  ${isSelected 
                    ? 'bg-gradient-to-br from-purple-600 to-purple-900 text-white border-none' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                  }
                `}
              >
                <div className="text-center">
                  <div className="font-medium text-sm mb-1">{style.name}</div>
                  {style.description && (
                    <div className="text-xs opacity-80">{style.description}</div>
                  )}
                  
                  {/* Bottom accent bar for selected item */}
                  {isSelected && (
                    <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mt-2"></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 