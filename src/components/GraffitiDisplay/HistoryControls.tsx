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
  // Add debug logging to help troubleshoot visibility issues
  useEffect(() => {
    console.log('HistoryControls rendered:', {
      currentHistoryIndex,
      historyLength,
      isUndoDisabled: currentHistoryIndex <= 0,
      isRedoDisabled: currentHistoryIndex >= historyLength - 1,
      historyStates
    });
  }, [currentHistoryIndex, historyLength, historyStates]);

  // Get the previous and next state presets for tooltips
  const prevStatePreset = currentHistoryIndex > 0 ? historyStates[currentHistoryIndex - 1]?.presetId : undefined;
  const nextStatePreset = currentHistoryIndex < historyLength - 1 ? historyStates[currentHistoryIndex + 1]?.presetId : undefined;

  // Create tooltip text
  const undoTooltip = prevStatePreset ? `Undo to ${prevStatePreset} preset` : 'Undo';
  const redoTooltip = nextStatePreset ? `Redo to ${nextStatePreset} preset` : 'Redo';

  return (
    <div 
      className="z-50 flex gap-1 history-controls-container"
      style={{ 
        position: 'absolute',
        bottom: '8px',
        left: '8px'
      }}
    >
      <button
        onClick={() => onUndoRedo('undo')}
        disabled={currentHistoryIndex <= 0}
        className={`bg-gradient-to-r from-purple-500 to-purple-700 p-0.5 rounded-md shadow-sm history-control-button ${
          currentHistoryIndex <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-600 hover:to-purple-800'
        }`}
        title={undoTooltip}
        aria-label={undoTooltip}
      >
        <Undo2 size={14} className="text-white" />
      </button>
      <button
        onClick={() => onUndoRedo('redo')}
        disabled={currentHistoryIndex >= historyLength - 1}
        className={`bg-gradient-to-r from-purple-500 to-purple-700 p-0.5 rounded-md shadow-sm history-control-button ${
          currentHistoryIndex >= historyLength - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-600 hover:to-purple-800'
        }`}
        title={redoTooltip}
        aria-label={redoTooltip}
      >
        <Redo2 size={14} className="text-white" />
      </button>
    </div>
  );
};

export default HistoryControls;