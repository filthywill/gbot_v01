// HistoryControls.tsx
import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';

interface HistoryControlsProps {
  currentHistoryIndex: number;
  historyLength: number;
  onUndoRedo: (direction: 'undo' | 'redo') => void;
}

const HistoryControls: React.FC<HistoryControlsProps> = ({ 
  currentHistoryIndex, 
  historyLength, 
  onUndoRedo 
}) => {
  return (
    <div className="absolute bottom-2 left-2 z-50 flex gap-1">
      <button
        onClick={() => onUndoRedo('undo')}
        disabled={currentHistoryIndex <= 0}
        className={`bg-white bg-opacity-70 hover:bg-opacity-100 p-1 rounded-md shadow-sm transition-all ${
          currentHistoryIndex <= 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Undo"
      >
        <Undo2 size={18} className="text-gray-700" />
      </button>
      <button
        onClick={() => onUndoRedo('redo')}
        disabled={currentHistoryIndex >= historyLength - 1}
        className={`bg-white bg-opacity-70 hover:bg-opacity-100 p-1 rounded-md shadow-sm transition-all ${
          currentHistoryIndex >= historyLength - 1 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Redo"
      >
        <Redo2 size={18} className="text-gray-700" />
      </button>
    </div>
  );
};

export default HistoryControls;