# SVG Optimization for Graffiti Generator

This module provides SVGO-based SVG optimization specifically tailored for the Graffiti Generator application.

## Features

- **Nearly 50% file size reduction** - Significantly reduces SVG file sizes while maintaining visual quality
- **Preserves original filenames** - Optimized SVGs maintain the same filenames for seamless integration
- **Non-invasive integration** - Multiple integration options that don't require changing existing code
- **Error handling** - Automatically falls back to unoptimized SVGs if optimization fails
- **Visual comparison tool** - Test the visual impact of optimization on your SVGs

## Usage

### Direct Replacement Method

The easiest way to integrate optimization is to replace the import in your export hook:

```typescript
// Change this import:
import { exportAsSvg } from '../utils/svgExport';

// To this:
import { exportAsSvg } from '../../../svg-optimizer/optimizedSvgExport';
```

### Toggle Option Method

To add user control over optimization:

1. Add an option to your preferences store:

```typescript
// In your Zustand store
interface PreferenceState {
  // ... existing preferences
  optimizeSvgs: boolean;
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
  // ... existing state
  optimizeSvgs: true,
  setOptimizeSvgs: (value: boolean) => set({ optimizeSvgs: value }),
}));
```

2. Use conditional imports:

```typescript
import { exportAsSvg as originalExportAsSvg } from '../utils/svgExport';
import { exportAsSvg as optimizedExportAsSvg } from '../../../svg-optimizer/optimizedSvgExport';
import { usePreferenceStore } from '../../../stores/preferenceStore';

// In your component or hook:
const shouldOptimize = usePreferenceStore(state => state.optimizeSvgs);

const saveAsSvg = useCallback(() => {
  const exportFunction = shouldOptimize ? optimizedExportAsSvg : originalExportAsSvg;
  
  exportFunction(
    contentRef.current,
    containerRef.current,
    processedSvgs,
    customizationOptions,
    contentWidth,
    contentHeight,
    scaleFactor,
    additionalScaleFactor,
    inputText
  );
}, [shouldOptimize, /* ...other deps */]);
```

3. Add a UI toggle in your settings component:

```tsx
import { usePreferenceStore } from '../../../stores/preferenceStore';
import { Switch } from '@/components/ui/switch';

const SettingsPanel = () => {
  const [optimizeSvgs, setOptimizeSvgs] = usePreferenceStore(
    state => [state.optimizeSvgs, state.setOptimizeSvgs]
  );
  
  return (
    <div className="settings-panel">
      {/* Other settings */}
      <div className="flex items-center justify-between">
        <label htmlFor="optimize-svgs">Optimize SVGs (50% smaller files)</label>
        <Switch 
          id="optimize-svgs"
          checked={optimizeSvgs}
          onCheckedChange={setOptimizeSvgs}
        />
      </div>
    </div>
  );
};
```

## Optimization Approach

The SVG optimizer uses the `qualityCompressor` preset, which provides:

- **~50% file size reduction** while maintaining visual quality
- **Preservation of critical SVG elements** like viewBox, transforms, and path precision
- **Balance between compression and visual fidelity**

## How It Works

The optimization integrates in one of two ways:

1. **XMLSerializer Intercept Method**: Temporarily overrides the `XMLSerializer.prototype.serializeToString` method to intercept and optimize SVG nodes before they're exported.

2. **Direct Implementation Method**: Provides a complete reimplementation of the SVG export that applies optimization as part of the process.

Both methods maintain the original SVG structure and ensure proper visual rendering after optimization.

## Testing Your SVGs

To test optimization on your SVGs:

1. Place test SVGs in the `svg-optimizer/test-svgs` directory
2. Run the test script:
   ```
   cd svg-optimizer
   node test-svg-optimization.js
   ```
3. View the optimized SVGs in the `svg-optimizer/optimized-svgs` directory
4. Open `svg-comparison.html` in a browser to visually compare original and optimized SVGs

## SVGO Configuration

The module uses SVGO v3.x with carefully selected plugins to maintain visual quality while maximizing compression:

- Preserves `viewBox` attributes
- Maintains precision for path data and numeric values
- Sorts attributes for better compression
- Preserves critical attributes for proper SVG rendering

## Performance Impact

The optimization process adds approximately 5-20ms of overhead to the SVG export process, which is negligible for most use cases. The resulting SVGs load faster and consume less bandwidth when shared.

## Browser Compatibility

The optimization is compatible with all modern browsers that support SVG, and the resulting optimized SVGs maintain compatibility with all SVG viewers and editors.

## Troubleshooting

If you encounter issues with the optimization:

1. Check the console for error messages
2. Verify that the SVGO dependencies are correctly installed
3. Check if your SVGs have any unsupported features

## Dependencies

- SVGO v3.x: The core SVG optimization library

## Installation

1. Ensure SVGO is installed:
   ```
   npm install svgo@latest
   ```

2. Copy the `svg-optimizer` directory into your project
3. Import and use the optimization functions as described above

## Credits

This SVG optimization module was created specifically for the Graffiti Generator project to improve performance and reduce file sizes while maintaining visual quality. 