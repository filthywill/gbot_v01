import { StylePreset, STYLE_PRESETS } from '../data/stylePresets';
import { ProcessedSvg, CustomizationOptions } from '../types';
import { createSvgString } from '../components/GraffitiDisplay/utils/pngExport';
import fs from 'fs';
import path from 'path';

// Function to process a single letter into ProcessedSvg format
// This is a simplified version - you'll need to implement the actual letter processing
const processLetter = (letter: string): ProcessedSvg => {
  // Implement your letter processing logic here
  // This should return a ProcessedSvg object
  return {
    svg: '', // Add your SVG string here
    width: 100,
    height: 100,
    bounds: {
      left: 0,
      right: 100,
      top: 0,
      bottom: 100
    },
    pixelData: [[true]],
    verticalPixelRanges: [{ top: 0, bottom: 100, density: 1 }],
    scale: 1,
    letter
  };
};

export const generatePresetThumbnails = async () => {
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
      const processedSvgs = demoText.split('').map(processLetter);

      // Create refs (these would normally be React refs)
      const contentRef = {
        current: document.createElement('div')
      };
      const containerRef = {
        current: document.createElement('div')
      };

      // Set up dimensions
      const contentWidth = 400;
      const contentHeight = 100;
      const scaleFactor = 1;
      const additionalScaleFactor = 0.9;

      // Generate SVG string
      const svgString = createSvgString(
        contentRef.current,
        containerRef.current,
        processedSvgs,
        preset.settings,
        contentWidth,
        contentHeight,
        scaleFactor,
        additionalScaleFactor
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