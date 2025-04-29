import logger from '../logger';
import { FLAGS } from '../flags';

/**
 * Helper for logging state transitions in development mode
 * This helps with debugging state changes in the custom hooks
 */
export function logStateTransition(hookName: string, stateName: string, prevValue: any, newValue: any) {
  if (process.env.NODE_ENV === 'development' || localStorage.getItem('DEBUG_AUTH_STATE') === 'true') {
    console.group(`🔄 State Change: ${hookName} - ${stateName}`);
    console.log('Previous:', prevValue);
    console.log('New:', newValue);
    console.groupEnd();
    
    // Also log to the logger system for more formal logs
    logger.debug(`State transition in ${hookName}: ${stateName}`, {
      prev: prevValue,
      new: newValue
    });
  }
}

/**
 * Helper to track verification state consistency
 * This catches and potentially fixes inconsistencies between verificationEmail and verificationState
 */
export function checkVerificationStateConsistency() {
  const verificationEmail = localStorage.getItem('verificationEmail');
  const verificationState = localStorage.getItem('verificationState');
  
  if (Boolean(verificationEmail) !== Boolean(verificationState)) {
    console.warn('Verification state inconsistency detected!', {
      hasEmail: Boolean(verificationEmail),
      hasState: Boolean(verificationState)
    });
    
    // Auto-fix the inconsistency in development
    if (process.env.NODE_ENV === 'development') {
      if (verificationEmail && !verificationState) {
        // Create missing state
        const newState = {
          email: verificationEmail,
          startTime: Date.now(),
          resumed: false
        };
        localStorage.setItem('verificationState', JSON.stringify(newState));
        console.info('Auto-fixed by creating verification state');
      } else if (!verificationEmail && verificationState) {
        // Extract email from state
        try {
          const parsedState = JSON.parse(verificationState);
          if (parsedState.email) {
            localStorage.setItem('verificationEmail', parsedState.email);
            console.info('Auto-fixed by extracting email from state');
          }
        } catch (e) {
          // Invalid state, remove it
          localStorage.removeItem('verificationState');
          console.info('Auto-fixed by removing invalid state');
        }
      }
    }
  }
  
  return {
    isConsistent: Boolean(verificationEmail) === Boolean(verificationState),
    hasEmail: Boolean(verificationEmail),
    hasState: Boolean(verificationState)
  };
} 