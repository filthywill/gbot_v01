import { useState, useEffect } from 'react';
import { FLAGS } from '../lib/flags';

export function useFeatureFlag(flagName: keyof typeof FLAGS) {
  // Initialize from FLAGS which should already have loaded localStorage values
  const [flagValue, setFlagValue] = useState(FLAGS[flagName]);
  
  // Check localStorage on mount and when flagName changes
  useEffect(() => {
    // Try to get the latest value from localStorage
    const getStoredValue = () => {
      try {
        const storedFlags = localStorage.getItem('APP_FLAGS');
        if (storedFlags) {
          const parsedFlags = JSON.parse(storedFlags);
          if (parsedFlags[flagName] !== undefined) {
            // Only update if different to avoid unnecessary re-renders
            if (parsedFlags[flagName] !== flagValue) {
              setFlagValue(parsedFlags[flagName]);
              // Also update the FLAGS object to keep it in sync
              FLAGS[flagName] = parsedFlags[flagName];
            }
          }
        }
      } catch (error) {
        console.error('Error reading feature flag from localStorage:', error);
      }
    };
    
    // Check on mount
    getStoredValue();
    
    // Listen for storage events (changes from other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'APP_FLAGS') {
        getStoredValue();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [flagName, flagValue]);
  
  // Custom event for cross-component communication
  useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail && e.detail.flagName === flagName) {
        setFlagValue(e.detail.value);
      }
    };
    
    // Using a custom event to notify all instances of the hook when a flag changes
    window.addEventListener('featureFlagChanged', handleCustomEvent as EventListener);
    return () => window.removeEventListener('featureFlagChanged', handleCustomEvent as EventListener);
  }, [flagName]);
  
  // Function to toggle flag
  const toggleFlag = () => {
    const newValue = !flagValue;
    
    // Update local state
    setFlagValue(newValue);
    
    // Update global FLAGS object
    FLAGS[flagName] = newValue;
    
    // Persist to localStorage
    try {
      const currentFlags = { ...FLAGS };
      localStorage.setItem('APP_FLAGS', JSON.stringify(currentFlags));
      
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('featureFlagChanged', { 
        detail: { flagName, value: newValue } 
      }));
    } catch (error) {
      console.error('Error saving feature flag to localStorage:', error);
    }
  };
  
  return [flagValue, toggleFlag] as const;
} 