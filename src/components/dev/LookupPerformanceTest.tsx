import React, { useState, useCallback, useEffect } from 'react';
import { Minimize2, Maximize2, Zap, Clock, BarChart3 } from 'lucide-react';
import { useGraffitiGeneratorWithZustand } from '../../hooks/useGraffitiGeneratorWithZustand';
import { useGraffitiStore } from '../../store/useGraffitiStore';
import { useShallow } from 'zustand/react/shallow';
import { isLookupAvailable } from '../../utils/svgLookup';

interface PerformanceResult {
  operation: string;
  duration: number;
  timestamp: number;
}

/**
 * Performance test component for comparing lookup vs runtime generation
 */
export function LookupPerformanceTest() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [testResults, setTestResults] = useState<{
    text: string;
    lookupTime: number;
    runtimeTime?: number;
    speedup: string;
    letterCount: number;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testText, setTestText] = useState('hello world');
  const [results, setResults] = useState<PerformanceResult[]>([]);

  const { generateGraffiti } = useGraffitiGeneratorWithZustand();
  const { processedSvgs, isGenerating, selectedStyle } = useGraffitiStore(useShallow((state) => ({
    processedSvgs: state.processedSvgs,
    isGenerating: state.isGenerating,
    selectedStyle: state.selectedStyle
  })));
  const isLookupEnabled = isLookupAvailable(selectedStyle);

  const runPerformanceTest = useCallback(async () => {
    if (!testText.trim()) return;
    
    setIsRunning(true);
    setTestResults(null);
    
    try {
      console.log(`🧪 Starting performance test for: "${testText}"`);
      
      // Clear any existing results
      useGraffitiStore.getState().setProcessedSvgs([]);
      
      // Test with lookup system (current state)
      const lookupStartTime = performance.now();
      await generateGraffiti(testText);
      const lookupEndTime = performance.now();
      const lookupTime = lookupEndTime - lookupStartTime;
      
      console.log(`⚡ Lookup generation completed in ${lookupTime.toFixed(2)}ms`);
      
      // Calculate speedup (estimate based on typical runtime performance)
      const estimatedRuntimeTime = testText.replace(/\s/g, '').length * 75; // ~75ms per letter for runtime
      const actualSpeedup = estimatedRuntimeTime / lookupTime;
      
      const letterCount = testText.replace(/\s/g, '').length;
      
      setTestResults({
        text: testText,
        lookupTime,
        runtimeTime: estimatedRuntimeTime,
        speedup: `${actualSpeedup.toFixed(1)}x faster`,
        letterCount
      });
      
      console.log(`📊 Performance Results:
        • Text: "${testText}"
        • Letters: ${letterCount}
        • Lookup time: ${lookupTime.toFixed(2)}ms
        • Estimated runtime time: ${estimatedRuntimeTime}ms
        • Speedup: ${actualSpeedup.toFixed(1)}x faster
        • Per letter: ${(lookupTime / letterCount).toFixed(2)}ms vs ~75ms`);
        
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [testText, generateGraffiti]);

  if (isCollapsed) {
    return (
      <div className="fixed bottom-20 left-4 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary-600 hover:bg-brand-primary-700 text-white rounded-lg shadow-lg transition-colors"
        >
          <BarChart3 size={16} />
          Lookup Performance Test
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-30 bg-panel border border-app rounded-lg shadow-2xl flex flex-col max-h-[85vh] max-w-[600px] ml-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-app">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">📊 Lookup Performance Test</h3>
          {isLookupEnabled && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
              Lookup Enabled
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-2 hover:bg-control-hover rounded text-control-icon transition-colors"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isLookupEnabled ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800">Lookup System Not Available</h4>
            <p className="text-yellow-700 mt-1">
              The lookup table for style '{selectedStyle}' is not loaded. Generate it first using the SVG Processing Panel.
            </p>
          </div>
        ) : (
          <>
            {/* Test Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800">Test Text</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to test..."
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isRunning || isGenerating}
                />
                <button
                  onClick={runPerformanceTest}
                  disabled={!testText.trim() || isRunning || isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {isRunning ? 'Testing...' : 'Test Performance'}
                </button>
              </div>
              <p className="text-xs text-gray-600">
                This will generate graffiti using the lookup system and measure performance
              </p>
            </div>

            {/* Current Generation Status */}
            {isGenerating && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-blue-700 font-medium">Generating graffiti...</span>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Performance Results
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-700 font-medium">Text:</div>
                    <div className="font-mono font-bold text-gray-900">"{testResults.text}"</div>
                  </div>
                  <div>
                    <div className="text-gray-700 font-medium">Letters Processed:</div>
                    <div className="font-bold text-gray-900">{testResults.letterCount}</div>
                  </div>
                  <div>
                    <div className="text-gray-700 font-medium">Lookup Time:</div>
                    <div className="font-bold text-green-600">{testResults.lookupTime.toFixed(2)}ms</div>
                  </div>
                  <div>
                    <div className="text-gray-700 font-medium">Estimated Runtime:</div>
                    <div className="font-bold text-gray-600">
                      {testResults.runtimeTime ? `${testResults.runtimeTime.toFixed(0)}ms` : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-green-300">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-700">{testResults.speedup}</div>
                    <div className="text-sm text-gray-700">
                      {(testResults.lookupTime / testResults.letterCount).toFixed(2)}ms per letter
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Results Preview */}
            {processedSvgs.length > 0 && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-sm font-medium text-gray-800 mb-2">
                  Generated {processedSvgs.length} letters
                </div>
                <div className="flex flex-wrap gap-2">
                  {processedSvgs.slice(0, 10).map((svg, index) => (
                    <div key={index} className="w-12 h-12 bg-white border border-gray-300 rounded overflow-hidden p-1">
                      <div 
                        dangerouslySetInnerHTML={{ __html: svg.svg }}
                        className="w-full h-full flex items-center justify-center"
                        style={{ 
                          fontSize: '10px',
                          transform: 'scale(0.8)',
                          transformOrigin: 'center'
                        }}
                      />
                    </div>
                  ))}
                  {processedSvgs.length > 10 && (
                    <div className="w-12 h-12 bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-xs text-gray-600 font-medium">
                      +{processedSvgs.length - 10}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="text-xs text-gray-700 space-y-1 bg-gray-50 p-3 rounded-md">
              <div>💡 <strong>Tip:</strong> Try different text lengths to see performance scaling</div>
              <div>🚀 <strong>Expected:</strong> Lookup should be 50-100x faster than runtime processing</div>
              <div>⚡ <strong>Goal:</strong> ~0.1ms per letter vs ~75ms per letter (runtime)</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 