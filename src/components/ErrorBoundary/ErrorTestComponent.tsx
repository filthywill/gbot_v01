import React, { useState } from 'react';
import { Button } from '../ui/button';

/**
 * Error Test Content - SIMPLIFIED VERSION
 * Safer tests that don't crash the entire app
 */
export const ErrorTestContent: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev.slice(-2), result]); // Keep last 3 results
  };

  const testConsoleError = () => {
    console.error('Test console error - Error logging working');
    addResult('Console error logged ✓');
  };

  const testConsoleWarning = () => {
    console.warn('Test console warning - Warning logging working');
    addResult('Console warning logged ✓');
  };

  const testPromiseRejection = () => {
    Promise.reject('Test promise rejection').catch(() => {
      addResult('Promise rejection handled ✓');
    });
  };

  const testNetworkSimulation = () => {
    // Simulate network error without actually breaking anything
    console.error('Simulated network error: Connection timeout');
    addResult('Network error simulated ✓');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-tertiary mb-2">
        Safe error logging tests (no crashes)
      </p>
      
      <div className="grid grid-cols-2 gap-1">
        <Button
          onClick={testConsoleError}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Console Error
        </Button>
        
        <Button
          onClick={testConsoleWarning}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Console Warning
        </Button>
        
        <Button
          onClick={testPromiseRejection}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Promise Test
        </Button>
        
        <Button
          onClick={testNetworkSimulation}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Network Test
        </Button>
      </div>
      
      {testResults.length > 0 && (
        <div className="mt-2 p-2 bg-panel rounded text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-secondary">Test Results:</span>
            <Button 
              onClick={clearResults} 
              variant="ghost" 
              size="sm" 
              className="text-xs h-4 px-1"
            >
              Clear
            </Button>
          </div>
          {testResults.map((result, i) => (
            <div key={i} className="text-green-400">{result}</div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Test component for validating error boundaries in development
 * Only visible in development mode (legacy standalone version)
 */
export const ErrorTestComponent: React.FC = () => {
  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-container border border-primary/20 rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-sm font-medium text-primary mb-3">
        Safe Error Tests (Dev Only)
      </h3>
      
      <ErrorTestContent />
    </div>
  );
}; 