# Control Component Architecture

This document outlines the architecture of the control component system in the Stizack application. Control components are UI elements that allow users to adjust various parameters of the graffiti generation.

## Overview

The control component system was redesigned on May 13, 2024, to improve maintainability, consistency, and visual design. The new architecture is based on a `BaseControlItem` component that provides common functionality for all control types.

## BaseControlItem Component

The `BaseControlItem` component serves as the foundation for all control components, providing:

- Consistent layout and styling
- Standard labeling system
- Unified tooltip implementation
- Accessibility features
- Value conversion handling

### Component Structure

```tsx
<BaseControlItem
  label="Control Label"
  tooltip="Tooltip text"
  value={value}
  onChange={handleChange}
  converter={valueConverter}
  disabled={false}
>
  {/* Control-specific UI elements */}
</BaseControlItem>
```

### Props Interface

```tsx
interface BaseControlItemProps {
  // Display properties
  label: string;
  tooltip?: string;
  
  // State management
  value: any;
  onChange: (newValue: any) => void;
  
  // Optional properties
  disabled?: boolean;
  converter?: ValueConverter;
  className?: string;
  
  // React children for custom rendering
  children: React.ReactNode;
}
```

## Value Conversion System

Controls use a centralized value conversion system that handles transformations between:

1. **Raw Values** - Used internally by the application logic
2. **Display Values** - Formatted for user-friendly display
3. **Input Values** - Values as entered by users

Each control can specify a custom converter or use one of the predefined converters:

```tsx
// Example of a predefined converter
const percentageConverter: ValueConverter = {
  toDisplay: (raw: number) => `${Math.round(raw * 100)}%`,
  fromDisplay: (display: string) => parseFloat(display) / 100,
  toInput: (raw: number) => Math.round(raw * 100).toString(),
  fromInput: (input: string) => parseFloat(input) / 100
};
```

## Control Types

The control system includes several specialized control types:

### Slider Control

```tsx
<SliderControl
  label="Opacity"
  value={opacity}
  onChange={setOpacity}
  min={0}
  max={1}
  step={0.01}
  converter={percentageConverter}
  tooltip="Adjust the opacity of the graffiti"
/>
```

### Color Control

```tsx
<ColorControl
  label="Fill Color"
  value={fillColor}
  onChange={setFillColor}
  tooltip="Set the fill color for letters"
  presets={colorPresets}
  showAlpha={true}
/>
```

### Toggle Control

```tsx
<ToggleControl
  label="Show Outlines"
  value={showOutlines}
  onChange={setShowOutlines}
  tooltip="Toggle letter outlines visibility"
/>
```

### Select Control

```tsx
<SelectControl
  label="Letter Style"
  value={letterStyle}
  onChange={setLetterStyle}
  options={letterStyleOptions}
  tooltip="Choose the style of letters"
/>
```

### Input Control

```tsx
<InputControl
  label="Text"
  value={text}
  onChange={setText}
  tooltip="Enter the text for your graffiti"
  placeholder="Enter text..."
  maxLength={20}
/>
```

## Control Panels

Controls are organized into logical groups using control panels:

```tsx
<ControlPanel title="Appearance">
  <ColorControl label="Fill Color" value={fillColor} onChange={setFillColor} />
  <ColorControl label="Outline Color" value={outlineColor} onChange={setOutlineColor} />
  <SliderControl label="Opacity" value={opacity} onChange={setOpacity} />
</ControlPanel>
```

## Responsive Design

The control components use responsive design techniques to adapt to different screen sizes:

- On larger screens, controls are displayed in a multi-column layout
- On smaller screens, controls collapse to a single column
- On mobile devices, controls use touch-optimized interaction patterns

## Accessibility Features

The control component system includes the following accessibility features:

- Proper ARIA attributes for screen readers
- Keyboard navigation support
- Focus management
- High-contrast mode compatibility
- Screen reader announcements for value changes

## Integration with Zustand Stores

Control components are connected to the application state through Zustand stores:

```tsx
import { useGraffitiStore } from '../../store/graffitiStore';

const MyControlPanel = () => {
  const { 
    opacity, 
    setOpacity,
    fillColor,
    setFillColor
  } = useGraffitiStore();
  
  return (
    <ControlPanel title="Appearance">
      <SliderControl 
        label="Opacity" 
        value={opacity} 
        onChange={setOpacity} 
      />
      <ColorControl 
        label="Fill Color" 
        value={fillColor} 
        onChange={setFillColor} 
      />
    </ControlPanel>
  );
};
```

## Best Practices

When working with control components:

1. Use the appropriate control type for each parameter
2. Group related controls in control panels
3. Provide clear, concise labels and tooltips
4. Implement appropriate value converters for numeric values
5. Consider keyboard and screen reader usability
6. Test controls with various input values
7. Maintain consistent styling across control types

## Future Improvements

Planned improvements to the control component system:

1. Advanced validation for input controls
2. Undo/redo support for control value changes
3. Custom control presets for quick adjustments
4. Improved mobile touch interactions
5. Context-sensitive controls that adapt to application state 