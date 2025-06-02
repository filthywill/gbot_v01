// Error Boundary Components
export { AppErrorBoundary, withAppErrorBoundary } from './AppErrorBoundary';
export { AuthErrorBoundary, withAuthErrorBoundary } from './AuthErrorBoundary';
export { GraffitiErrorBoundary, withGraffitiErrorBoundary } from './GraffitiErrorBoundary';

// Fallback Components
export { AppCrashFallback } from './fallbacks/AppCrashFallback';
export { AuthErrorFallback } from './fallbacks/AuthErrorFallback';
export { GraffitiErrorFallback } from './fallbacks/GraffitiErrorFallback';

// Test Components
export { ErrorTestComponent, ErrorTestContent } from './ErrorTestComponent';

// Error Reporting Utilities
export {
  reportError,
  createErrorContext,
  categorizeError,
  determineSeverity,
  generateRecoveryActions,
  getErrorMessage,
  type ErrorReport,
  type ErrorContext,
  type ErrorCategory,
  type ErrorSeverity,
  type RecoveryAction
} from '../../utils/errorReporting'; 