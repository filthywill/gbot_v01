/**
 * Auth configuration settings for timeouts and delays
 * Values are optimized for different environments and tab switching scenarios
 */
export const AUTH_CONFIG = {
  // Delays for state transitions (longer in production for stability)
  stateTransitionDelay: import.meta.env.PROD ? 300 : 200,
  
  // Retry intervals for init and token operations
  retryDelay: import.meta.env.PROD ? 6000 : 4000,
  tokenExchangeRetryDelay: 1500,
  
  // Timeout for user fetch operations
  userFetchTimeout: 8000,
  
  // Maximum number of retries for various operations
  maxInitRetries: 3,
  maxTokenExchangeRetries: 3,
  maxUserFetchRetries: 3,
  
  // Session duration settings
  sessionDuration: 60 * 60 * 24 * 7, // 7 days in seconds
};

export default AUTH_CONFIG; 