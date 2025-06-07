// src/components/GraffitiDisplay/index.tsx
import React, { useCallback, useMemo, useEffect } from 'react';
import { ProcessedSvg, CustomizationOptions, HistoryState } from '../../types';
import GraffitiContainer from './GraffitiContainer';
import LoadingIndicator from './LoadingIndicator';
import EmptyState from './EmptyState';
import GraffitiContent from './GraffitiContent';
import HistoryControls from './HistoryControls';

interface GraffitiDisplayProps {
  isGenerating: boolean;
  processedSvgs: ProcessedSvg[];
  positions: number[];
  contentWidth: number;
  contentHeight: number;
  containerScale: number;
  customizationOptions: CustomizationOptions;
  customizationHistory?: HistoryState[];
  currentHistoryIndex?: number;
  onUndoRedo?: (newIndex: number) => void;
  inputText?: string;
}

const GraffitiDisplay: React.FC<GraffitiDisplayProps> = ({ 
  isGenerating = false,
  processedSvgs = [],
  positions,
  contentWidth,
  contentHeight,
  containerScale,
  customizationOptions,
  customizationHistory = [],
  currentHistoryIndex = -1,
  onUndoRedo,
  inputText = ''
}) => {

  // Add debug logging to help troubleshoot history props issues
  useEffect(() => {
    console.log('GraffitiDisplay received history props:', {
      historyLength: customizationHistory.length,
      currentHistoryIndex,
      hasUndoRedoCallback: !!onUndoRedo
    });
  }, [customizationHistory.length, currentHistoryIndex, onUndoRedo]);

  // Helper function to handle undo/redo
  const handleUndoRedo = useCallback((direction: 'undo' | 'redo') => {
    if (!onUndoRedo || customizationHistory.length === 0) {
      console.log('Undo/Redo aborted:', { 
        hasCallback: !!onUndoRedo, 
        historyLength: customizationHistory.length 
      });
      return;
    }

    // Calculate the new index
    let newIndex: number;
    if (direction === 'undo') {
      newIndex = Math.max(0, currentHistoryIndex - 1);
    } else {
      newIndex = Math.min(customizationHistory.length - 1, currentHistoryIndex + 1);
    }

    // Only call if the index actually changed
    if (newIndex !== currentHistoryIndex) {
      console.log(`Undo/Redo: ${direction} from ${currentHistoryIndex} to ${newIndex}`);
      onUndoRedo(newIndex);
    } else {
      console.log(`Undo/Redo: ${direction} blocked - already at ${direction === 'undo' ? 'beginning' : 'end'}`);
    }
  }, [onUndoRedo, customizationHistory.length, currentHistoryIndex]);

  // Track current input text for display purposes
  const currentInputText = inputText || '';

  // Memoize the GraffitiContent component to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => {
    if (isGenerating) {
      return <LoadingIndicator />;
    } else if (processedSvgs.length > 0) {
      return (
        <GraffitiContent
          processedSvgs={processedSvgs}
          positions={positions}
          contentWidth={contentWidth}
          contentHeight={contentHeight}
          containerScale={containerScale}
          customizationOptions={customizationOptions}
          inputText={currentInputText}
        />
      );
    } else {
      return <EmptyState />;
    }
  }, [
    isGenerating, 
    processedSvgs, 
    positions, 
    contentWidth, 
    contentHeight, 
    containerScale, 
    customizationOptions,
    currentInputText
  ]);

  // Memoize the history controls to prevent unnecessary re-renders
  const historyControlsElement = useMemo(() => {
    if (customizationHistory.length > 0 && !isGenerating && processedSvgs.length > 0) {
      return (
        <HistoryControls
          currentHistoryIndex={currentHistoryIndex}
          historyLength={customizationHistory.length}
          onUndoRedo={handleUndoRedo}
          historyStates={customizationHistory}
        />
      );
    }
    return null;
  }, [customizationHistory, isGenerating, currentHistoryIndex, handleUndoRedo, processedSvgs.length]);

  return (
    <GraffitiContainer customizationOptions={customizationOptions}>
      <div 
        className="relative w-full h-full"
        role="img"
        aria-label={currentInputText ? `Generated graffiti displaying the text: ${currentInputText}` : 'Graffiti display area'}
        aria-describedby="graffiti-description"
      >
        {/* Screen reader description */}
        <div id="graffiti-description" className="sr-only">
          {isGenerating 
            ? 'Graffiti generation in progress, please wait'
            : processedSvgs.length > 0 
              ? `Graffiti art generated with ${processedSvgs.length} letter${processedSvgs.length !== 1 ? 's' : ''} using customizable styling options`
              : 'No graffiti generated yet. Enter text above and click Create to generate graffiti art'
          }
        </div>
        
        {/* Live region for generation status */}
        <div 
          className="sr-only" 
          aria-live="polite" 
          role="status"
          aria-atomic="true"
        >
          {isGenerating && 'Generating graffiti artwork...'}
          {!isGenerating && processedSvgs.length > 0 && `Graffiti generation complete. ${processedSvgs.length} letters rendered.`}
        </div>
        
        {memoizedContent}
      </div>
      {historyControlsElement}
    </GraffitiContainer>
  );
};

export default React.memo(GraffitiDisplay);