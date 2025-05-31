// HistoryControls.tsx
import React, { useEffect } from 'react';
import { FaUndo, FaRedo } from 'react-icons/fa';
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
    try {
      console.log(`${direction} button clicked:`, {
        currentHistoryIndex,
        historyLength,
        direction
      });
      onUndoRedo(direction);
    } catch (error) {
      console.error(`Error in ${direction} operation:`, error);
    }
  };

  return (
    <div 
      className="z-40 flex gap-1 history-controls-container"
      style={{ 
        position: 'absolute',
        bottom: '8px',
        left: '8px'
      }}
    >
      <button
        onClick={() => handleUndoRedoClick('undo')}
        disabled={currentHistoryIndex <= 0}
        className={`bg-brand-primary-600 p-2 rounded-md shadow-sm history-control-button ${
          currentHistoryIndex <= 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:from-brand-primary-600 hover:to-brand-primary-800'
        }`}
        title={undoTooltip}
        aria-label={undoTooltip}
      >
        <FaUndo size={14} className="text-white" />
      </button>
      <button
        onClick={() => handleUndoRedoClick('redo')}
        disabled={currentHistoryIndex >= historyLength - 1}
        className={`bg-brand-primary-600 p-2 rounded-md shadow-sm history-control-button ${
          currentHistoryIndex >= historyLength - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:from-brand-primary-600 hover:to-brand-primary-800'
        }`}
        title={redoTooltip}
        aria-label={redoTooltip}
      >
        <FaRedo size={14} className="text-white" />
      </button>
    </div>
  );
};

export default HistoryControls;