# gbot_v01 Architecture Documentation

## Project Overview

gbot_v01 is a React-based web application built with TypeScript, designed to create high-quality, customizable vector-based graffiti artwork. The application provides users with proprietary base artwork and extensive customization options, allowing for infinite creative possibilities while maintaining the authentic look and feel of traditional graffiti art.

## Tech Stack

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **Language**: TypeScript 5.5.3
- **State Management**: Zustand 5.0.3
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: 
  - Radix UI primitives
  - Custom components
- **Animation**: Framer Motion 12.5.0

## Project Structure

```
src/
├── assets/         # Static assets and SVG artwork
├── components/     # React components
│   ├── ui/        # Reusable UI components
│   └── GraffitiDisplay/  # Core graffiti rendering components
├── data/          # Static data and letter rules
├── hooks/         # Custom React hooks
├── lib/           # Core libraries and utilities
├── store/         # Zustand state management
│   └── useGraffitiStore.ts  # Main state store
├── styles/        # Global styles and Tailwind configurations
├── utils/         # SVG processing utilities
└── types.ts       # TypeScript type definitions
```

## Core Features

### SVG Processing and Rendering
The application implements sophisticated SVG processing with features including:
- Vector-based artwork processing for high-quality output
- Intelligent letter positioning with pixel-density-based overlap
- Automatic rotation rules for specific letter combinations
- Bounds detection and optimization for layout
- Efficient caching mechanisms for processed SVGs

### Letter Positioning System
- Utilizes pixel data analysis for optimal letter overlap
- Implements special case handling for specific letter pairs
- Density-based positioning for authentic graffiti appearance
- Vertical pixel range analysis for efficient overlap calculation
- Customizable overlap rules for fine-tuning

### Customization Features
All implemented effects include:
- **Background**: Custom background colors and toggles
- **Fill**: Color customization for letter fills
- **Stroke**: Width and color customization for outlines
- **Shadow**: Multi-parameter shadow effects with opacity and blur
- **Stamp**: Custom width and color effects
- **Shield**: Protective outline effect with width and color options
- **Shadow Effect**: Offset controls for depth
- **Shine**: (Implementation ready but currently unused)

### State Management
The application uses Zustand for efficient state management with:
- Centralized state store for all customization options
- History tracking for undo/redo functionality
- Efficient SVG caching and processing state
- Real-time preview updates
- Preset management system

## Component Architecture

### UI Components
The application uses a comprehensive UI system built with:
- Radix UI primitives for accessibility and interaction
- Custom components with Tailwind styling
- Framer Motion for animations

### Core Components

#### GraffitiDisplay
- Handles SVG composition and rendering
- Manages layout and positioning
- Implements efficient update mechanisms
- Provides real-time preview capabilities

#### CustomizationToolbar
- Provides comprehensive customization controls
- Implements preset management
- Offers real-time preview updates
- Groups related controls logically

## Development Guidelines

### Code Style
- Use functional components with TypeScript
- Implement proper type definitions
- Follow component-based architecture
- Keep components focused and maintainable

### Performance Optimization
- Implement SVG caching mechanisms
- Use pixel-based density calculations
- Optimize overlap calculations
- Handle large text inputs efficiently

### SVG Processing Best Practices
- Maintain vector quality throughout processing
- Implement efficient bounds detection
- Use proper SVG attribute management
- Handle SVG parsing errors gracefully

## Future Considerations

### Planned Features
- Implementation of shine effect variations
- Additional letter style presets
- Enhanced export options
- Performance optimizations for large texts

### Performance Optimizations
- Continuous improvement of SVG processing
- Enhanced caching strategies
- Optimization of letter positioning algorithms

---

This documentation is a living document and will be updated as the project evolves. 