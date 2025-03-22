import React, { useState } from 'react';
import { GraffitiStyle } from '../../types';
import { StyleSelectorConcept1 } from './StyleSelectorConcept1';
import { StyleSelectorConcept2 } from './StyleSelectorConcept2';
import { StyleSelectorConcept3 } from './StyleSelectorConcept3';
import { StyleSelectorConcept4 } from './StyleSelectorConcept4';
import { StyleSelectorConcept5 } from './StyleSelectorConcept5';

// Mock data for demonstration
const mockStyles: GraffitiStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    available: true,
    description: 'Traditional graffiti style with clean lines'
  },
  {
    id: 'wild',
    name: 'Wild Style',
    available: true,
    description: 'Complex, interlocking letters with arrows'
  },
  {
    id: 'bubble',
    name: 'Bubble',
    available: true,
    description: 'Round, bubbly letters with soft edges'
  },
  {
    id: 'blocky',
    name: 'Blocky',
    available: true,
    description: 'Bold, geometric shapes with sharp angles'
  },
  {
    id: 'pixel',
    name: 'Pixel',
    available: false,
    description: 'Digital-inspired design with pixel elements'
  }
];

export const StyleSelectorShowcase: React.FC = () => {
  const [selectedStyleId, setSelectedStyleId] = useState<string>('classic');
  
  return (
    <div className="p-6 bg-zinc-900 text-zinc-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-center">Style Selector Concepts</h1>
      
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-purple-300">Concept 1: Elevated Selection with Shadow & Scale</h2>
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <StyleSelectorConcept1 
              styles={mockStyles}
              selectedStyleId={selectedStyleId}
              onStyleSelect={setSelectedStyleId}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-purple-300">Concept 2: Border Highlight with Gradient Accent</h2>
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <StyleSelectorConcept2
              styles={mockStyles}
              selectedStyleId={selectedStyleId}
              onStyleSelect={setSelectedStyleId}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-purple-300">Concept 3: Pill Design / Segmented Control</h2>
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <StyleSelectorConcept3
              styles={mockStyles}
              selectedStyleId={selectedStyleId}
              onStyleSelect={setSelectedStyleId}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-purple-300">Concept 4: 3D Card Design</h2>
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <StyleSelectorConcept4
              styles={mockStyles}
              selectedStyleId={selectedStyleId}
              onStyleSelect={setSelectedStyleId}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-purple-300">Concept 5: Underline Indicator Design</h2>
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <StyleSelectorConcept5
              styles={mockStyles}
              selectedStyleId={selectedStyleId}
              onStyleSelect={setSelectedStyleId}
            />
          </div>
        </div>
      </div>

      <div className="mt-12 p-4 bg-zinc-800 rounded-lg max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Design Notes & Considerations</h2>
        <ul className="space-y-2 text-sm">
          <li><strong>Concept 1:</strong> Uses scale and elevation to create visual hierarchy. The selected item appears larger and raised above others, making it immediately stand out.</li>
          <li><strong>Concept 2:</strong> Uses a gradient border to highlight the selected item. This creates a distinctive look without relying on checkmarks or other indicators.</li>
          <li><strong>Concept 3:</strong> Takes inspiration from pill-based selectors and segmented controls, popular in mobile UI. The horizontal scrolling layout works well for a limited number of options.</li>
          <li><strong>Concept 4:</strong> Uses subtle 3D transformations to create an immersive feeling. The selected card appears to "pop out" of the screen.</li>
          <li><strong>Concept 5:</strong> Uses a minimal underline indicator approach, popular in modern web design for tabs and navigation. The details panel below provides additional context for the selected item.</li>
        </ul>
      </div>
    </div>
  );
}; 