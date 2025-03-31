# Component Standards Documentation

This document outlines the standard patterns for components, control elements, and history management in the gbot_v01 application.

## Control Component Hierarchy

The application uses a standardized three-tier approach for control components:

### 1. ControlContainer

`ControlContainer` is the foundation component that provides a consistent layout structure for all control components. It handles:

- Basic container layout and styling
- Toggle switch functionality 
- Collapsible behavior with expand/collapse animations
- Content visibility based on toggle state

```tsx
<ControlContainer
  label="LABEL"
  hasToggle={true} 
  enabled={boolean}
  onToggle={callback}
  isCollapsible={true}
  headerRightContent={ReactNode}
  contentHeight="h-[14px]"
>
  {/* Content to be shown when expanded */}
</ControlContainer>
```

### 2. ControlItem

`ControlItem` extends the basic container by adding:

- Color picker functionality in the header
- Single slider control
- Value conversion between UI/display values and actual values

```tsx
<ControlItem
  label="CONTROL"
  hasToggle={true}
  enabled={boolean}
  onToggle={callback}
  hasColorPicker={true}
  color="#color"
  onColorChange={callback}
  onColorComplete={callback}
  hasSlider={true}
  value={number}
  onValueChange={callback}
  onSliderComplete={callback}
  valueConfig={sliderValueConfig}
  sliderLabel="Size"
/>
```

### 3. EffectControlItem

`EffectControlItem` implements more complex controls with:

- Dual slider functionality
- Consistent value conversion for both sliders
- Expanded content area for multiple controls

```tsx
<EffectControlItem
  label="EFFECT"
  enabled={boolean}
  onToggle={callback}
  firstSliderLabel="Parameter 1"
  firstSliderValue={number}
  onFirstSliderChange={callback}
  secondSliderLabel="Parameter 2"
  secondSliderValue={number}
  onSecondSliderChange={callback}
  onSliderComplete={callback}
  sliderConfig={valueConfig}
/>
```

### 4. Specialized Control Components

These implement specific feature controls by leveraging the mid-tier components:

- `FillControl`: Simple color picker using ControlItem
- `OutlineControl`: Toggle + color + width using ControlItem
- `ShieldControl`: Toggle + color + width using ControlItem
- `ShadowControl`: Toggle + dual sliders using EffectControlItem
- `BackgroundControl`: Toggle + color using ControlItem

## History Management Pattern

The application uses standardized history management through the `useHistoryTracking` hook, which provides a consistent API for tracking state changes.

### Key Functions

1. **updateWithoutHistory(updates)**
   - For temporary changes during user interaction
   - Used when dragging sliders or picking colors
   - Adds `__skipHistory` flag to updates

2. **updateWithHistory(updates, presetId?)**
   - For final state changes that should create history entries
   - Used when completing interactions or applying presets
   - Optionally includes a preset ID

3. **createHistoryEntry(updates?, presetId?)**
   - Manually creates a history entry
   - Used for special cases where direct control over history is needed

4. **handleUndoRedo(newIndex, onComplete?)**
   - Standardized handler for navigation through history states
   - Supports a callback for post-navigation actions

### Usage Patterns

#### For Controls with Dragging Interaction

```tsx
// During interaction (dragging)
const handleDrag = (value) => {
  const updates = updateWithoutHistory({ myValue: value });
  onChange(updates as CustomizationOptions);
};

// On interaction complete
const handleComplete = () => {
  const updates = updateWithHistory({ myValue: finalValue });
  onChange(updates as CustomizationOptions);
};
```

#### For Immediate Changes

```tsx
// For toggles and immediate updates
const handleToggle = (enabled) => {
  const updates = updateWithHistory({ myFeatureEnabled: enabled });
  onChange(updates as CustomizationOptions);
};
```

#### For Preset Application

```tsx
// When applying a preset
const applyPreset = (preset) => {
  const updates = updateWithHistory(preset.settings, preset.id);
  onChange({ ...options, ...updates } as CustomizationOptions);
};
```

## Naming Conventions

### Component Names

- Use PascalCase for all component names
- Use descriptive names that indicate the component's purpose
- Avoid prefixes like "Modern" that don't add semantic value
- Use the "Control" suffix for components in the controls directory
- Use consistent, clear names for related components (e.g., InputForm, StyleSelector)

### Prop Names

- Use camelCase for all prop names
- Use boolean props with "is", "has", or "should" prefixes
- Use consistent naming for callbacks: `on{Event}` (e.g., `onToggle`, `onValueChange`)
- Use consistent naming for completion callbacks: `on{Event}Complete` (e.g., `onColorComplete`)

### File Names

- Use kebab-case for utility files
- Use PascalCase for component files, matching the component name
- Group related components in directories
- Use index.ts files to simplify imports

## Value Conversion

Use the standardized value conversion utilities for consistent slider behavior:

```tsx
// Create a value configuration
const myValueConfig = {
  min: 0,          // Actual minimum value
  max: 100,        // Actual maximum value
  step: 1,         // Step increment
  displayMin: 0,   // Display minimum
  displayMax: 10,  // Display maximum
  toDisplayValue: (value) => Math.floor(value / 10),
  toActualValue: (display) => display * 10
};

// Or use the helper function
const linearConfig = createLinearValueConfig(0, 100, 1);
```

---

Following these standards ensures consistent UI behavior, maintainable code structure, and proper history tracking throughout the application. 