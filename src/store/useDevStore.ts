import { create } from 'zustand';
import { isDevelopment } from '../lib/env';
import { isDebugPanelEnabled } from '../lib/debug';

interface DevStore {
  showValueOverlays: boolean;
  toggleValueOverlays: () => void;
}

export const useDevStore = create<DevStore>((set) => ({
  showValueOverlays: false,
  toggleValueOverlays: () => {
    // Only allow toggling in development mode and when debug panels are enabled
    if (isDevelopment() && isDebugPanelEnabled()) {
      set((state) => ({ showValueOverlays: !state.showValueOverlays }));
    }
  },
})); 