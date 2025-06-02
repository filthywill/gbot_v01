/**
 * Development Tools Panel
 * 
 * Provides debugging tools and development panels for the graffiti generator.
 * Only available in development mode.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useDevStore } from '../../store/useDevStore';

// Lazy load development components to reduce production bundle size
const DevColorPanel = React.lazy(() => import('../ui/dev-color-panel').then(m => ({ default: m.DevColorPanel })));
const DevValueDisplay = React.lazy(() => import('../ui/dev-value-display').then(m => ({ default: m.DevValueDisplay })));
const OverlapDebugPanel = React.lazy(() => import('../OverlapDebugPanel').then(m => ({ default: m.OverlapDebugPanel })));
const SvgProcessingPanel = React.lazy(() => import('../dev/SvgProcessingPanel').then(m => ({ default: m.SvgProcessingPanel })));
const LookupIntegrationTest = React.lazy(() => import('../dev/LookupIntegrationTest').then(m => ({ default: m.LookupIntegrationTest })));
const LookupPerformanceTest = React.lazy(() => import('../dev/LookupPerformanceTest').then(m => ({ default: m.LookupPerformanceTest })));
const ErrorTestContent = React.lazy(() => import('../ErrorBoundary/ErrorTestComponent').then(m => ({ default: m.ErrorTestContent })));

interface AppDevToolsProps {
  // Development state flags
  isDev: boolean;
  showValueOverlays: boolean;
  showColorPanel: boolean;
  
  // Event handlers
  toggleValueOverlays: () => void;
  toggleColorPanel: () => void;
}

// Development loading fallback component
const DevLoadingFallback: React.FC<{ componentName: string }> = ({ componentName }) => (
  <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm text-gray-600">Loading {componentName}...</span>
    </div>
  </div>
);

export function AppDevTools({
  isDev,
  showValueOverlays,
  showColorPanel,
  toggleValueOverlays,
  toggleColorPanel
}: AppDevToolsProps) {
  // Get dev store state
  const { 
    showErrorBoundaryTests, 
    isDevToolsCollapsed,
    toggleErrorBoundaryTests,
    toggleDevToolsCollapsed
  } = useDevStore();

  // Panel visibility states
  const [showOverlapDebug, setShowOverlapDebug] = useState(false);
  const [showSvgProcessing, setShowSvgProcessing] = useState(false);
  const [showLookupIntegration, setShowLookupIntegration] = useState(false);
  const [showLookupPerformance, setShowLookupPerformance] = useState(false);

  // Don't render anything in production
  if (!isDev) {
    return null;
  }

  // Panel control functions
  const toggleOverlapDebug = () => setShowOverlapDebug(!showOverlapDebug);
  const toggleSvgProcessing = () => setShowSvgProcessing(!showSvgProcessing);
  const toggleLookupIntegration = () => setShowLookupIntegration(!showLookupIntegration);
  const toggleLookupPerformance = () => setShowLookupPerformance(!showLookupPerformance);

  const closeAllPanels = () => {
    setShowOverlapDebug(false);
    setShowSvgProcessing(false);
    setShowLookupIntegration(false);
    setShowLookupPerformance(false);
    if (showValueOverlays) toggleValueOverlays();
    if (showColorPanel) toggleColorPanel();
    if (showErrorBoundaryTests) toggleErrorBoundaryTests();
  };

  // Escape key handler to close panels
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close all panels on escape
        if (showOverlapDebug || showSvgProcessing || showLookupIntegration || 
            showLookupPerformance || showValueOverlays || showColorPanel || showErrorBoundaryTests) {
          closeAllPanels();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showOverlapDebug, showSvgProcessing, showLookupIntegration, 
      showLookupPerformance, showValueOverlays, showColorPanel, showErrorBoundaryTests]);

  return (
    <>
      {/* Control Panel - Top Left */}
      <div className="fixed top-4 left-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[60] w-60">
        {/* Header with collapse toggle */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="text-xs font-medium text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            DEV TOOLS
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleDevToolsCollapsed}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            {isDevToolsCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
        </div>
        
        {/* Collapsible content */}
        {!isDevToolsCollapsed && (
          <div className="p-3 space-y-2">
            {/* UI State Controls */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-300 mb-1">UI STATE</p>
              <Button
                size="sm"
                variant={showValueOverlays ? "default" : "outline"}
                onClick={toggleValueOverlays}
                className="w-full h-7 text-xs"
              >
                Value Overlays
              </Button>
              <Button
                size="sm"
                variant={showColorPanel ? "default" : "outline"}
                onClick={toggleColorPanel}
                className="w-full h-7 text-xs"
              >
                Color Panel
              </Button>
            </div>

            {/* SVG Analysis Controls */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-300 mb-1">SVG ANALYSIS</p>
              <Button
                size="sm"
                variant={showOverlapDebug ? "default" : "outline"}
                onClick={toggleOverlapDebug}
                className="w-full h-7 text-xs"
              >
                Overlap Debug
              </Button>
              <Button
                size="sm"
                variant={showSvgProcessing ? "default" : "outline"}
                onClick={toggleSvgProcessing}
                className="w-full h-7 text-xs"
              >
                SVG Processing
              </Button>
            </div>

            {/* Performance Tests */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-300 mb-1">PERFORMANCE</p>
              <Button
                size="sm"
                variant={showLookupIntegration ? "default" : "outline"}
                onClick={toggleLookupIntegration}
                className="w-full h-7 text-xs"
              >
                Lookup Integration
              </Button>
              <Button
                size="sm"
                variant={showLookupPerformance ? "default" : "outline"}
                onClick={toggleLookupPerformance}
                className="w-full h-7 text-xs"
              >
                Lookup Performance
              </Button>
            </div>

            {/* Error Testing */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-300 mb-1">ERROR TESTING</p>
              <Button
                size="sm"
                variant={showErrorBoundaryTests ? "default" : "outline"}
                onClick={toggleErrorBoundaryTests}
                className="w-full h-7 text-xs"
              >
                Error Boundaries
              </Button>
            </div>

            {/* Close All */}
            <Button
              size="sm"
              variant="destructive"
              onClick={closeAllPanels}
              className="w-full h-7 text-xs mt-3"
            >
              Close All Panels
            </Button>
          </div>
        )}
      </div>

      {/* Values Panel - Top Left, below control panel */}
      {showValueOverlays && (
        <div className="fixed top-20 left-4 z-50">
          <React.Suspense fallback={<DevLoadingFallback componentName="Value Display" />}>
            <DevValueDisplay value={42} displayValue={42} />
          </React.Suspense>
        </div>
      )}

      {/* Safe Error Tests Panel - Bottom Right */}
      {showErrorBoundaryTests && (
        <div className="fixed bottom-4 right-4 bg-container border border-primary/20 rounded-lg p-4 shadow-lg z-50 max-w-xs">
          <h3 className="text-sm font-medium text-primary mb-3">
            Safe Error Tests
          </h3>
          <React.Suspense fallback={<DevLoadingFallback componentName="Error Tests" />}>
            <ErrorTestContent />
          </React.Suspense>
        </div>
      )}

      {/* Color Panel - Full Screen Overlay */}
      {showColorPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <React.Suspense fallback={<DevLoadingFallback componentName="Color Panel" />}>
              <DevColorPanel />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Advanced Panels - Floating Development Tools */}
      {showOverlapDebug && (
        <React.Suspense fallback={<DevLoadingFallback componentName="Overlap Debug Panel" />}>
          <OverlapDebugPanel />
        </React.Suspense>
      )}

      {showSvgProcessing && (
        <React.Suspense fallback={<DevLoadingFallback componentName="SVG Processing Panel" />}>
          <SvgProcessingPanel />
        </React.Suspense>
      )}

      {showLookupIntegration && (
        <React.Suspense fallback={<DevLoadingFallback componentName="Lookup Integration Test" />}>
          <LookupIntegrationTest />
        </React.Suspense>
      )}

      {showLookupPerformance && (
        <React.Suspense fallback={<DevLoadingFallback componentName="Lookup Performance Test" />}>
          <LookupPerformanceTest />
        </React.Suspense>
      )}
    </>
  );
} 