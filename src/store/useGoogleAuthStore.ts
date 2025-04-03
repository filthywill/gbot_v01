import { create } from 'zustand';
import logger from '../lib/logger';

interface GoogleAuthState {
  isSDKLoaded: boolean;
  isSDKLoading: boolean;
  sdkError: string | null;
  initializationAttempted: boolean;
  initializeSDK: () => Promise<boolean>;
  resetError: () => void;
  resetState: () => void;
}

const useGoogleAuthStore = create<GoogleAuthState>((set, get) => ({
  isSDKLoaded: false,
  isSDKLoading: false,
  sdkError: null,
  initializationAttempted: false,

  initializeSDK: async () => {
    // Skip if SDK is already loaded or is currently loading
    if (get().isSDKLoaded || get().isSDKLoading || get().initializationAttempted) {
      return get().isSDKLoaded;
    }

    set({ isSDKLoading: true, initializationAttempted: true });
    
    try {
      logger.info('Initializing Google SDK globally');
      
      // Check if SDK script is already in the document
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        logger.debug('Google SDK script already exists in DOM');
        set({ isSDKLoaded: true, isSDKLoading: false });
        return true;
      }
      
      // Check if we're in a secure context (HTTPS)
      const protocol = window.location.protocol;
      const isSecureContext = window.isSecureContext;
      
      logger.debug(`Protocol: ${protocol}, Secure Context: ${isSecureContext}`);
      
      // Don't load SDK in insecure contexts
      if (!isSecureContext) {
        logger.info('Cannot load Google SDK in insecure context');
        set({ 
          isSDKLoaded: false, 
          isSDKLoading: false,
          sdkError: 'Cannot load Google SDK in insecure context'
        });
        return false;
      }
      
      // Create and append the script
      return new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        script.onerror = () => {
          logger.error('Failed to load Google SDK script');
          set({ 
            isSDKLoaded: false, 
            isSDKLoading: false,
            sdkError: 'Failed to load Google authentication'
          });
          resolve(false);
        };
        
        script.onload = () => {
          logger.info('Google SDK loaded successfully');
          
          // Verify Google object exists
          if (window.google?.accounts?.id) {
            set({ isSDKLoaded: true, isSDKLoading: false });
            resolve(true);
          } else {
            logger.error('Google SDK script loaded but google.accounts.id is undefined');
            set({ 
              isSDKLoaded: false, 
              isSDKLoading: false,
              sdkError: 'Google authentication unavailable'
            });
            resolve(false);
          }
        };
        
        document.body.appendChild(script);
      });
    } catch (error) {
      logger.error('Error initializing Google SDK:', error);
      set({ 
        isSDKLoaded: false, 
        isSDKLoading: false,
        sdkError: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return false;
    }
  },
  
  resetError: () => set({ sdkError: null }),
  
  // Reset the entire state - useful for testing or recovery
  resetState: () => set({
    isSDKLoaded: false,
    isSDKLoading: false,
    sdkError: null,
    initializationAttempted: false
  })
}));

export default useGoogleAuthStore; 