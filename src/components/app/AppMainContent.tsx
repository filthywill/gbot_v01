import React from 'react';
import { StyleSelector } from '../StyleSelector';
import { InputForm } from '../InputForm';
import GraffitiDisplay from '../GraffitiDisplay';
import { CustomizationToolbar } from '../CustomizationToolbar';
import { cn } from '../../lib/utils';
import { CustomizationOptions, ProcessedSvg, GraffitiStyle, HistoryState } from '../../types';

/**
 * Interface for the AppMainContent component props
 * Includes all the state and functions needed for the graffiti generation and customization
 */
interface AppMainContentProps {
  // Input and generation state
  displayInputText: string;
  isGenerating: boolean;
  error: string | null;
  
  // Style state
  selectedStyle: string;
  styles: GraffitiStyle[];
  
  // SVG processing state
  processedSvgs: ProcessedSvg[];
  positions: number[];
  contentWidth: number;
  contentHeight: number;
  containerScale: number;
  
  // Customization state
  customizationOptions: CustomizationOptions;
  
  // History state
  history: HistoryState[]; // Using the proper HistoryState type from types.ts
  currentHistoryIndex: number;
  
  // Event handlers
  generateGraffiti: (text: string) => Promise<void>;
  handleCustomizationChange: (options: CustomizationOptions) => void;
  setInputText: (text: string) => void;
  handleStyleChange: (styleId: string) => void;
  handleUndoRedo: (newIndex: number) => void;
  
  // UI state
  hasInitialGeneration: React.RefObject<boolean>;
  
  // Optional props
  className?: string;
}

/**
 * AppMainContent component that displays the main content section of the app
 * Extracted from App.tsx for better component separation
 * 
 * Memoized to prevent unnecessary re-renders when parent App component updates
 * but props haven't changed (e.g., during auth state changes, modal operations)
 */
export function AppMainContent({
  // Input and generation state
  displayInputText,
  isGenerating,
  error,
  
  // Style state
  selectedStyle,
  styles,
  
  // SVG processing state
  processedSvgs,
  positions,
  contentWidth,
  contentHeight,
  containerScale,
  
  // Customization state
  customizationOptions,
  
  // History state
  history,
  currentHistoryIndex,
  
  // Event handlers
  generateGraffiti,
  handleCustomizationChange,
  setInputText,
  handleStyleChange,
  handleUndoRedo,
  
  // UI state
  hasInitialGeneration,
  
  // Optional props
  className
}: AppMainContentProps) {
  return (
    <main className={cn("flex-grow", className)}>
      <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
        <div className="space-y-2">
          {/* Top section: Input and Style Selection */}
          <div className="bg-container shadow-md rounded-md p-1.5 sm:p-2 animate-fade-in">
            <InputForm 
              inputText={displayInputText}
              setInputText={setInputText}
              isGenerating={isGenerating}
              onGenerate={generateGraffiti}
            />
            
            {error && (
              <div className="mt-1 text-red-400 text-xs bg-red-900 bg-opacity-50 p-1 rounded animate-pulse-once">
                {error}
              </div>
            )}
            
            {/* Style Selector - removed extra top margin for better alignment */}
            <div className="mt-1.5">
              <StyleSelector 
                styles={styles}
                selectedStyle={selectedStyle}
                onSelectStyle={handleStyleChange}
              />
            </div>
          </div>
          
          {/* Preview Section */}
          <div className="bg-container shadow-md rounded-md p-1.5 sm:p-2 animate-slide-up">
            {/* This div maintains the 16:9 aspect ratio with no vertical gaps */}
            <div className="w-full relative bg-panel rounded-md overflow-hidden">
              <div className="w-full pb-[56.25%] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {processedSvgs.length > 0 ? (
                    <GraffitiDisplay 
                      isGenerating={isGenerating}
                      processedSvgs={processedSvgs}
                      positions={positions}
                      contentWidth={contentWidth}
                      contentHeight={contentHeight}
                      containerScale={containerScale}
                      customizationOptions={customizationOptions}
                      customizationHistory={history}
                      currentHistoryIndex={currentHistoryIndex}
                      onUndoRedo={handleUndoRedo}
                      inputText={displayInputText}
                    />
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
          
          {/* Customization Section */}
          <div className="bg-container shadow-md rounded-md p-0.5 sm:p-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CustomizationToolbar 
              options={customizationOptions}
              onChange={handleCustomizationChange}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// Memoize to prevent unnecessary re-renders when parent App component updates
// but AppMainContent props haven't changed (e.g., during auth state changes)
export default React.memo(AppMainContent); 