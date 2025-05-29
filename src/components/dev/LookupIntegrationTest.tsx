import React, { useState, useEffect } from 'react';
import { Minimize2, Maximize2, TestTube2 } from 'lucide-react';
import { getProcessedSvgFromLookupTable, isLookupAvailable, getLookupStats } from '../../utils/svgLookup';
import { processSvg } from '../../utils/dev/svgProcessing';
import { getLetterSvg } from '../../utils/letterUtils';
import { ProcessedSvg } from '../../types';

/**
 * Development component to test lookup integration
 * This helps verify that our lookup system works correctly
 */
export function LookupIntegrationTest() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [testLetter, setTestLetter] = useState('a');
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<ProcessedSvg | null>(null);
  const [runtimeResult, setRuntimeResult] = useState<ProcessedSvg | null>(null);
  const [performanceData, setPerformanceData] = useState<{
    lookupTime: number;
    runtimeTime: number;
    improvement: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = getLookupStats();

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    setLookupResult(null);
    setRuntimeResult(null);
    setPerformanceData(null);

    try {
      console.log(`🧪 Testing lookup integration for letter '${testLetter}'`);

      // Test 1: Lookup performance
      const lookupStartTime = performance.now();
      const lookupSvg = await getProcessedSvgFromLookupTable(testLetter, 'straight', 'standard', 0, {
        logPerformance: true
      });
      const lookupEndTime = performance.now();
      const lookupTime = lookupEndTime - lookupStartTime;

      setLookupResult(lookupSvg);
      console.log(`⚡ Lookup completed in ${lookupTime.toFixed(2)}ms`);

      // Test 2: Runtime processing for comparison (development only)
      let runtimeTime = 0;
      try {
        const runtimeStartTime = performance.now();
        
        // Get SVG content like the runtime system does
        const svgPath = await getLetterSvg(testLetter, false, false, false, 'straight');
        if (!svgPath) {
          throw new Error(`No SVG path found for letter '${testLetter}'`);
        }

        // Fetch SVG content if it's a URL
        let svgContent = svgPath;
        if (svgPath.startsWith('/') || svgPath.startsWith('http')) {
          const response = await fetch(svgPath);
          if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.statusText}`);
          }
          svgContent = await response.text();
        }

        const runtimeSvg = await processSvg(svgContent, testLetter, 0, 200);
        const runtimeEndTime = performance.now();
        runtimeTime = runtimeEndTime - runtimeStartTime;
        
        setRuntimeResult(runtimeSvg);
        console.log(`🔧 Runtime processing completed in ${runtimeTime.toFixed(2)}ms`);

        // Calculate improvement
        const improvement = runtimeTime > 0 ? ((runtimeTime - lookupTime) / runtimeTime * 100).toFixed(1) : '∞';
        const speedup = runtimeTime > 0 ? (runtimeTime / lookupTime).toFixed(1) : '∞';
        
        setPerformanceData({
          lookupTime,
          runtimeTime,
          improvement: `${improvement}% faster (${speedup}x speedup)`
        });

        console.log(`📊 Performance improvement: ${improvement}% faster`);

      } catch (runtimeError) {
        console.warn('Runtime processing failed (expected in production):', runtimeError);
        setPerformanceData({
          lookupTime,
          runtimeTime: 0,
          improvement: 'Runtime not available'
        });
      }

    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial test on component mount
  useEffect(() => {
    if (isLookupAvailable('straight') && !isCollapsed) {
      runTest();
    }
  }, [testLetter, isCollapsed]);

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary-600 hover:bg-brand-primary-700 text-white rounded-lg shadow-lg transition-colors"
        >
          <TestTube2 size={16} />
          Lookup Integration Test
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-40 bg-panel border border-app rounded-lg shadow-2xl flex flex-col max-h-[85vh] max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-app">
        <div className="flex items-center gap-3">
          <TestTube2 className="w-5 h-5 text-brand-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">🧪 Lookup Integration Test</h3>
          {isLookupAvailable('straight') && (
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
        {!isLookupAvailable('straight') ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800">Lookup Table Not Available</h4>
            <p className="text-yellow-700 mt-1">
              The 'straight' style lookup table is not loaded. Generate it using the SVG Processing Panel.
            </p>
          </div>
        ) : (
          <>
            {/* Test Controls */}
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Test Letter</label>
                <select
                  value={testLetter}
                  onChange={(e) => setTestLetter(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500"
                  disabled={isLoading}
                >
                  {'abcdefghijklmnopqrstuvwxyz0123456789'.split('').map(letter => (
                    <option key={letter} value={letter}>{letter}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={runTest}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Testing...' : 'Run Test'}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Performance Results */}
            {performanceData && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <h4 className="font-medium text-green-800 mb-2">⚡ Performance Results</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <div>Lookup Time: <strong>{performanceData.lookupTime.toFixed(2)}ms</strong></div>
                  {performanceData.runtimeTime > 0 && (
                    <>
                      <div>Runtime Time: <strong>{performanceData.runtimeTime.toFixed(2)}ms</strong></div>
                      <div>Improvement: <strong>{performanceData.improvement}</strong></div>
                    </>
                  )}
                  {performanceData.runtimeTime === 0 && (
                    <div>Status: <strong>Lookup-only mode (production)</strong></div>
                  )}
                </div>
              </div>
            )}

            {/* Results Comparison */}
            {lookupResult && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Lookup Result */}
                <div className="border border-gray-300 rounded p-3 bg-white">
                  <h4 className="font-medium text-gray-900 mb-2">🚀 Lookup Result</h4>
                  <div className="space-y-1 text-xs text-gray-700">
                    <div>Letter: <strong className="text-gray-900">{lookupResult.letter}</strong></div>
                    <div>Bounds: {lookupResult.bounds.left}, {lookupResult.bounds.right}, {lookupResult.bounds.top}, {lookupResult.bounds.bottom}</div>
                    <div>Size: {lookupResult.width} × {lookupResult.height}</div>
                    <div>SVG Length: {lookupResult.svg.length} chars</div>
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 rounded overflow-hidden border border-gray-200">
                    <div 
                      dangerouslySetInnerHTML={{ __html: lookupResult.svg }} 
                      className="w-20 h-20 mx-auto flex items-center justify-center"
                      style={{ 
                        fontSize: '12px',
                        transform: 'scale(0.9)',
                        transformOrigin: 'center'
                      }}
                    />
                  </div>
                </div>

                {/* Runtime Result (if available) */}
                {runtimeResult && (
                  <div className="border border-gray-300 rounded p-3 bg-white">
                    <h4 className="font-medium text-gray-900 mb-2">🔧 Runtime Result</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>Letter: <strong className="text-gray-900">{runtimeResult.letter}</strong></div>
                      <div>Bounds: {runtimeResult.bounds.left}, {runtimeResult.bounds.right}, {runtimeResult.bounds.top}, {runtimeResult.bounds.bottom}</div>
                      <div>Size: {runtimeResult.width} × {runtimeResult.height}</div>
                      <div>SVG Length: {runtimeResult.svg.length} chars</div>
                    </div>
                    <div className="mt-2 p-2 bg-gray-50 rounded overflow-hidden border border-gray-200">
                      <div 
                        dangerouslySetInnerHTML={{ __html: runtimeResult.svg }} 
                        className="w-20 h-20 mx-auto flex items-center justify-center"
                        style={{ 
                          fontSize: '12px',
                          transform: 'scale(0.9)',
                          transformOrigin: 'center'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Status */}
            <div className="text-xs text-gray-700 border-t border-gray-200 pt-3 bg-gray-50 p-3 rounded-md">
              <div>Available Styles: <strong>{stats.availableStyles.join(', ')}</strong></div>
              <div>Fallback Enabled: <strong>{stats.fallbackEnabled ? 'Yes' : 'No'}</strong></div>
              <div>Cache Size: <strong>{stats.cacheSize} items</strong></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 