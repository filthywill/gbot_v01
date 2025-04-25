# Stizack Color System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Color System Architecture](#color-system-architecture)
3. [Implementation](#implementation)
4. [Color Variables](#color-variables)
5. [Migration Guide](#migration-guide)
6. [Color Picker Component](#color-picker-component)
7. [Best Practices](#best-practices)

## Overview

The Stizack color system is a centralized approach to color management that ensures consistency, accessibility, and theming flexibility throughout the application. It uses a combination of CSS variables, Tailwind, and custom components to create a unified color experience.

### Benefits

- **Consistency**: Unified color palette across all components
- **Theming**: Support for light/dark modes and custom themes
- **Maintainability**: Single source of truth for color definitions
- **Accessibility**: Ensures proper contrast ratios by design
- **Developer Experience**: Simplified color selection with intellisense
- **Performance**: Optimized rendering with minimal CSS footprint

## Color System Architecture

The color system is built on three key layers:

1. **CSS Variables Layer**: Core color definitions as CSS variables
2. **Tailwind Integration Layer**: Maps CSS variables to Tailwind classes
3. **Component Layer**: Consumes the colors via Tailwind and props

### System Structure

```
├── styles/
│   ├── theme/
│   │   ├── colors.css        # CSS variable definitions
│   │   ├── dark-theme.css    # Dark mode overrides
│   │   └── themes.css        # Theme-specific overrides
│   └── index.css             # Root styles and imports
├── tailwind.config.js        # Tailwind configuration with color mappings
├── components/
│   ├── ui/
│   │   ├── color-picker.tsx  # Color selection component
│   │   └── theme-toggle.tsx  # Theme switching component
│   └── ...
└── lib/
    └── utils/
        └── color-utils.ts    # Color utility functions
```

## Implementation

### CSS Variables

The core color system is defined in `styles/theme/colors.css`:

```css
:root {
  /* Base Colors */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-secondary: #ec4899;
  --color-secondary-hover: #db2777;
  
  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Neutral Colors */
  --color-background: #ffffff;
  --color-foreground: #111827;
  --color-muted: #9ca3af;
  --color-muted-foreground: #4b5563;
  --color-accent: #f3f4f6;
  --color-accent-foreground: #1f2937;
  
  /* UI Colors */
  --color-border: #e5e7eb;
  --color-input: #f9fafb;
  --color-ring: rgba(59, 130, 246, 0.5);
  --color-radius: 0.5rem;
  
  /* Component-Specific Colors */
  --color-card: #ffffff;
  --color-card-foreground: #111827;
  --color-popover: #ffffff;
  --color-popover-foreground: #111827;
}
```

### Tailwind Integration

The Tailwind configuration maps CSS variables to color classes:

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          hover: "var(--color-secondary-hover)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
      },
      borderRadius: {
        DEFAULT: "var(--color-radius)",
      },
    },
  },
  // ... other Tailwind config
};
```

### Dark Mode

Dark mode colors are defined as CSS variable overrides:

```css
/* styles/theme/dark-theme.css */
[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-primary-hover: #93c5fd;
  --color-secondary: #f472b6;
  --color-secondary-hover: #f9a8d4;
  
  --color-background: #111827;
  --color-foreground: #f9fafb;
  --color-muted: #6b7280;
  --color-muted-foreground: #9ca3af;
  --color-accent: #1f2937;
  --color-accent-foreground: #f3f4f6;
  
  --color-border: #374151;
  --color-input: #1f2937;
  --color-ring: rgba(96, 165, 250, 0.5);
}
```

## Color Variables

The color system includes the following core categories:

### Base Colors
- `--color-primary`: Main brand color
- `--color-secondary`: Secondary brand color

### State Colors
- `--color-success`: Success states and confirmations
- `--color-warning`: Warning messages and alerts
- `--color-error`: Error states and destructive actions
- `--color-info`: Informational messages

### Neutral Colors
- `--color-background`: Page background
- `--color-foreground`: Primary text
- `--color-muted`: Subdued content
- `--color-muted-foreground`: Subdued text
- `--color-accent`: Accent backgrounds
- `--color-accent-foreground`: Text on accent backgrounds

### UI Colors
- `--color-border`: Border color
- `--color-input`: Input background
- `--color-ring`: Focus rings

### Component-Specific Colors
- `--color-card`: Card background
- `--color-card-foreground`: Card text
- `--color-popover`: Popover background
- `--color-popover-foreground`: Popover text

## Migration Guide

### Migration Overview

We're transitioning from directly using Tailwind color classes to our new CSS variable-based color system. This ensures better maintainability, theming support, and consistency.

### Key Benefits of Migration

1. **Centralized Color Management**: Single source of truth for colors
2. **Improved Theme Support**: Easier implementation of dark mode
3. **Better Component Consistency**: Components use the same color variables
4. **Simplified Maintenance**: Color changes can be made in one place
5. **Enhanced Accessibility**: Contrast ratios are maintained by design

### Migration Approach

The migration will follow a phased approach:

1. **Foundation Setup**: Define CSS variables and Tailwind integration
2. **Component Migration**: Update components one category at a time
3. **Testing and Validation**: Ensure consistency and proper theming
4. **Documentation**: Update docs to reflect the new system

### Components to Update (Priority Order)

1. Core UI components (buttons, inputs, modals)
2. Navigation elements (header, sidebar)
3. Form components
4. Feedback components (alerts, toasts)
5. Data display components
6. Page-specific components

### Files to Update

1. `src/styles/theme/colors.css`: Define color variables
2. `tailwind.config.js`: Map variables to Tailwind classes
3. UI Components: Update to use new color classes
4. Custom components: Replace hardcoded colors

### Implementation Guide

1. **Add CSS Variables**:
   ```css
   :root {
     --color-primary: #3b82f6;
     /* other variables */
   }
   ```

2. **Update Tailwind Config**:
   ```js
   colors: {
     primary: {
       DEFAULT: "var(--color-primary)",
       hover: "var(--color-primary-hover)",
     },
     // other colors
   },
   ```

3. **Update Component Colors**:

   Before:
   ```tsx
   <button className="bg-blue-600 hover:bg-blue-700 text-white">
     Click Me
   </button>
   ```

   After:
   ```tsx
   <button className="bg-primary hover:bg-primary-hover text-white">
     Click Me
   </button>
   ```

4. **Test Color Themes**:
   - Test in light mode
   - Test in dark mode
   - Verify color contrast meets WCAG standards

## Color Picker Component

The color picker component is a crucial part of the color system, allowing users to select and customize colors throughout the application.

### Features

- **Multiple Selection Methods**: HEX input, color slider, and preset swatches
- **Recent Colors**: Remembers recently used colors
- **Custom Color Swatches**: Predefined color palettes
- **Accessibility**: High contrast mode and keyboard navigation
- **Integration**: Works with form libraries and controlled components

### Implementation

```tsx
// components/ui/color-picker.tsx
import React, { useState, useEffect } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { useRecentColors } from '../../hooks/useRecentColors';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  className?: string;
  disabled?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  presetColors = [],
  className,
  disabled = false,
}: ColorPickerProps) {
  const [color, setColor] = useState(value || '#000000');
  const { recentColors, addRecentColor } = useRecentColors();
  
  // Update internal state when external value changes
  useEffect(() => {
    setColor(value);
  }, [value]);
  
  // Handle color change
  const handleChange = (newColor: string) => {
    setColor(newColor);
  };
  
  // Handle final color selection
  const handleChangeComplete = (finalColor: string) => {
    onChange(finalColor);
    addRecentColor(finalColor);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`w-10 h-10 rounded-md border ${className}`}
          style={{ backgroundColor: color }}
          disabled={disabled}
          aria-label="Pick a color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <HexColorPicker
          color={color}
          onChange={handleChange}
          onMouseUp={() => handleChangeComplete(color)}
        />
        <div className="flex mt-2">
          <div className="flex-grow">
            <HexColorInput
              color={color}
              onChange={handleChange}
              onBlur={() => handleChangeComplete(color)}
              prefixed
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>
        
        {/* Recent Colors */}
        {recentColors.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-1">Recent</div>
            <div className="flex flex-wrap gap-1">
              {recentColors.map((recentColor) => (
                <button
                  key={recentColor}
                  className="w-6 h-6 rounded-md border"
                  style={{ backgroundColor: recentColor }}
                  onClick={() => {
                    handleChange(recentColor);
                    handleChangeComplete(recentColor);
                  }}
                  aria-label={`Select color ${recentColor}`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Preset Colors */}
        {presetColors.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-1">Presets</div>
            <div className="flex flex-wrap gap-1">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className="w-6 h-6 rounded-md border"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    handleChange(presetColor);
                    handleChangeComplete(presetColor);
                  }}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

### Recent Colors Hook

```tsx
// hooks/useRecentColors.ts
import { useState, useEffect } from 'react';

const MAX_RECENT_COLORS = 8;
const STORAGE_KEY = 'recentColors';

export function useRecentColors() {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  
  // Load recent colors from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentColors(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent colors:', error);
    }
  }, []);
  
  // Add a color to recent colors
  const addRecentColor = (color: string) => {
    setRecentColors((prev) => {
      // Remove if already exists
      const filtered = prev.filter((c) => c !== color);
      // Add to beginning
      const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
      
      // Store in localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent colors:', error);
      }
      
      return updated;
    });
  };
  
  return { recentColors, addRecentColor };
}
```

### Usage

```tsx
import { ColorPicker } from './components/ui/color-picker';

function MyComponent() {
  const [color, setColor] = useState('#3b82f6');
  
  return (
    <div>
      <label>Select a color:</label>
      <ColorPicker
        value={color}
        onChange={setColor}
        presetColors={[
          '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
          '#ec4899', '#000000', '#71717a', '#ffffff'
        ]}
      />
    </div>
  );
}
```

## Best Practices

### Using the Color System

1. **Always use color variables**: Avoid hardcoding colors
2. **Follow semantic naming**: Use `primary` instead of specific color names
3. **Test contrast**: Ensure text has sufficient contrast against backgrounds
4. **Use opacity correctly**: Apply opacity via Tailwind (e.g., `bg-primary/50`)
5. **Maintain consistency**: Use the same color for the same purpose

### Color Selection Guidelines

1. **Use primary color for main CTA buttons and key interactions**
2. **Use secondary color for secondary actions**
3. **Use semantic colors (success, warning, error, info) for feedback**
4. **Use neutral colors for backgrounds, text, and borders**
5. **Maintain a 4.5:1 contrast ratio for text (WCAG AA)**
6. **Use tints and shades consistently** 

### Component Design

1. **Define color schemes at the component level**
2. **Use variants for different color options**
3. **Provide consistency via default props**
4. **Allow overrides when needed**
5. **Document color usage in component stories**

### Theme Switching

To implement theme switching:

```tsx
// components/ui/theme-toggle.tsx
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    // Get initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
```

---

This documentation provides a comprehensive guide to the color system implemented in Stizack. It covers all aspects from system architecture to implementation details, migration guidance, and best practices. 