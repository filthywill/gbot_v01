import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a virtual DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  contentType: 'text/html',
  pretendToBeVisual: true,
});

// Set up the global environment
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.CSSStyleDeclaration = dom.window.CSSStyleDeclaration;

// Now we can import our modules that require browser APIs
import { STYLE_PRESETS } from '../src/data/stylePresets';
import { processSvg } from '../src/utils/svgUtils';
import { letterSvgs } from '../src/data/letterMappings';
import { fetchSvg } from '../src/utils/letterUtils';
import { createSvgString } from '../src/components/GraffitiDisplay/utils/pngExport';
import { ProcessedSvg } from '../src/types';

// Function to process a single letter into ProcessedSvg format
const processLetter = async (letter: string): Promise<ProcessedSvg> => {
  const svgPath = letterSvgs[letter.toLowerCase()];
  if (!svgPath) {
    throw new Error(`No SVG found for letter ${letter}`);
  }

  const svgContent = await fetchSvg(svgPath);
  return processSvg(svgContent, letter);
};

const generateThumbnails = async () => {
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

// Run the thumbnail generation
generateThumbnails().catch(console.error); 