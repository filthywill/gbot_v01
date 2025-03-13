// src/components/GraffitiDisplay/index.tsx
import React, { useCallback, useMemo } from 'react';
import { ProcessedSvg, CustomizationOptions } from '../../types';
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
  customizationHistory?: CustomizationOptions[];
  currentHistoryIndex?: number;
  onUndoRedo?: (newIndex: number) => void;
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
  onUndoRedo
}) => {
  // Helper function to handle undo/redo
  const handleUndoRedo = useCallback((direction: 'undo' | 'redo') => {
    if (!onUndoRedo || customizationHistory.length === 0) return;
    
    const newIndex = direction === 'undo' 
      ? Math.max(0, currentHistoryIndex - 1)
      : Math.min(customizationHistory.length - 1, currentHistoryIndex + 1);
    
    // Only trigger if the index actually changes
    if (newIndex !== currentHistoryIndex) {
      onUndoRedo(newIndex);
    }
  }, [onUndoRedo, customizationHistory.length, currentHistoryIndex]);

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
    customizationOptions
  ]);

  // Memoize the history controls to prevent unnecessary re-renders
  const historyControlsElement = useMemo(() => {
    if (customizationHistory.length > 0 && !isGenerating) {
      return (
        <HistoryControls
          currentHistoryIndex={currentHistoryIndex}
          historyLength={customizationHistory.length}
          onUndoRedo={handleUndoRedo}
        />
      );
    }
    return null;
  }, [customizationHistory.length, isGenerating, currentHistoryIndex, handleUndoRedo]);

  return (
    <GraffitiContainer customizationOptions={customizationOptions}>
      {historyControlsElement}
      {memoizedContent}
    </GraffitiContainer>
  );
};

export default React.memo(GraffitiDisplay);