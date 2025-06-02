import { create } from 'zustand';
import { isDevelopment } from '../lib/env';
import { isDebugPanelEnabled } from '../lib/debug';

interface DevStore {
  // Panel visibility
  showValueOverlays: boolean;
  showColorPanel: boolean;
  showErrorBoundaryTests: boolean;
  
  // Dev tools panel state
  isDevToolsCollapsed: boolean;
  
  // Toggle functions
  toggleValueOverlays: () => void;
  toggleColorPanel: () => void;
  toggleErrorBoundaryTests: () => void;
  toggleDevToolsCollapsed: () => void;
}

export const useDevStore = create<DevStore>((set) => ({
  // Initial state
  showValueOverlays: false,
  showColorPanel: false,
  showErrorBoundaryTests: false,
  isDevToolsCollapsed: false,
  
  toggleValueOverlays: () => {
    // Only allow toggling in development mode and when debug panels are enabled
    if (isDevelopment() && isDebugPanelEnabled()) {
      set((state) => ({ showValueOverlays: !state.showValueOverlays }));
    }
  },
  
  toggleColorPanel: () => {
    // Only allow toggling in development mode
    if (isDevelopment()) {
      set((state) => ({ showColorPanel: !state.showColorPanel }));
    }
  },
  
  toggleErrorBoundaryTests: () => {
    // Only allow toggling in development mode
    if (isDevelopment()) {
      set((state) => ({ showErrorBoundaryTests: !state.showErrorBoundaryTests }));
    }
  },
  
  toggleDevToolsCollapsed: () => {
    // Only allow toggling in development mode
    if (isDevelopment()) {
      set((state) => ({ isDevToolsCollapsed: !state.isDevToolsCollapsed }));
    }
  },
})); 