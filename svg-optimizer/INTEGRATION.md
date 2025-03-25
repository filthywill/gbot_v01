# Integrating SVG Optimization into Graffiti Generator

This guide provides step-by-step instructions for integrating the SVG optimization functionality into the main Graffiti Generator application.

## Option 1: Direct Import Replacement (Recommended)

This method is the simplest approach and requires minimal changes to your codebase.

### Step 1: Update the Import in your SVG Export Hook

Locate the file where you import the `exportAsSvg` function, typically in `src/components/GraffitiDisplay/hooks/useGraffitiExport.ts`:

```typescript
// Change this import:
import { exportAsSvg } from '../utils/svgExport';

// To this:
import { exportAsSvg } from '../../../svg-optimizer/optimizedSvgExport';
```

That's it! The optimization will now be applied automatically whenever an SVG is exported, reducing file sizes by approximately 50% while maintaining visual quality.

## Option 2: User-Controlled Optimization Toggle

This approach allows users to enable/disable optimization through the UI.

### Step 1: Add an Optimization Toggle to Your Preference Store

```typescript
// In src/stores/preferenceStore.ts
import { create } from 'zustand';

interface PreferenceState {
  // Existing preferences...
  optimizeSvgs: boolean;
  setOptimizeSvgs: (value: boolean) => void;
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
  // Existing state...
  optimizeSvgs: true, // Enabled by default
  setOptimizeSvgs: (value: boolean) => set({ optimizeSvgs: value }),
}));
```

### Step 2: Add a UI Toggle to Your Settings Component

```tsx
// In src/components/Settings/SettingsPanel.tsx
import { usePreferenceStore } from '@/stores/preferenceStore';
import { Switch } from '@/components/ui/switch';

const SettingsPanel = () => {
  const optimizeSvgs = usePreferenceStore(state => state.optimizeSvgs);
  const setOptimizeSvgs = usePreferenceStore(state => state.setOptimizeSvgs);
  
  return (
    <div className="settings-panel">
      {/* Other settings... */}
      
      <div className="setting-item flex items-center justify-between py-2">
        <div>
          <label 
            htmlFor="optimize-svgs" 
            className="text-sm font-medium"
          >
            Optimize SVGs
          </label>
          <p className="text-xs text-muted-foreground">
            Reduces file size by ~50% when saving SVGs
          </p>
        </div>
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

### Step 3: Conditionally Apply Optimization in Your Export Hook

```typescript
// In src/components/GraffitiDisplay/hooks/useGraffitiExport.ts
import { useCallback } from 'react';
import { exportAsSvg as originalExportAsSvg } from '../utils/svgExport';
import { exportAsSvg as optimizedExportAsSvg } from '../../../svg-optimizer/optimizedSvgExport';
import { usePreferenceStore } from '@/stores/preferenceStore';

export const useGraffitiExport = (
  // existing params...
) => {
  const optimizeSvgs = usePreferenceStore(state => state.optimizeSvgs);
  
  const saveAsSvg = useCallback(() => {
    if (!contentRef.current || !containerRef.current) return;
    
    const exportFunction = optimizeSvgs ? optimizedExportAsSvg : originalExportAsSvg;
    
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
  }, [
    contentRef, 
    containerRef, 
    processedSvgs, 
    customizationOptions, 
    contentWidth, 
    contentHeight, 
    scaleFactor, 
    additionalScaleFactor, 
    inputText,
    optimizeSvgs // Include this in dependencies
  ]);
  
  // Rest of the hook...
  
  return { saveAsSvg, /* other exports... */ };
};
```

## Option 3: Pass Optimization Flag to Standard Export Function

This approach requires modifying the original export function to accept an optimization flag.

### Step 1: Add an Optional Parameter to the Original Export Function

```typescript
// In src/components/GraffitiDisplay/utils/svgExport.ts
import { optimize } from 'svgo';

// Import the optimization function from our module
import { optimizeSvgString } from '../../../svg-optimizer/optimizedSvgExport';

export const exportAsSvg = (
  contentRef: HTMLDivElement,
  containerRef: HTMLDivElement,
  processedSvgs: ProcessedSvg[],
  customizationOptions: CustomizationOptions,
  contentWidth: number,
  contentHeight: number,
  scaleFactor: number,
  additionalScaleFactor: number,
  inputText: string = '',
  optimizeSvgs: boolean = false // Add this parameter
): void => {
  // Existing export code...
  
  // After creating the SVG string, before creating the blob:
  if (optimizeSvgs) {
    try {
      const originalSize = new Blob([svgString], { type: 'image/svg+xml' }).size;
      svgString = optimizeSvgString(svgString);
      const optimizedSize = new Blob([svgString], { type: 'image/svg+xml' }).size;
      console.log(`SVG optimization: ${Math.round((originalSize - optimizedSize) / originalSize * 100)}% reduction`);
    } catch (error) {
      console.error('SVG optimization failed:', error);
      // Continue with the original SVG
    }
  }
  
  // Rest of the export function...
};
```

## Testing the Integration

After integrating the optimization, test it by:

1. Exporting an SVG from your application
2. Checking the console for optimization messages
3. Comparing the file size of the exported SVG with a previously exported unoptimized SVG

You should see messages like:

```
Optimizing SVG...
Original size: 22.8 KB
Optimized size: 11.5 KB
Size reduction: 49.6%
Optimized SVG saved successfully as my-graffiti.svg
```

## Troubleshooting

If the optimized SVG looks visually different:

1. Check for specific SVG features that might be affected by optimization
2. Ensure your SVGs are compatible with the optimization process
3. Look for error messages in the console that might indicate issues with the optimization 