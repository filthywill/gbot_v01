// HistoryControls.tsx
import React, { useEffect } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import '../../styles/historyControls.css';

interface HistoryControlsProps {
  currentHistoryIndex: number;
  historyLength: number;
  onUndoRedo: (direction: 'undo' | 'redo') => void;
  historyStates?: Array<{presetId?: string}>;
}

const HistoryControls: React.FC<HistoryControlsProps> = ({ 
  currentHistoryIndex, 
  historyLength, 
  onUndoRedo,
  historyStates = []
}) => {
  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < historyLength - 1;

  // Add debug logging to help troubleshoot visibility issues
  useEffect(() => {
    console.log('HistoryControls rendered:', {
      currentHistoryIndex,
      historyLength,
      isUndoDisabled: currentHistoryIndex <= 0,
      isRedoDisabled: currentHistoryIndex >= historyLength - 1,
      historyStatesLength: historyStates.length
    });
  }, [currentHistoryIndex, historyLength, historyStates]);

  // Get the previous and next state presets for tooltips
  const prevStatePreset = currentHistoryIndex > 0 && historyStates.length > 0 
    ? historyStates[currentHistoryIndex - 1]?.presetId 
    : undefined;
    
  const nextStatePreset = currentHistoryIndex < historyLength - 1 && historyStates.length > 0 
    ? historyStates[currentHistoryIndex + 1]?.presetId 
    : undefined;

  // Create tooltip text
  const undoTooltip = prevStatePreset ? `Undo to ${prevStatePreset} preset` : 'Undo';
  const redoTooltip = nextStatePreset ? `Redo to ${nextStatePreset} preset` : 'Redo';

  // Handle undo/redo with error handling
  const handleUndoRedoClick = (direction: 'undo' | 'redo') => {
    console.log(`History control clicked: ${direction}`, {
      currentIndex: currentHistoryIndex,
      historyLength,
      canUndo,
      canRedo
    });
    onUndoRedo(direction);
  };

  const handleKeyDown = (e: React.KeyboardEvent, direction: 'undo' | 'redo') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleUndoRedoClick(direction);
    }
  };

  // Get current state description for screen readers
  const getCurrentStateDescription = () => {
    if (historyStates.length === 0) return 'No history available';
    
    const currentState = historyStates[currentHistoryIndex];
    if (!currentState) return 'Invalid history state';
    
    return currentState.presetId 
      ? `Applied preset: ${currentState.presetId}` 
      : 'Custom style configuration';
  };

  return (
    <div 
      className="absolute bottom-2 left-1 flex items-center space-x-1 history-controls-container"
      role="toolbar"
      aria-label="Graffiti style history controls"
      aria-describedby="history-status"
    >
      {/* Screen reader status */}
      <div id="history-status" className="sr-only">
        History position {currentHistoryIndex + 1} of {historyLength}. {getCurrentStateDescription()}
      </div>
      
      {/* Live region for history changes */}
      <div className="sr-only" aria-live="polite" role="status">
        {/* This will be updated when history changes */}
      </div>
      
      <button
        onClick={() => handleUndoRedoClick('undo')}
        onKeyDown={(e) => handleKeyDown(e, 'undo')}
        disabled={currentHistoryIndex <= 0}
        className={`history-control-button p-1.5 border-0 rounded-md ${
          currentHistoryIndex > 0
            ? 'bg-brand-primary-600 hover:bg-brand-primary-500 text-white'
            : 'bg-brand-primary-500 text-brand-neutral-400 cursor-not-allowed'
        }`}
        title={undoTooltip}
        aria-label={canUndo ? 'Undo last style change' : 'Undo unavailable - no previous changes'}
        aria-describedby="undo-help"
      >
        <Undo2 className="w-3 h-3" aria-hidden="true" />
      </button>
      
      <div id="undo-help" className="sr-only">
        {canUndo 
          ? 'Undo button: Click to revert to the previous style configuration'
          : 'Undo button disabled: No previous style changes available to undo'
        }
      </div>

      <button
        onClick={() => handleUndoRedoClick('redo')}
        onKeyDown={(e) => handleKeyDown(e, 'redo')}
        disabled={currentHistoryIndex >= historyLength - 1}
        className={`history-control-button p-1.5 border-0 rounded-md ${
          currentHistoryIndex < historyLength - 1
            ? 'bg-brand-primary-600 hover:bg-brand-primary-500 text-white'
            : 'bg-brand-primary-500 text-brand-neutral-400 cursor-not-allowed'
        }`}
        title={redoTooltip}
        aria-label={canRedo ? 'Redo next style change' : 'Redo unavailable - no forward changes'}
        aria-describedby="redo-help"
      >
        <Redo2 className="w-3 h-3" aria-hidden="true" />
      </button>
      
      <div id="redo-help" className="sr-only">
        {canRedo 
          ? 'Redo button: Click to restore the next style configuration'
          : 'Redo button disabled: No forward style changes available to redo'
        }
      </div>
    </div>
  );
};

export default HistoryControls;