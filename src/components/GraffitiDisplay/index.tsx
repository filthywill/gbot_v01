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
    
    try {
      const newIndex = direction === 'undo' 
        ? Math.max(0, currentHistoryIndex - 1)
        : Math.min(customizationHistory.length - 1, currentHistoryIndex + 1);
      
      // Only trigger if the index actually changes
      if (newIndex !== currentHistoryIndex) {
        console.log(`${direction.charAt(0).toUpperCase() + direction.slice(1)} operation:`, {
          direction,
          fromIndex: currentHistoryIndex,
          toIndex: newIndex,
          fromState: currentHistoryIndex >= 0 && currentHistoryIndex < customizationHistory.length 
            ? customizationHistory[currentHistoryIndex]?.presetId || 'custom state'
            : 'invalid state',
          toState: newIndex >= 0 && newIndex < customizationHistory.length
            ? customizationHistory[newIndex]?.presetId || 'custom state'
            : 'invalid state'
        });
        
        onUndoRedo(newIndex);
      } else {
        console.log(`${direction} operation aborted - index would not change:`, {
          currentIndex: currentHistoryIndex,
          calculatedNewIndex: newIndex,
          historyLength: customizationHistory.length
        });
      }
    } catch (error) {
      console.error(`Error during ${direction} operation:`, error);
    }
  }, [onUndoRedo, customizationHistory, currentHistoryIndex]);

  // Get the current input text from history if available
  const currentInputText = useMemo(() => {
    // If direct inputText prop is provided, use it
    if (inputText) return inputText;
    
    // Otherwise try to get it from history
    if (customizationHistory.length > 0 && currentHistoryIndex >= 0 && currentHistoryIndex < customizationHistory.length) {
      return customizationHistory[currentHistoryIndex].inputText || '';
    }
    
    return '';
  }, [inputText, customizationHistory, currentHistoryIndex]);

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
      <div className="relative w-full h-full">
        {memoizedContent}
      </div>
      {historyControlsElement}
    </GraffitiContainer>
  );
};

export default React.memo(GraffitiDisplay);