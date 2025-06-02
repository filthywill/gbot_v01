/**
 * Error Reporting and Logging Utility
 * 
 * Provides comprehensive error handling, logging, and recovery suggestions
 * for the graffiti generator application.
 */

import logger from '../lib/logger';

export interface ErrorContext {
  component: string;
  action?: string;
  userId?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  errorInfo: React.ErrorInfo;
  context: ErrorContext;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryActions: RecoveryAction[];
}

export type ErrorCategory = 
  | 'SVG_PROCESSING'
  | 'AUTHENTICATION' 
  | 'NETWORK'
  | 'STATE_MANAGEMENT'
  | 'RENDERING'
  | 'USER_INPUT'
  | 'UNKNOWN';

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RecoveryAction {
  id: string;
  label: string;
  description: string;
  action: () => void | Promise<void>;
  isPrimary?: boolean;
}

/**
 * Categorize error based on stack trace and error message
 */
export const categorizeError = (error: Error): ErrorCategory => {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // SVG Processing errors
  if (message.includes('svg') || 
      message.includes('viewbox') || 
      message.includes('path') ||
      stack.includes('svgutils') ||
      stack.includes('graffitigenerator')) {
    return 'SVG_PROCESSING';
  }

  // Authentication errors
  if (message.includes('auth') ||
      message.includes('login') ||
      message.includes('session') ||
      stack.includes('authstore') ||
      stack.includes('supabase')) {
    return 'AUTHENTICATION';
  }

  // Network errors
  if (message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      error.name === 'NetworkError') {
    return 'NETWORK';
  }

  // State management errors
  if (stack.includes('zustand') ||
      stack.includes('store') ||
      message.includes('state')) {
    return 'STATE_MANAGEMENT';
  }

  // React rendering errors
  if (message.includes('render') ||
      message.includes('component') ||
      stack.includes('react-dom')) {
    return 'RENDERING';
  }

  // User input validation errors
  if (message.includes('invalid input') ||
      message.includes('validation')) {
    return 'USER_INPUT';
  }

  return 'UNKNOWN';
};

/**
 * Determine error severity based on category and error details
 */
export const determineSeverity = (error: Error, category: ErrorCategory): ErrorSeverity => {
  // Critical errors that break core functionality
  if (category === 'STATE_MANAGEMENT' || 
      category === 'AUTHENTICATION' ||
      error.name === 'ChunkLoadError') {
    return 'CRITICAL';
  }

  // High priority errors that affect main features
  if (category === 'SVG_PROCESSING' || 
      category === 'RENDERING') {
    return 'HIGH';
  }

  // Medium priority errors
  if (category === 'NETWORK' || 
      category === 'USER_INPUT') {
    return 'MEDIUM';
  }

  return 'LOW';
};

/**
 * Generate recovery actions based on error category
 */
export const generateRecoveryActions = (
  error: Error, 
  category: ErrorCategory,
  context: ErrorContext
): RecoveryAction[] => {
  const actions: RecoveryAction[] = [];

  switch (category) {
    case 'SVG_PROCESSING':
      actions.push(
        {
          id: 'retry-generation',
          label: 'Try Again',
          description: 'Regenerate the graffiti with current settings',
          action: () => window.location.reload(),
          isPrimary: true
        },
        {
          id: 'reset-to-default',
          label: 'Reset Style',
          description: 'Reset to default style and try again',
          action: () => {
            localStorage.removeItem('graffiti-store');
            window.location.reload();
          }
        }
      );
      break;

    case 'AUTHENTICATION':
      actions.push(
        {
          id: 'retry-auth',
          label: 'Sign In Again',
          description: 'Retry authentication process',
          action: () => {
            localStorage.removeItem('auth-store');
            window.location.reload();
          },
          isPrimary: true
        },
        {
          id: 'continue-guest',
          label: 'Continue as Guest',
          description: 'Use the app without signing in',
          action: () => window.location.reload()
        }
      );
      break;

    case 'NETWORK':
      actions.push(
        {
          id: 'retry-request',
          label: 'Retry',
          description: 'Try the request again',
          action: () => window.location.reload(),
          isPrimary: true
        },
        {
          id: 'check-connection',
          label: 'Check Connection',
          description: 'Verify your internet connection',
          action: () => {
            if (navigator.onLine) {
              alert('Connection appears to be working. Please try again.');
            } else {
              alert('You appear to be offline. Please check your internet connection.');
            }
          }
        }
      );
      break;

    case 'STATE_MANAGEMENT':
      actions.push(
        {
          id: 'reset-app-state',
          label: 'Reset App',
          description: 'Clear all data and restart the application',
          action: () => {
            localStorage.clear();
            window.location.reload();
          },
          isPrimary: true
        }
      );
      break;

    default:
      actions.push(
        {
          id: 'reload-page',
          label: 'Reload Page',
          description: 'Refresh the page to try again',
          action: () => window.location.reload(),
          isPrimary: true
        },
        {
          id: 'report-issue',
          label: 'Report Issue',
          description: 'Let us know about this problem',
          action: () => {
            const subject = encodeURIComponent(`Error Report: ${error.message}`);
            const body = encodeURIComponent(
              `Error: ${error.message}\n\n` +
              `Stack: ${error.stack}\n\n` +
              `Context: ${JSON.stringify(context, null, 2)}`
            );
            window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
          }
        }
      );
  }

  return actions;
};

/**
 * Create error context with current application state
 */
export const createErrorContext = (
  component: string,
  action?: string,
  additionalData?: Record<string, any>
): ErrorContext => {
  return {
    component,
    action,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    additionalData: {
      ...additionalData,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memory: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : undefined
    }
  };
};

/**
 * Main error reporting function
 */
export const reportError = (
  error: Error,
  errorInfo: React.ErrorInfo,
  context: ErrorContext
): ErrorReport => {
  const category = categorizeError(error);
  const severity = determineSeverity(error, category);
  const recoveryActions = generateRecoveryActions(error, category, context);

  const errorReport: ErrorReport = {
    error,
    errorInfo,
    context,
    category,
    severity,
    recoveryActions
  };

  // Log the error
  logger.error('Error boundary caught error', {
    message: error.message,
    stack: error.stack,
    category,
    severity,
    context,
    componentStack: errorInfo.componentStack
  });

  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // TODO: Integrate with error tracking service (e.g., Sentry)
    console.error('Production error:', errorReport);
  }

  return errorReport;
};

/**
 * User-friendly error messages
 */
export const getErrorMessage = (category: ErrorCategory): string => {
  switch (category) {
    case 'SVG_PROCESSING':
      return "We're having trouble generating your graffiti. This might be due to a complex text input or temporary processing issue.";
    
    case 'AUTHENTICATION':
      return "There was a problem with authentication. You can continue using the app as a guest or try signing in again.";
    
    case 'NETWORK':
      return "We're having trouble connecting to our servers. Please check your internet connection and try again.";
    
    case 'STATE_MANAGEMENT':
      return "The application state has become corrupted. Resetting the app should resolve this issue.";
    
    case 'RENDERING':
      return "There was a problem displaying this content. Refreshing the page should fix this.";
    
    case 'USER_INPUT':
      return "There's an issue with the input provided. Please check your text and try again.";
    
    default:
      return "An unexpected error occurred. Refreshing the page usually resolves this issue.";
  }
}; 