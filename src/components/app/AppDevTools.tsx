import React from 'react';
import { cn } from '../../lib/utils';
import { OverlapDebugPanel } from '../OverlapDebugPanel';
import { SvgProcessingPanel } from '../dev/SvgProcessingPanel';
import { LookupIntegrationTest } from '../dev/LookupIntegrationTest';
import { LookupPerformanceTest } from '../dev/LookupPerformanceTest';
import { DevColorPanel } from '../ui/dev-color-panel';
import { isDebugPanelEnabled } from '../../lib/debug';

/**
 * Interface for the AppDevTools component props
 */
interface AppDevToolsProps {
  // Development state flags
  isDev: boolean;
  showValueOverlays: boolean;
  showColorPanel: boolean;
  
  // Event handlers
  toggleValueOverlays: () => void;
  toggleColorPanel: () => void;
}

/**
 * AppDevTools component that contains developer tools
 * Extracted from App.tsx for better component separation
 * Only renders in development mode
 */
export function AppDevTools({
  isDev,
  showValueOverlays,
  showColorPanel,
  toggleValueOverlays,
  toggleColorPanel
}: AppDevToolsProps) {
  // Return null if not in development mode
  if (!isDev) {
    return null;
  }
  
  return (
    <>
      {/* Debug panels - conditional on debug panel enabled */}
      {isDebugPanelEnabled() && <OverlapDebugPanel />}
      {isDebugPanelEnabled() && <SvgProcessingPanel />}
      
      {/* Lookup test panels - always available in dev mode but self-contained */}
      <LookupIntegrationTest />
      <LookupPerformanceTest />
      
      {/* Color panel (toggled by debug button) */}
      {showColorPanel && <DevColorPanel />}
      
      {/* Dev Mode Buttons - only visible when debug panels are enabled */}
      {isDebugPanelEnabled() && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] flex gap-2 opacity-[0.25]">
          <button
            onClick={toggleValueOverlays}
            className={cn(
              "px-2 py-1 text-xs rounded border",
              showValueOverlays
                ? "bg-pink-700 border-pink-500 text-white"
                : "bg-panel border-app text-secondary"
            )}
          >
            {showValueOverlays ? 'Hide Values' : 'Show Values'}
          </button>
          <button
            onClick={toggleColorPanel}
            className={cn(
              "px-2 py-1 text-xs rounded border",
              showColorPanel
                ? "bg-pink-700 border-pink-500 text-white"
                : "bg-panel border-app text-secondary"
            )}
          >
            {showColorPanel ? 'Hide Colors' : 'Edit Colors'}
          </button>
        </div>
      )}
    </>
  );
}

export default AppDevTools; 