import { create } from 'zustand';
import { isDevelopment } from '../lib/env';
import { isDebugPanelEnabled } from '../lib/debug';

interface DevStore {
  showValueOverlays: boolean;
  toggleValueOverlays: () => void;
}

export const useDevStore = create<DevStore>((set) => {
  console.log('Creating DevStore:', {
    isDevelopment: isDevelopment(),
    isDebugPanelEnabled: isDebugPanelEnabled()
  });
  
  return {
    showValueOverlays: false,
    toggleValueOverlays: () => {
      // Log when this function is called
      console.log('toggleValueOverlays called:', {
        isDevelopment: isDevelopment(),
        isDebugPanelEnabled: isDebugPanelEnabled(),
        shouldToggle: isDevelopment() && isDebugPanelEnabled()
      });
      
      // Only allow toggling in development mode and when debug panels are enabled
      if (isDevelopment() && isDebugPanelEnabled()) {
        set((state) => {
          console.log('Setting showValueOverlays:', !state.showValueOverlays);
          return { showValueOverlays: !state.showValueOverlays };
        });
      }
    },
  };
}); 