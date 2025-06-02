import React, { Component, ReactNode, ErrorInfo } from 'react';
import { reportError, createErrorContext, ErrorReport } from '../../utils/errorReporting';
import { GraffitiErrorFallback } from '../GraffitiDisplay/GraffitiErrorFallback';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  errorReport: ErrorReport | null;
  inputText?: string;
}

/**
 * Error boundary specifically for graffiti generation and display
 * Provides graceful degradation by showing CSS text fallback instead of error screens
 */
export class GraffitiErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorReport: null,
      inputText: undefined
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context = createErrorContext(
      'GraffitiErrorBoundary',
      'svg_processing',
      {
        inputText: this.getInputTextFromError(error),
        selectedStyle: this.getSelectedStyleFromError(error),
        processingStage: this.getProcessingStageFromError(error)
      }
    );

    const errorReport = reportError(error, errorInfo, context);
    
    this.setState({ 
      errorReport,
      inputText: this.getInputTextFromError(error)
    });

    // Call external error handler
    this.props.onError?.(error, errorInfo);

    // Auto-recovery for non-critical errors
    this.attemptAutoRecovery(errorReport);
  }

  private getInputTextFromError = (error: Error): string | undefined => {
    // Try to extract input text from error context or stack
    const stack = error.stack || '';
    const match = stack.match(/input.*?["']([^"']+)["']/i);
    return match ? match[1] : undefined;
  };

  private getSelectedStyleFromError = (error: Error): string | undefined => {
    // Try to extract style from error context
    const stack = error.stack || '';
    const match = stack.match(/style.*?["']([^"']+)["']/i);
    return match ? match[1] : undefined;
  };

  private getProcessingStageFromError = (error: Error): string | undefined => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('fetch') || stack.includes('fetch')) return 'svg_loading';
    if (message.includes('parse') || stack.includes('parse')) return 'svg_parsing';
    if (message.includes('process') || stack.includes('process')) return 'svg_processing';
    if (message.includes('render') || stack.includes('render')) return 'svg_rendering';
    if (message.includes('position') || stack.includes('position')) return 'layout_calculation';
    
    return 'unknown';
  };

  private attemptAutoRecovery = (errorReport: ErrorReport) => {
    // For non-critical SVG errors, attempt auto-recovery after a delay
    if (errorReport.severity !== 'CRITICAL' && errorReport.category === 'SVG_PROCESSING') {
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetError();
      }, 8000); // Auto-recovery after 8 seconds
    }
  };

  private resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.setState({ 
      hasError: false, 
      errorReport: null,
      inputText: undefined
    });
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Graceful degradation: Show CSS text fallback instead of error screen
      return (
        <GraffitiErrorFallback 
          inputText={this.state.inputText}
          error={this.state.errorReport?.error}
          onRetry={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with graffiti error boundary
export const withGraffitiErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <GraffitiErrorBoundary>
      <Component {...props} />
    </GraffitiErrorBoundary>
  );
  
  WrappedComponent.displayName = `withGraffitiErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}; 