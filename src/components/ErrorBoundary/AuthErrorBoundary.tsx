import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportError, createErrorContext, ErrorReport } from '../../utils/errorReporting';
import { AuthErrorFallback } from './fallbacks/AuthErrorFallback';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallbackMode?: 'modal' | 'inline';
}

interface State {
  hasError: boolean;
  errorReport: ErrorReport | null;
}

/**
 * Error boundary specifically for authentication components
 * Handles auth errors and provides recovery options
 */
export class AuthErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorReport: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Create error context with auth-specific information
    const context = createErrorContext(
      'Authentication',
      'Auth Flow',
      {
        authStage: this.getAuthStageFromError(error),
        isSessionError: this.isSessionError(error),
        isNetworkError: this.isNetworkError(error),
        isSupabaseError: this.isSupabaseError(error)
      }
    );

    // Generate error report
    const errorReport = reportError(error, errorInfo, context);
    
    // Update state with error report
    this.setState({ errorReport });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Handle specific auth error scenarios
    this.handleAuthErrorScenario(errorReport);
  }

  private getAuthStageFromError = (error: Error): string => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('sign in') || stack.includes('signin')) return 'sign_in';
    if (message.includes('sign up') || stack.includes('signup')) return 'sign_up';
    if (message.includes('password') || stack.includes('password')) return 'password_reset';
    if (message.includes('verification') || stack.includes('verification')) return 'email_verification';
    if (message.includes('session') || stack.includes('session')) return 'session_management';
    if (message.includes('token') || stack.includes('token')) return 'token_handling';
    
    return 'unknown';
  };

  private isSessionError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('session') || 
           message.includes('token') || 
           message.includes('expired') ||
           message.includes('unauthorized');
  };

  private isNetworkError = (error: Error): boolean => {
    return error.name === 'NetworkError' ||
           error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('timeout');
  };

  private isSupabaseError = (error: Error): boolean => {
    const stack = error.stack?.toLowerCase() || '';
    return stack.includes('supabase') || 
           error.message.includes('supabase') ||
           error.message.includes('postgrest');
  };

  private handleAuthErrorScenario = (errorReport: ErrorReport) => {
    const { error, context } = errorReport;
    const additionalData = context.additionalData as any;

    // Handle session expiration
    if (additionalData?.isSessionError) {
      // Clear potentially corrupted session data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
    }

    // Handle network errors with retry
    if (additionalData?.isNetworkError && errorReport.severity !== 'CRITICAL') {
      this.scheduleRetry();
    }

    // Handle Supabase-specific errors
    if (additionalData?.isSupabaseError) {
      console.warn('Supabase error detected:', error.message);
      // Could trigger fallback to guest mode or alternative auth
    }
  };

  private scheduleRetry = () => {
    // Auto-retry for network errors after a delay
    this.retryTimeoutId = window.setTimeout(() => {
      this.resetError();
    }, 5000); // Retry after 5 seconds
  };

  private resetError = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    
    this.setState({ 
      hasError: false, 
      errorReport: null 
    });
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError && this.state.errorReport) {
      return (
        <AuthErrorFallback 
          errorReport={this.state.errorReport}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withAuthErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <AuthErrorBoundary>
      <Component {...props} />
    </AuthErrorBoundary>
  );

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}; 