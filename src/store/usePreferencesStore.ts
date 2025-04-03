import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import logger from '../lib/logger';

interface PreferencesState {
  rememberMe: boolean;
  lastUsedEmail: string | null;
  
  // Actions
  setRememberMe: (value: boolean) => void;
  setLastUsedEmail: (email: string | null) => void;
  clearPreferences: () => void;
}

const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      rememberMe: false,
      lastUsedEmail: null,

      setRememberMe: (value) => {
        logger.debug('Setting remember me preference:', value);
        set({ rememberMe: value });
      },

      setLastUsedEmail: (email) => {
        logger.debug('Setting last used email:', email);
        set({ lastUsedEmail: email });
      },

      clearPreferences: () => {
        logger.debug('Clearing all preferences');
        set({ rememberMe: false, lastUsedEmail: null });
      }
    }),
    {
      name: 'gbot-preferences',
      partialize: (state) => ({
        rememberMe: state.rememberMe,
        lastUsedEmail: state.lastUsedEmail
      })
    }
  )
);

export default usePreferencesStore; 