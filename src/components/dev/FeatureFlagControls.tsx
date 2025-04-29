import React, { useState } from 'react';
import { FLAGS } from '../../lib/flags';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

export function FeatureFlagControls() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-12 right-4 bg-gray-800 p-3 rounded-lg shadow-lg text-white z-50 opacity-80 hover:opacity-100 transition-opacity">
      <h3 className="text-sm font-bold mb-2">Feature Flags</h3>
      <p className="text-xs text-gray-400 mb-2">Settings persist between reloads</p>
      <div className="space-y-2">
        {(Object.keys(FLAGS) as Array<keyof typeof FLAGS>).map(flagName => (
          <FlagToggle key={flagName} flagName={flagName} />
        ))}
      </div>
    </div>
  );
}

function FlagToggle({ flagName }: { flagName: keyof typeof FLAGS }) {
  const [value, toggle] = useFeatureFlag(flagName);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const handleToggle = () => {
    toggle();
    
    // Show feedback message
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 1500);
  };
  
  return (
    <div className="flex items-center justify-between relative">
      <span className="text-xs mr-2">{flagName}:</span>
      <div>
        <button
          onClick={handleToggle}
          className={`px-2 py-1 text-xs rounded ${value ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {value ? 'ON' : 'OFF'}
        </button>
        
        {showFeedback && (
          <div className="absolute right-0 top-8 bg-gray-700 text-xs px-2 py-1 rounded whitespace-nowrap">
            Saved! Will persist after reload.
          </div>
        )}
      </div>
    </div>
  );
} 