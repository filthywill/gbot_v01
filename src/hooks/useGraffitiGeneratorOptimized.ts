import { useTransition, startTransition } from 'react';
import { useGraffitiStore } from '../store/useGraffitiStore';
import { useGraffitiGeneratorWithZustand } from './useGraffitiGeneratorWithZustand';

/**
 * Optimized Graffiti Generator Hook with React 18 Concurrent Features
 * 
 * Phase 4.1: Enhanced with useTransition for non-blocking SVG generation
 * - Uses React 18's useTransition to mark SVG generation as non-urgent
 * - Keeps UI responsive during heavy processing
 * - Provides isPending state to show loading indicators
 * - History operations remain synchronous for data integrity
 */
export const useGraffitiGenerator = () => {
  // React 18 concurrent features
  const [isPending, startTransition] = useTransition();
  
  // Get the base functionality from the original hook
  const originalHook = useGraffitiGeneratorWithZustand();
  
  // Get store state for customization
  const { customizationOptions, setCustomizationOptions } = useGraffitiStore();
  
  // Enhanced generate function with concurrent features
  const generateGraffiti = async (text: string) => {
    // Wrap the expensive SVG generation in a transition
    startTransition(() => {
      // Use the original hook's generate function
      originalHook.generateGraffiti(text);
    });
  };
  
  // Enhanced customization change handler with transitions
  const handleCustomizationChange = (changes: Partial<typeof customizationOptions>) => {
    // History operations should remain synchronous for data integrity
    if ('historyAction' in changes) {
      // Handle history operations immediately without transition
      setCustomizationOptions(changes);
    } else {
      // Wrap non-critical customization updates in transitions
      startTransition(() => {
        setCustomizationOptions(changes);
      });
    }
  };
  
  return {
    // State from original hook
    ...originalHook,
    
    // Enhanced functions with concurrent features
    generateGraffiti,
    handleCustomizationChange,
    
    // New concurrent state
    isPending, // Shows when transitions are in progress
    
    // Pass through customization state
    customizationOptions
  };
}; 