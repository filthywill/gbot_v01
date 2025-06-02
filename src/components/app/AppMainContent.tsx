import React from 'react';
import { StyleSelector } from '../StyleSelector';
import { InputForm } from '../InputForm';
import GraffitiDisplay from '../GraffitiDisplay';
import { CustomizationToolbar } from '../CustomizationToolbar';
import { cn } from '../../lib/utils';
import { CustomizationOptions, GraffitiStyle } from '../../types';
import { useGraffitiDisplay } from '../../hooks/useGraffitiDisplay';
import { useGraffitiControls } from '../../hooks/useGraffitiControls';
import { GraffitiErrorBoundary } from '../ErrorBoundary';

/**
 * Interface for the AppMainContent component props
 * Phase 3.3 Optimization: Further reduced props by making CustomizationToolbar self-contained
 */
interface AppMainContentProps {
  // Style data (still needed as this comes from external source)
  styles: GraffitiStyle[];
  
  // Event handlers
  generateGraffiti: (text: string) => Promise<void>;
  
  // UI state
  hasInitialGeneration: React.RefObject<boolean>;
  
  // Optional props
  className?: string;
}

/**
 * AppMainContent component that displays the main content section of the app
 * Extracted from App.tsx for better component separation
 * 
 * Phase 3.1, 3.2 & 3.3 Optimizations: 
 * - Uses useGraffitiDisplay hook for optimized display state selection
 * - Uses useGraffitiControls hook for optimized input/style state selection
 * - CustomizationToolbar is now self-contained with useGraffitiCustomization hook
 * - Memoized to prevent unnecessary re-renders when parent App component updates
 * 
 * Phase 4.1: Enhanced with Error Boundaries
 * - GraffitiDisplay is wrapped with GraffitiErrorBoundary for SVG processing error handling
 * - Provides graceful recovery options for generation failures
 */
export function AppMainContent({
  // Style data
  styles,
  
  // Event handlers
  generateGraffiti,
  
  // UI state
  hasInitialGeneration,
  
  // Optional props
  className
}: AppMainContentProps) {
  
  // Phase 3.1: Use optimized selector for GraffitiDisplay state
  const graffitiDisplayState = useGraffitiDisplay();
  
  // Phase 3.2: Use optimized selector for InputForm and StyleSelector state
  const graffitiControlsState = useGraffitiControls(styles, generateGraffiti);

  return (
    <main className={cn("flex-grow", className)}>
      <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
        <div className="space-y-2">
          {/* Top section: Input and Style Selection */}
          <div className="bg-container shadow-md rounded-md p-1.5 sm:p-2 animate-fade-in">
            <InputForm 
              inputText={graffitiControlsState.displayInputText}
              setInputText={graffitiControlsState.setInputText}
              isGenerating={graffitiControlsState.isGenerating}
              onGenerate={graffitiControlsState.generateGraffiti}
            />
            
            {graffitiControlsState.error && (
              <div className="mt-1 text-red-400 text-xs bg-red-900 bg-opacity-50 p-1 rounded animate-pulse-once">
                {graffitiControlsState.error}
              </div>
            )}
            
            {/* Style Selector - removed extra top margin for better alignment */}
            <div className="mt-1.5">
              <StyleSelector 
                styles={styles}
                selectedStyle={graffitiControlsState.selectedStyle}
                onSelectStyle={graffitiControlsState.handleStyleChange}
              />
            </div>
          </div>
          
          {/* Preview Section - Phase 4.1: Enhanced with Error Boundary */}
          <div className="bg-container shadow-md rounded-md p-1.5 sm:p-2 animate-slide-up">
            {/* This div maintains the 16:9 aspect ratio with no vertical gaps */}
            <div className="w-full relative bg-panel rounded-md overflow-hidden">
              <div className="w-full pb-[56.25%] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Show GraffitiDisplay if there are processed SVGs OR if there's history (for Undo/Redo) */}
                  {(graffitiDisplayState.processedSvgs.length > 0 || graffitiDisplayState.customizationHistory.length > 0) ? (
                    <GraffitiErrorBoundary>
                    <GraffitiDisplay 
                        isGenerating={graffitiDisplayState.isGenerating}
                        processedSvgs={graffitiDisplayState.processedSvgs}
                        positions={graffitiDisplayState.positions}
                        contentWidth={graffitiDisplayState.contentWidth}
                        contentHeight={graffitiDisplayState.contentHeight}
                        containerScale={graffitiDisplayState.containerScale}
                        customizationOptions={graffitiDisplayState.customizationOptions}
                        customizationHistory={graffitiDisplayState.customizationHistory}
                        currentHistoryIndex={graffitiDisplayState.currentHistoryIndex}
                        onUndoRedo={graffitiDisplayState.handleUndoRedo}
                        inputText={graffitiDisplayState.displayInputText}
                    />
                    </GraffitiErrorBoundary>
                  ) : (
                    <div className="text-tertiary text-center p-3">
                      {hasInitialGeneration.current ? (
                        <p className="text-sm">No text to display. Enter some text and click Create.</p>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-tertiary text-sm">Enter text above and click Create to generate your graffiti</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Customization Section - Phase 3.3: Self-contained component */}
          <div className="bg-container shadow-md rounded-md p-0.5 sm:p-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CustomizationToolbar />
          </div>
        </div>
      </div>
    </main>
  );
}

// Memoize to prevent unnecessary re-renders when parent App component updates
// but AppMainContent props haven't changed (e.g., during auth state changes)
export default React.memo(AppMainContent); 