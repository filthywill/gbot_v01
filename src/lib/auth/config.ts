/**
 * Auth configuration settings for timeouts and delays
 * Values are optimized for different environments
 */
export const AUTH_CONFIG = {
  // Delays for state transitions (longer in production for stability)
  stateTransitionDelay: import.meta.env.PROD ? 200 : 100,
  
  // Retry intervals for init and token operations
  retryDelay: import.meta.env.PROD ? 5000 : 3000,
  tokenExchangeRetryDelay: 1000,
  
  // Timeout for user fetch operations
  userFetchTimeout: 4000,
  
  // Maximum number of retries for various operations
  maxInitRetries: 2,
  maxTokenExchangeRetries: 2,
  maxUserFetchRetries: 2,
  
  // Session duration settings
  sessionDuration: 60 * 60 * 24 * 7, // 7 days in seconds
};

export default AUTH_CONFIG; 