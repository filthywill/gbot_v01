# GraffitiSOFT - Project Documentation

## Overview
GraffitiSOFT is a web application for creating customizable graffiti-style text. It allows users to input text, select styles, and apply various customization options to generate graffiti designs. The application processes SVG letter files and arranges them with proper spacing and overlap to create cohesive designs.

## Tech Stack
- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI components with custom styling
- **SVG Processing**: Custom utilities for SVG manipulation and rendering
- **Color Picker**: react-colorful
- **Export**: html2canvas for image export

## Project Structure

### Core Directories
- `src/` - Main source code
  - `components/` - React components
  - `store/` - Zustand state management
  - `hooks/` - Custom React hooks
  - `utils/` - Utility functions for SVG processing
  - `data/` - Configuration data and presets
  - `types.ts` - TypeScript type definitions
  - `App.tsx` - Main application component
- `public/` - Static assets
  - `assets/letters/` - SVG files for each letter

### Key Components

#### App Structure
- `App.tsx` - Main application component that orchestrates other components
- `ModernInputForm.tsx` - Form for text input
- `ModernStyleSelector.tsx` - UI for selecting graffiti styles
- `ModernCustomizationToolbar.tsx` - Toolbar for customization options
- `GraffitiDisplay/` - Components for rendering the graffiti design

#### GraffitiDisplay Components
- `index.tsx` - Main entry point for GraffitiDisplay
- `GraffitiContainer.tsx` - Outer container with sizing logic
- `GraffitiContent.tsx` - Inner content with SVG rendering
- `GraffitiLayers.tsx` - Manages different visual layers (shadow, content)
- `MemoizedGraffitiLayers.tsx` - Performance-optimized rendering
- `HistoryControls.tsx` - Undo/redo functionality
- `ExportControls.tsx` - Controls for exporting designs
- `LoadingIndicator.tsx` - Loading state visuals
- `EmptyState.tsx` - Placeholder when no content exists

### State Management

#### Zustand Store
The application uses Zustand for state management. The main store is defined in `src/store/useGraffitiStore.ts` and includes:

- **Input State**: Text input and display values
- **Style State**: Selected graffiti style
- **Processing State**: Loading states and error handling
- **SVG State**: Processed SVG data
- **Layout State**: Positioning and sizing
- **History State**: Undo/redo functionality
- **Customization State**: Various visual customization options

#### Main State Interface
```typescript
interface GraffitiState {
  // Input and display state
  inputText: string;
  displayInputText: string;
  selectedStyle: string;
  
  // Processing state
  isGenerating: boolean;
  error: string | null;
  processedSvgs: ProcessedSvg[];
  
  // Layout calculations
  positions: number[];
  contentWidth: number;
  contentHeight: number;
  containerScale: number;
  
  // History state for undo/redo
  history: HistoryState[];
  currentHistoryIndex: number;
  isUndoRedoOperation: boolean;
  hasInitialGeneration: boolean;
  
  // Customization options
  customizationOptions: CustomizationOptions;

  // Overlap rules
  overlapRules: Record<string, OverlapRule>;
  defaultOverlap: OverlapRule;
  overlapExceptions: Record<string, string[]>;
  rotationRules: Record<string, Record<string, number>>;
  
  // Actions
  setInputText: (text: string) => void;
  setDisplayInputText: (text: string) => void;
  setSelectedStyle: (styleId: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  setProcessedSvgs: (svgs: ProcessedSvg[]) => void;
  updatePositions: () => void;
  setCustomizationOptions: (options: Partial<CustomizationOptions>) => void;
  
  // History actions
  addToHistory: (newState: HistoryState) => void;
  handleUndoRedo: (newIndex: number) => void;
  
  // Overlap rule actions
  updateOverlapRule: (letter: string, rule: Partial<OverlapRule>) => void;
  updateSpecialCase: (letter: string, targetLetter: string, overlap: number) => void;
  
  // Reset state
  resetState: () => void;
}
```

### Custom Hooks
The application uses several custom hooks to manage complex logic:

- `useGraffitiGeneratorWithZustand.ts` - Main hook that connects UI to Zustand store
- `useSvgCache.ts` - Manages caching of processed SVGs for performance
- `useGraffitiGenerator.ts` - Legacy hook (not actively used)

### SVG Processing Pipeline

The SVG processing is managed through several utility files:

- `svgUtils.ts` - Core utilities for SVG processing, including overlap calculations
- `svgCustomizationUtils.ts` - Utilities for applying visual styles to SVGs
- `svgExpansionUtil.ts` - Utilities for expanding SVGs for special effects
- `svgCache.ts` - Caching mechanism for processed SVGs
- `letterUtils.ts` - Utilities for letter-specific operations

Key functions include:
- `processSvg()` - Processes raw SVG into a structured format
- `findOptimalOverlap()` - Calculates optimal overlap between letter pairs
- `applyCustomizationsToSvg()` - Applies visual styles to SVG content

### Customization Options

The application supports various visual customization options:

- **Background**: Enable/disable and color selection
- **Fill**: Fill color and enable/disable
- **Stroke**: Stroke color, width, and enable/disable
- **Shadow**: Shadow color, offset, blur, opacity
- **Stamp Effect**: Border enhancement with color and width
- **Shine Effect**: Highlight effect with color and opacity
- **Shield Effect**: Additional outline with color and width

These options are defined in the `CustomizationOptions` interface in `types.ts`.

### Letter Rules and Overlap System

The application uses a sophisticated system for determining how letters should overlap:

- `letterRules.ts` - Contains rules for letter overlaps and rotations
- `letterMappings.ts` - Maps characters to specific SVG files

The overlap rules include:
- Default overlaps for each letter
- Special case overlaps for specific letter pairs
- Exception lists for letter combinations

### Debug Tools

The application includes debugging tools:

- `OverlapDebugPanel.tsx` - UI for adjusting letter overlap rules
- Documented workflow in `docs/overlap-debug-workflow.txt`

## Usage Flow

1. User enters text in the input form
2. User selects a graffiti style
3. The application fetches and processes SVG files for each letter
4. Letters are positioned with proper overlap
5. User can customize the appearance using the customization toolbar
6. User can undo/redo changes with history controls
7. User can export the design as an image

## Development Workflow

### Adding New Features
1. Update relevant types in `types.ts`
2. Add new state to the Zustand store if needed
3. Create or update components in the component hierarchy
4. Implement utility functions for new functionality
5. Update the main hook (`useGraffitiGeneratorWithZustand.ts`) to connect state to UI

### Customization System Workflow
1. Define new customization options in `CustomizationOptions` interface
2. Add UI controls in `ModernCustomizationToolbar.tsx`
3. Implement rendering logic in `svgCustomizationUtils.ts`
4. Update the SVG rendering in `GraffitiLayers.tsx`

### Letter Overlap Debugging
1. Use the Overlap Debug Panel to adjust letter overlap rules
2. Save the updated rules from the console
3. Update `letterRules.ts` with the new values

## Performance Considerations

- SVG processing is cached to avoid redundant calculations
- Memoization is used to prevent unnecessary re-renders
- The SVG rendering pipeline is optimized for efficiency
- History states are structured to minimize memory usage

## Future Development

Potential areas for expansion:
- Additional graffiti styles
- More customization options
- Improved export capabilities
- User accounts and saved designs
- Mobile optimization
- Animation effects 