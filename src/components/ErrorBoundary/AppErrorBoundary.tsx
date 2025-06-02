import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportError, createErrorContext, ErrorReport } from '../../utils/errorReporting';
import { AppCrashFallback } from './fallbacks/AppCrashFallback';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  errorReport: ErrorReport | null;
}

/**
 * Top-level error boundary for the entire application
 * Handles critical errors that would otherwise crash the app
 */
export class AppErrorBoundary extends Component<Props, State> {
  private errorCount: number = 0;
  private lastErrorTime: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorReport: null 
    };

    // Global error handlers
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers = () => {
    // Handle unhandled Promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Handle global JavaScript errors
    window.addEventListener('error', this.handleGlobalError);
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled Promise rejection:', event.reason);
    
    // Create synthetic error for unhandled promise rejections
    const error = new Error(`Unhandled Promise rejection: ${event.reason}`);
    error.name = 'UnhandledPromiseRejection';
    
    const context = createErrorContext(
      'Application',
      'Promise Rejection',
      {
        reason: event.reason,
        promiseRejection: true
      }
    );

    const errorReport = reportError(error, { componentStack: '' }, context);
    
    // For critical promise rejections, trigger error boundary
    if (errorReport.severity === 'CRITICAL') {
      this.setState({ 
        hasError: true, 
        errorReport 
      });
    }
  };

  private handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error:', event.error);
    
    // Don't handle errors that are already handled by React error boundaries
    if (event.error && event.error._reactErrorBoundaryHandled) {
      return;
    }

    const context = createErrorContext(
      'Application',
      'Global Error',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        globalError: true
      }
    );

    const errorReport = reportError(event.error || new Error(event.message), { componentStack: '' }, context);
    
    // Only trigger for critical global errors
    if (errorReport.severity === 'CRITICAL') {
      this.setState({ 
        hasError: true, 
        errorReport 
      });
    }
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error frequency to detect error loops
    const currentTime = Date.now();
    if (currentTime - this.lastErrorTime < 5000) { // 5 seconds
      this.errorCount++;
    } else {
      this.errorCount = 1;
    }
    this.lastErrorTime = currentTime;

    // Mark error as handled by React error boundary
    (error as any)._reactErrorBoundaryHandled = true;

    // Create error context with app-level information
    const context = createErrorContext(
      'Application',
      'Component Error',
      {
        errorCount: this.errorCount,
        isErrorLoop: this.errorCount > 3,
        buildInfo: this.getBuildInfo(),
        performanceInfo: this.getPerformanceInfo()
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

    // Handle error loops
    if (this.errorCount > 3) {
      console.error('Error loop detected! Clearing application state.');
      this.clearApplicationState();
    }
  }

  private getBuildInfo = () => {
    return {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      baseUrl: import.meta.env.BASE_URL
    };
  };

  private getPerformanceInfo = () => {
    const memory = (performance as any).memory;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      memory: memory ? {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      timing: navigation ? {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart)
      } : null,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink
      } : null
    };
  };

  private clearApplicationState = () => {
    try {
      // Clear localStorage except for essential items
      const essentialKeys = ['theme-preference', 'user-preferences'];
      const storage = { ...localStorage };
      
      localStorage.clear();
      
      // Restore essential items
      essentialKeys.forEach(key => {
        if (storage[key]) {
          localStorage.setItem(key, storage[key]);
        }
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear any cached data
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    } catch (error) {
      console.error('Failed to clear application state:', error);
    }
  };

  private resetError = () => {
    this.errorCount = 0;
    this.setState({ 
      hasError: false, 
      errorReport: null 
    });
  };

  componentWillUnmount() {
    // Clean up global error handlers
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  render() {
    if (this.state.hasError && this.state.errorReport) {
      return (
        <AppCrashFallback 
          errorReport={this.state.errorReport}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withAppErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <AppErrorBoundary>
      <Component {...props} />
    </AppErrorBoundary>
  );

  WrappedComponent.displayName = `withAppErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}; 