import { useState, useEffect } from 'react';
import { useGraffitiStore } from '../store/useGraffitiStore';
import { getOverlapValue, COMPLETE_OVERLAP_LOOKUP } from '../data/generatedOverlapLookup';
import { Minimize2, Maximize2, Download, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { DEV_CONFIG } from '../utils/devConfig';
import { getLetterSvg } from '../utils/letterUtils';
import { processSvg, findOptimalOverlap } from '../utils/svgUtils';

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
  const [useRuntimeCalculation, setUseRuntimeCalculation] = useState(
    () => DEV_CONFIG.getRuntimeOverlapEnabled()
  );
  const [isResetting, setIsResetting] = useState(false);

  // Export functionality state
  const [exportProgress, setExportProgress] = useState<{
    isExporting: boolean;
    current: number;
    total: number;
    eta: string;
    currentChar: string;
    canCancel: boolean;
  } | null>(null);
  const [exportResults, setExportResults] = useState<Record<string, Record<string, number>> | null>(null);

  const { overlapRules, defaultOverlap, overlapExceptions, updateOverlapRule, updateSpecialCase } = useGraffitiStore();

  const selectedRule = selectedLetter ? overlapRules[selectedLetter] : null;
  const minOverlap = selectedRule?.minOverlap || 0.04;
  const maxOverlap = selectedRule?.maxOverlap || 0.12;
  const specialCaseOverlap = selectedRule?.specialCases?.[targetLetter] || 0.12;

  // Get all letters that have special cases for the selected letter
  const specialCaseLetters = selectedRule?.specialCases ? Object.keys(selectedRule.specialCases) : [];

  // Sync with store changes - ensure UI updates when store changes
  useEffect(() => {
    // Force re-render when overlapRules change
    if (selectedLetter && overlapRules[selectedLetter]) {
      // This effect will trigger when the store updates
      if (__DEV__) {
        console.log('📊 Store updated for letter:', selectedLetter, overlapRules[selectedLetter]);
      }
    }
  }, [overlapRules, selectedLetter]);

  // Clear target letter when selected letter changes
  useEffect(() => {
    setTargetLetter('');
  }, [selectedLetter]);

  // Helper function to get or process SVG for a character
  const getOrProcessSvg = async (char: string) => {
    try {
      // Get SVG path and fetch content
      const svgPath = await getLetterSvg(char, false, false, false, 'straight');
      if (!svgPath) {
        throw new Error(`No SVG path found for character: ${char}`);
      }

      // Fetch SVG content
      const response = await fetch(svgPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch SVG for ${char}: ${response.statusText}`);
      }
      const svgContent = await response.text();

      // Process SVG with full resolution for accurate pixel analysis
      const processedSvg = await processSvg(svgContent, char, 200); // Full resolution for accuracy
      
      // Validate that we have proper pixel data
      if (!processedSvg.verticalPixelRanges || processedSvg.verticalPixelRanges.length === 0) {
        if (__DEV__) {
          console.warn(`No pixel data for character ${char}, using fallback`);
        }
        throw new Error(`No pixel data for character ${char}`);
      }
      
      return processedSvg;
    } catch (error) {
      console.error(`Error processing SVG for ${char}:`, error);
      
      // Create a more realistic fallback with proper pixel data
      const fallbackPixelData: boolean[][] = Array(200).fill(null).map(() => Array(200).fill(false));
      const fallbackVerticalRanges: Array<{ top: number, bottom: number, density: number }> = Array(200).fill(null);
      
      // Create a simple rectangular shape for the fallback
      const charWidth = 80;
      const charHeight = 120;
      const startX = 60;
      const startY = 40;
      
      // Fill pixel data for a simple rectangle
      for (let y = startY; y < startY + charHeight && y < 200; y++) {
        for (let x = startX; x < startX + charWidth && x < 200; x++) {
          fallbackPixelData[y][x] = true;
        }
      }
      
      // Create vertical pixel ranges for the rectangle
      for (let x = 0; x < 200; x++) {
        if (x >= startX && x < startX + charWidth) {
          fallbackVerticalRanges[x] = { 
            top: startY, 
            bottom: startY + charHeight - 1, 
            density: 1.0 
          };
        } else {
          fallbackVerticalRanges[x] = { 
            top: 0, 
            bottom: 199, 
            density: 0 
          };
        }
      }
      
      return {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect x="${startX}" y="${startY}" width="${charWidth}" height="${charHeight}" fill="black"/></svg>`,
        width: 200,
        height: 200,
        bounds: { left: startX, right: startX + charWidth, top: startY, bottom: startY + charHeight },
        pixelData: fallbackPixelData,
        verticalPixelRanges: fallbackVerticalRanges,
        scale: 1,
        letter: char,
        isSpace: false
      };
    }
  };

  // Main export function
  const generateAllCombinations = async () => {
    if (__DEV__) {
      console.log('Starting overlap calculation export with runtime mode enabled');
    }
    
    const characters = Array.from('abcdefghijklmnopqrstuvwxyz0123456789');
    const results: Record<string, Record<string, number>> = {};
    const BATCH_SIZE = 10; // Smaller batch size for better responsiveness and accuracy
    
    let processed = 0;
    const total = characters.length * characters.length;
    const startTime = Date.now();
    let cancelled = false;

    // Set initial progress
    setExportProgress({
      isExporting: true,
      current: 0,
      total,
      eta: 'Calculating...',
      currentChar: '',
      canCancel: true
    });

    try {
      // Force runtime mode for accurate calculations
      const originalMode = useRuntimeCalculation;
      setUseRuntimeCalculation(true);
      DEV_CONFIG.setRuntimeOverlapEnabled(true);
      
      for (let i = 0; i < characters.length && !cancelled; i++) {
        const firstChar = characters[i];
        results[firstChar] = {};
        
        if (__DEV__) {
          console.log(`Processing first character: ${firstChar}`);
        }
        
        // Get or process the first character's SVG
        const firstSvg = await getOrProcessSvg(firstChar);
        
        // Process in batches for this first character
        for (let j = 0; j < characters.length && !cancelled; j += BATCH_SIZE) {
          const batch = characters.slice(j, Math.min(j + BATCH_SIZE, characters.length));
          
          for (const secondChar of batch) {
            if (cancelled) break;
            
            // Get or process the second character's SVG
            const secondSvg = await getOrProcessSvg(secondChar);
            
            // Use the actual runtime calculation - force it to use pixel analysis
            const overlap = findOptimalOverlap(
              firstSvg, 
              secondSvg, 
              overlapRules, 
              defaultOverlap, 
              overlapExceptions
            );
            
            results[firstChar][secondChar] = parseFloat(overlap.toFixed(3));
            processed++;
            
            // Log some sample calculations for debugging
            if (__DEV__ && processed % 100 === 0) {
              console.log(`Sample calculation: ${firstChar}→${secondChar} = ${overlap}`);
            }
            
            // Calculate ETA
            const elapsed = Date.now() - startTime;
            const rate = processed / elapsed;
            const remaining = total - processed;
            const etaMs = remaining / rate;
            const eta = new Date(Date.now() + etaMs).toLocaleTimeString();
            
            // Update progress
            setExportProgress(prev => prev ? {
              ...prev,
              current: processed,
              eta,
              currentChar: `${firstChar}→${secondChar}`
            } : null);
          }
          
          // Allow UI to update between batches
          await new Promise(resolve => setTimeout(resolve, 50)); // Longer delay for stability
          
          // Check if cancelled
          if (exportProgress?.canCancel === false) {
            cancelled = true;
          }
        }
      }

      // Restore original mode
      setUseRuntimeCalculation(originalMode);
      DEV_CONFIG.setRuntimeOverlapEnabled(originalMode);
      
      if (__DEV__) {
        console.log('Export completed, sample results:', {
          'a→b': results['a']?.['b'],
          'r→c': results['r']?.['c'],
          total: Object.keys(results).length
        });
      }

      if (!cancelled) {
        setExportResults(results);
        setExportProgress(prev => prev ? {
          ...prev,
          isExporting: false,
          currentChar: 'Complete!'
        } : null);
      }

      return results;
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress(null);
      throw error;
    }
  };

  // Generate TypeScript code from results
  const generateTypescriptCode = (results: Record<string, Record<string, number>>) => {
    const timestamp = new Date().toISOString();
    const totalCombinations = Object.keys(results).length * Object.keys(results[Object.keys(results)[0]]).length;
    
    return `// Generated automatically on ${timestamp}
// Total combinations: ${totalCombinations}
// Character set: abcdefghijklmnopqrstuvwxyz0123456789
// DO NOT EDIT MANUALLY - Use OverlapDebugPanel to regenerate

export const COMPLETE_OVERLAP_LOOKUP: Record<string, Record<string, number>> = {
${Object.entries(results).map(([firstChar, secondCharMap]) => 
  `  '${firstChar}': {\n${Object.entries(secondCharMap).map(([secondChar, overlap]) => 
    `    '${secondChar}': ${overlap}`
  ).join(',\n')}\n  }`
).join(',\n')}
};

// Helper function to get overlap value with fallback
export const getOverlapValue = (
  firstChar: string, 
  secondChar: string, 
  fallback: number = 0.12
): number => {
  return COMPLETE_OVERLAP_LOOKUP[firstChar]?.[secondChar] ?? fallback;
};

// Validation helper - compare with existing special cases
export const validateAgainstSpecialCases = (
  letterRules: Record<string, any>
): { matches: number; conflicts: Array<{ char: string; target: string; expected: number; actual: number }> } => {
  const conflicts: Array<{ char: string; target: string; expected: number; actual: number }> = [];
  let matches = 0;
  
  Object.entries(letterRules).forEach(([char, rule]) => {
    if (rule.specialCases) {
      Object.entries(rule.specialCases).forEach(([target, expected]) => {
        const actual = getOverlapValue(char, target);
        if (Math.abs(actual - (expected as number)) > 0.001) {
          conflicts.push({ char, target, expected: expected as number, actual });
        } else {
          matches++;
        }
      });
    }
  });
  
  return { matches, conflicts };
};`;
  };

  // Export handlers
  const handleStartExport = async () => {
    try {
      await generateAllCombinations();
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress(null);
    }
  };

  const handleCancelExport = () => {
    setExportProgress(prev => prev ? { ...prev, canCancel: false } : null);
  };

  const handleCopyResults = () => {
    if (exportResults) {
      const code = generateTypescriptCode(exportResults);
      copyToClipboard(code);
    }
  };

  const handleAutoUpdateFile = async () => {
    if (!exportResults) return;

    try {
      const code = generateTypescriptCode(exportResults);
      
      // Check if File System Access API is available
      if ('showSaveFilePicker' in window) {
        try {
          // Try to get a file handle for the specific file
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: 'generatedOverlapLookup.ts',
            types: [{
              description: 'TypeScript files',
              accept: { 'text/typescript': ['.ts'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(code);
          await writable.close();
          
          if (__DEV__) {
            console.log('✅ File updated successfully!');
          }
          
          // Show success message
          alert('✅ generatedOverlapLookup.ts updated successfully!\n\nThe file has been saved. Your app will use the new values after a refresh.');
          
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            // User cancelled - that's fine
            return;
          }
          throw err;
        }
      } else {
        // Fallback: Create download with specific filename
        const blob = new Blob([code], { type: 'text/typescript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generatedOverlapLookup.ts';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('📁 File downloaded as generatedOverlapLookup.ts\n\nPlease replace the existing file in src/data/ and refresh your app.');
      }
      
    } catch (error) {
      console.error('Error updating file:', error);
      alert('❌ Error updating file. Falling back to clipboard copy.');
      
      // Fallback to clipboard
      const code = generateTypescriptCode(exportResults);
      copyToClipboard(code);
    }
  };

  const handleCloseExport = () => {
    setExportProgress(null);
    setExportResults(null);
  };

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

  // Helper function to extract overlap rule from lookup table
  const getOriginalRuleFromLookup = (letter: string) => {
    const allLetters = Array.from('abcdefghijklmnopqrstuvwxyz0123456789');
    
    // Get all overlap values for this letter from the lookup table
    const overlapValues = allLetters
      .map(targetLetter => getOverlapValue(letter, targetLetter))
      .filter(val => val !== 0.12); // Filter out fallback values
    
    if (overlapValues.length === 0) {
      // If no lookup values found, use defaults
      return {
        minOverlap: defaultOverlap.minOverlap,
        maxOverlap: defaultOverlap.maxOverlap,
        specialCases: {}
      };
    }
    
    // Calculate min/max from lookup values
    const minOverlap = Math.min(...overlapValues);
    const maxOverlap = Math.max(...overlapValues);
    
    // Find special cases (values that differ from the mode/most common value)
    const valueCounts = overlapValues.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const mostCommonValue = Object.entries(valueCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    const commonValue = mostCommonValue ? parseFloat(mostCommonValue) : maxOverlap;
    
    // Identify special cases (letters with non-standard overlap)
    const specialCases: Record<string, number> = {};
    allLetters.forEach(targetLetter => {
      const value = getOverlapValue(letter, targetLetter);
      if (value !== 0.12 && Math.abs(value - commonValue) > 0.001) {
        specialCases[targetLetter] = value;
      }
    });
    
    return {
      minOverlap,
      maxOverlap: commonValue, // Use most common value as maxOverlap
      specialCases
    };
  };

  const handleResetLetter = async () => {
    if (!selectedLetter) {
      if (__DEV__) {
        console.warn('🔄 Reset attempted but no letter selected');
      }
      return;
    }
    
    setIsResetting(true);
    if (__DEV__) {
      console.log('🔄 Resetting letter:', selectedLetter);
      console.log('📊 Current store state:', overlapRules[selectedLetter]);
    }
    
    try {
      const originalRule = getOriginalRuleFromLookup(selectedLetter);
      
      if (__DEV__) {
        console.log('📊 Original rule from lookup table:', originalRule);
      }
      
      // Create a complete reset with all original values
      const resetRule = {
        minOverlap: originalRule.minOverlap,
        maxOverlap: originalRule.maxOverlap,
        specialCases: originalRule.specialCases ? { ...originalRule.specialCases } : {}
      };
      
      if (__DEV__) {
        console.log('📊 Resetting to:', resetRule);
      }
      updateOverlapRule(selectedLetter, resetRule);

      // Clear modified state for this letter
      setModifiedLetters(prev => {
        const next = new Set(prev);
        next.delete(selectedLetter);
        if (__DEV__) {
          console.log('📊 Cleared modified state for:', selectedLetter);
        }
        return next;
      });
      
      // Clear target letter to refresh special case display
      setTargetLetter('');
      
      if (__DEV__) {
        console.log('✅ Reset completed for letter:', selectedLetter);
      }
      
      // Small delay to show visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleRuntime = (enabled: boolean) => {
    if (__DEV__) {
      console.log('🔄 Toggle Runtime Calculation:', enabled);
    }
    console.log('Previous state:', useRuntimeCalculation);
    
    DEV_CONFIG.setRuntimeOverlapEnabled(enabled);
    setUseRuntimeCalculation(enabled);
    
    console.log('New state set to:', enabled);
    console.log('localStorage value:', localStorage.getItem('dev-runtime-overlap'));
    console.log('DEV_CONFIG.getRuntimeOverlapEnabled():', DEV_CONFIG.getRuntimeOverlapEnabled());
    
    // Note: This will affect overlap calculations on the next position update
  };

  // Helper function to create a mock ProcessedSvg for testing
  const createMockProcessedSvg = (letter: string) => {
    const mockSvg = `<svg width="200" height="200"><text x="100" y="100" text-anchor="middle">${letter}</text></svg>`;
    return {
      svg: mockSvg,
      width: 200,
      height: 200,
      bounds: { left: 20, right: 180, top: 20, bottom: 180 },
      pixelData: Array(200).fill(null).map(() => Array(200).fill(false)),
      verticalPixelRanges: Array(200).fill({ top: 20, bottom: 180, density: 0.5 }),
      scale: 1,
      letter: letter,
      isSpace: false
    };
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      if (__DEV__) {
        console.log('TypeScript code copied to clipboard!');
      }
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      if (__DEV__) {
        console.log('TypeScript code copied to clipboard (fallback method)!');
      }
    }
  };

  const testCurrentMode = async () => {
    if (__DEV__) {
      console.log('🧪 TESTING OVERLAP CALCULATION MODE');
      console.log('=====================================');
      console.log('Current toggle state:', useRuntimeCalculation ? 'RUNTIME' : 'LOOKUP');
      console.log('');
      
      // Test a few combinations
      const testCases = [
        ['a', 'b'],
        ['r', 'c'], 
        ['x', 'y']
      ];
      
      for (const [first, second] of testCases) {
        console.log(`--- Test Case: ${first}→${second} ---`);
        
        try {
          const firstSvg = await getOrProcessSvg(first);
          const secondSvg = await getOrProcessSvg(second);
          
          const start = performance.now();
          const result = findOptimalOverlap(
            firstSvg, 
            secondSvg, 
            overlapRules, 
            defaultOverlap, 
            overlapExceptions
          );
          const duration = performance.now() - start;
          
          console.log(`⚡ ${useRuntimeCalculation ? 'RUNTIME' : 'LOOKUP'} mode: ${duration.toFixed(3)}ms`);
          console.log(`📐 Result: ${result}`);
        } catch (error) {
          console.error(`❌ Error testing ${first}→${second}:`, error);
        }
        console.log('');
      }
    }
  };

  const testDirectLookupPerformance = async () => {
    if (__DEV__) {
      console.log('⚡ DIRECT LOOKUP PERFORMANCE TEST');
      console.log('==================================');
      
      // Test 1: Direct lookup table access
      const iterations = 1000;
      const start1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        const value = COMPLETE_OVERLAP_LOOKUP['a']?.['b'] ?? 0.12;
      }
      const duration1 = performance.now() - start1;
      console.log(`🔍 Test 1: Direct Lookup Table Access`);
      console.log(`Direct lookup (${iterations}x): ${duration1.toFixed(3)}ms (${(duration1/iterations).toFixed(6)}ms per lookup)`);
      console.log('');
      
      // Test 2: getOverlapValue function
      const start2 = performance.now();
      for (let i = 0; i < iterations; i++) {
        const value = getOverlapValue('a', 'b');
      }
      const duration2 = performance.now() - start2;
      console.log(`🔍 Test 2: getOverlapValue Function`);
      console.log(`getOverlapValue (${iterations}x): ${duration2.toFixed(3)}ms (${(duration2/iterations).toFixed(6)}ms per lookup)`);
      console.log('');
      
      // Test 3: Check lookup table content
      console.log(`🔍 Test 3: Lookup Table Content Check`);
      console.log('Sample values from lookup table:');
      console.log(`a→b: ${COMPLETE_OVERLAP_LOOKUP['a']?.['b']}`);
      console.log(`r→c: ${COMPLETE_OVERLAP_LOOKUP['r']?.['c']}`);
      console.log(`x→y: ${COMPLETE_OVERLAP_LOOKUP['x']?.['y']}`);
      console.log(`z→z: ${COMPLETE_OVERLAP_LOOKUP['z']?.['z']}`);
    }
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
            <div>
              <h3 className="font-medium text-gray-900">Overlap Debug</h3>
              <p className="text-xs text-gray-500 mt-0.5">Reset uses lookup table values</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              {selectedLetter && (
                <>
                  <button
                    onClick={handleResetLetter}
                    disabled={isResetting}
                    title="Reset to values from lookup table (generatedOverlapLookup.ts)"
                    className={cn(
                      "text-xs px-2 py-1 rounded transition-colors",
                      isResetting 
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200 cursor-not-allowed"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {isResetting ? '🔄 Resetting...' : 'Reset'}
                  </button>
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
          
          {DEV_CONFIG.RUNTIME_OVERLAP_AVAILABLE && (
            <div className="mb-3 p-2 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-medium text-blue-900">
                    Runtime Calculation
                  </label>
                  <p className="text-xs text-blue-700">
                    {useRuntimeCalculation ? 'Using pixel analysis' : 'Using lookup table'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRuntimeCalculation}
                    onChange={(e) => handleToggleRuntime(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {/* Visual Status Indicator */}
              <div className={`mb-2 p-2 rounded text-center text-xs font-medium ${
                useRuntimeCalculation 
                  ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {useRuntimeCalculation ? '🔬 RUNTIME MODE: Pixel Analysis' : '📊 LOOKUP MODE: Pre-calculated'}
              </div>

              {/* Test Button */}
              <button
                onClick={testCurrentMode}
                className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                🧪 Test Current Mode (Check Console)
              </button>
              
              {/* Direct Performance Test */}
              <button
                onClick={testDirectLookupPerformance}
                className="w-full px-2 py-1 mt-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
              >
                ⚡ Direct Performance Test
              </button>

              {/* Simple Lookup Test */}
              <button
                onClick={() => {
                  console.clear();
                  console.log('🔧 SIMPLE LOOKUP TEST');
                  console.log('======================');
                  
                  try {
                    // Test direct import
                    console.log('Testing direct imports...');
                    
                    // Test getOverlapValue function
                    const testValue = getOverlapValue('a', 'b');
                    console.log(`✅ getOverlapValue('a', 'b') = ${testValue}`);
                    
                    // Test DEV_CONFIG
                    console.log(`✅ DEV_CONFIG.getRuntimeOverlapEnabled() = ${DEV_CONFIG.getRuntimeOverlapEnabled()}`);
                    
                    // Test localStorage
                    console.log(`✅ localStorage['dev-runtime-overlap'] = ${localStorage.getItem('dev-runtime-overlap')}`);
                    
                    // Test toggle state
                    console.log(`✅ useRuntimeCalculation state = ${useRuntimeCalculation}`);
                    
                    // Test a simple overlap calculation
                    console.log('Testing simple overlap calculation...');
                    const mockSvg1 = createMockProcessedSvg('a');
                    const mockSvg2 = createMockProcessedSvg('b');
                    
                    console.log('Mock SVGs created successfully');
                    console.log(`mockSvg1.letter: ${mockSvg1.letter}`);
                    console.log(`mockSvg2.letter: ${mockSvg2.letter}`);
                    
                    // Call findOptimalOverlap directly
                    const result = findOptimalOverlap(mockSvg1, mockSvg2, overlapRules, defaultOverlap, overlapExceptions);
                    console.log(`✅ findOptimalOverlap result: ${result}`);
                    
                    console.log('🎯 SIMPLE TEST COMPLETED SUCCESSFULLY!');
                    
                  } catch (error) {
                    console.error('❌ Error in simple test:', error);
                  }
                }}
                className="w-full px-2 py-1 mt-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                🔧 Simple Lookup Test
              </button>
            </div>
          )}

          {/* Export Lookup Table Section */}
          {DEV_CONFIG.RUNTIME_OVERLAP_AVAILABLE && (
            <div className="mb-3 p-2 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-medium text-green-900">
                    Export Lookup Table
                  </label>
                  <p className="text-xs text-green-700">
                    Generate and auto-update lookup file
                  </p>
                </div>
                {!exportProgress && !exportResults && (
                  <button
                    onClick={handleStartExport}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                )}
              </div>

              {/* Progress Display */}
              {exportProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-700">
                      {exportProgress.current} / {exportProgress.total}
                    </span>
                    <span className="text-green-600">
                      ETA: {exportProgress.eta}
                    </span>
                  </div>
                  
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-700">
                      {exportProgress.currentChar}
                    </span>
                    {exportProgress.canCancel && exportProgress.isExporting && (
                      <button
                        onClick={handleCancelExport}
                        className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Results Display */}
              {exportResults && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-700 font-medium">
                      Export Complete! Ready to update file.
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={handleAutoUpdateFile}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      >
                        Update File
                      </button>
                      <button
                        onClick={handleCopyResults}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Copy Code
                      </button>
                      <button
                        onClick={handleCloseExport}
                        className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-green-600">
                    {Object.keys(exportResults).length * Object.keys(exportResults[Object.keys(exportResults)[0]]).length} combinations generated
                  </p>
                </div>
              )}
            </div>
          )}
          
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