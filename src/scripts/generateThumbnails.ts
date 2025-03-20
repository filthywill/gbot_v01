import { STYLE_PRESETS } from '../data/stylePresets';
import { ProcessedSvg } from '../types';
import { processSvg } from '../utils/svgUtils';
import { letterSvgs } from '../data/letterMappings';
import { fetchSvg } from '../utils/letterUtils';
import { createSvgString } from '../components/GraffitiDisplay/utils/pngExport';
import fs from 'fs';
import path from 'path';

// Function to process a single letter into ProcessedSvg format
const processLetter = async (letter: string): Promise<ProcessedSvg> => {
  const svgPath = letterSvgs[letter.toLowerCase()];
  if (!svgPath) {
    throw new Error(`No SVG found for letter ${letter}`);
  }

  const svgContent = await fetchSvg(svgPath);
  return processSvg(svgContent, letter);
};

export const generateThumbnails = async () => {
  // Create the preset-thumbs directory if it doesn't exist
  const thumbsDir = path.join(process.cwd(), 'public', 'assets', 'preset-thumbs');
  if (!fs.existsSync(thumbsDir)) {
    fs.mkdirSync(thumbsDir, { recursive: true });
  }

  // Process each preset
  for (const preset of STYLE_PRESETS) {
    try {
      // Process the demo text
      const demoText = 'DEMO';
      const processedSvgs = await Promise.all(demoText.split('').map(processLetter));

      // Create SVG string with preset settings
      const svgString = createSvgString(
        document.createElement('div'), // contentRef
        document.createElement('div'), // containerRef
        processedSvgs,
        preset.settings,
        400, // contentWidth
        100, // contentHeight
        1, // scaleFactor
        0.9 // additionalScaleFactor
      );

      // Create filename based on preset ID
      const filename = `th-${preset.id.toLowerCase().replace(/\s+/g, '-')}.svg`;
      const filePath = path.join(thumbsDir, filename);

      // Save the SVG file
      fs.writeFileSync(filePath, svgString, 'utf8');
      console.log(`Generated thumbnail for ${preset.name}: ${filename}`);
    } catch (error) {
      console.error(`Error generating thumbnail for ${preset.name}:`, error);
    }
  }
}; 