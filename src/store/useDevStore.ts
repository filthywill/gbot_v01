import { create } from 'zustand';

interface DevStore {
  showValueOverlays: boolean;
  toggleValueOverlays: () => void;
}

export const useDevStore = create<DevStore>((set) => ({
  showValueOverlays: true,
  toggleValueOverlays: () => set((state) => ({ showValueOverlays: !state.showValueOverlays })),
})); 