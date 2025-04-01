import { useState, useEffect } from 'react';
import { useGraffitiStore } from '../store/useGraffitiStore';
import { LETTER_OVERLAP_RULES } from '../data/letterRules';
import { Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

declare const cursor: {
  edit_file: (params: {
    target_file: string;
    instructions: string;
    code_edit: string;
  }) => Promise<void>;
};

export function OverlapDebugPanel() {
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [targetLetter, setTargetLetter] = useState<string>('');
  const [modifiedLetters, setModifiedLetters] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { overlapRules, updateOverlapRule, updateSpecialCase } = useGraffitiStore();

  const selectedRule = selectedLetter ? overlapRules[selectedLetter] : null;
  const minOverlap = selectedRule?.minOverlap || 0.04;
  const maxOverlap = selectedRule?.maxOverlap || 0.12;
  const specialCaseOverlap = selectedRule?.specialCases?.[targetLetter] || 0.12;

  // Get all letters that have special cases for the selected letter
  const specialCaseLetters = selectedRule?.specialCases ? Object.keys(selectedRule.specialCases) : [];

  const handleMinOverlapChange = (value: string) => {
    if (!selectedLetter) return;
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;
    
    updateOverlapRule(selectedLetter, {
      minOverlap: Math.min(newValue, maxOverlap),
      maxOverlap,
      specialCases: selectedRule?.specialCases
    });
    setModifiedLetters(prev => new Set(prev).add(selectedLetter));
  };

  const handleMaxOverlapChange = (value: string) => {
    if (!selectedLetter) return;
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;

    updateOverlapRule(selectedLetter, {
      minOverlap,
      maxOverlap: Math.max(newValue, minOverlap),
      specialCases: selectedRule?.specialCases
    });
    setModifiedLetters(prev => new Set(prev).add(selectedLetter));
  };

  const handleSpecialCaseChange = (value: string) => {
    if (!selectedLetter || !targetLetter) return;
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;
    
    updateSpecialCase(selectedLetter, targetLetter, newValue);
    setModifiedLetters(prev => new Set(prev).add(selectedLetter));
  };

  const handleSaveLetter = () => {
    if (!selectedLetter) return;
    
    const rule = overlapRules[selectedLetter];
    if (!rule) return;

    // Format special cases
    const specialCases = rule.specialCases || {};
    const specialCaseEntries = Object.entries(specialCases);
    const formattedSpecialCases = specialCaseEntries.length > 0 
      ? specialCaseEntries
          .map(([letter, value]) => `      ${letter}: ${value.toFixed(2)}`)
          .join(',\n')
      : '';

    // Create the rule string
    const ruleString = `  ${selectedLetter}: {
    minOverlap: ${rule.minOverlap.toFixed(2)},
    maxOverlap: ${rule.maxOverlap.toFixed(2)},
    specialCases: {
${formattedSpecialCases}
    },
  },`;

    // Log the changes that would be made
    console.log('Saving changes for letter:', selectedLetter);
    console.log('New rule:', ruleString);

    // Clear modified state for this letter
    setModifiedLetters(prev => {
      const next = new Set(prev);
      next.delete(selectedLetter);
      return next;
    });
  };

  const handleResetLetter = () => {
    if (!selectedLetter) return;
    
    const originalRule = LETTER_OVERLAP_RULES[selectedLetter];
    if (!originalRule) return;

    updateOverlapRule(selectedLetter, {
      minOverlap: originalRule.minOverlap,
      maxOverlap: originalRule.maxOverlap,
      specialCases: originalRule.specialCases
    });

    setModifiedLetters(prev => {
      const next = new Set(prev);
      next.delete(selectedLetter);
      return next;
    });
  };

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 text-sm z-[9999] isolate text-gray-900 transition-all duration-200",
        isCollapsed ? "w-auto p-2" : "w-72 p-3"
      )}
    >
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="font-medium">Overlap Debug</span>
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Overlap Debug</h3>
            <div className="flex items-center space-x-2 text-xs">
              {selectedLetter && (
                <>
                  <button
                    onClick={handleResetLetter}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Reset
                  </button>
                  {modifiedLetters.has(selectedLetter) && (
                    <button
                      onClick={handleSaveLetter}
                      className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                    >
                      Save
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setIsCollapsed(true)}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Letter
            </label>
            <select
              value={selectedLetter}
              onChange={(e) => setSelectedLetter(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm px-2 py-1 text-sm text-gray-900 bg-white"
            >
              <option value="">Select...</option>
              {Array.from('abcdefghijklmnopqrstuvwxyz0123456789').map((letter) => (
                <option key={letter} value={letter} className="text-gray-900">
                  {letter} {modifiedLetters.has(letter) ? '•' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedLetter && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Min Overlap
                </label>
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    value={minOverlap}
                    onChange={(e) => handleMinOverlapChange(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    value={minOverlap}
                    onChange={(e) => handleMinOverlapChange(e.target.value)}
                    className="w-16 rounded-md border border-gray-300 shadow-sm px-1 py-0.5 text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Overlap
                </label>
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    value={maxOverlap}
                    onChange={(e) => handleMaxOverlapChange(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    value={maxOverlap}
                    onChange={(e) => handleMaxOverlapChange(e.target.value)}
                    className="w-16 rounded-md border border-gray-300 shadow-sm px-1 py-0.5 text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Special Case
                  </label>
                  {specialCaseLetters.length > 0 && (
                    <span className="text-xs text-blue-600 mb-1">
                      {specialCaseLetters.length} rules
                    </span>
                  )}
                </div>
                <select
                  value={targetLetter}
                  onChange={(e) => setTargetLetter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-2 py-1 text-sm text-gray-900 bg-white mb-2"
                >
                  <option value="">Select target...</option>
                  {Array.from('abcdefghijklmnopqrstuvwxyz0123456789').map((letter) => (
                    <option key={letter} value={letter} className="text-gray-900">
                      {letter} {specialCaseLetters.includes(letter) ? ' 🔗' : ''}
                    </option>
                  ))}
                </select>

                {targetLetter && (
                  <div className="flex space-x-2">
                    <input
                      type="range"
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      value={specialCaseOverlap}
                      onChange={(e) => handleSpecialCaseChange(e.target.value)}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      value={specialCaseOverlap}
                      onChange={(e) => handleSpecialCaseChange(e.target.value)}
                      className="w-16 rounded-md border border-gray-300 shadow-sm px-1 py-0.5 text-xs text-gray-900"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
} 