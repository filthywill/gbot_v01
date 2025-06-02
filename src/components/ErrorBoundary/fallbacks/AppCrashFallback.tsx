import React from 'react';
import { AlertOctagon, RefreshCw, Home, Mail, Download } from 'lucide-react';
import { Button } from '../../ui/button';
import { ErrorReport } from '../../../utils/errorReporting';

interface AppCrashFallbackProps {
  errorReport: ErrorReport;
  resetError?: () => void;
}

export const AppCrashFallback: React.FC<AppCrashFallbackProps> = ({
  errorReport,
  resetError
}) => {
  const { category, severity, recoveryActions } = errorReport;

  const handleRecoveryAction = async (action: () => void | Promise<void>) => {
    try {
      await action();
      if (resetError) {
        resetError();
      }
    } catch (error) {
      console.error('Recovery action failed:', error);
    }
  };

  const downloadErrorReport = () => {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        message: errorReport.error.message,
        stack: errorReport.error.stack,
        name: errorReport.error.name
      },
      context: errorReport.context,
      category: errorReport.category,
      severity: errorReport.severity,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(errorData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Main Error Card */}
        <div className="bg-container rounded-lg border border-red-500/30 p-8 text-center">
          {/* Header */}
          <div className="mb-6">
            <AlertOctagon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-400 mb-2">
              Application Error
            </h1>
            <p className="text-tertiary">
              Something went wrong and the app crashed
            </p>
          </div>

          {/* Error Message */}
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded">
            <p className="text-sm text-red-300 leading-relaxed">
              {severity === 'CRITICAL' 
                ? "A critical error has occurred that prevents the application from functioning properly. Please try reloading the page or clearing your browser data."
                : "An unexpected error occurred. The application should recover after a reload."
              }
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Button
              onClick={() => window.location.reload()}
              className="bg-brand-primary-600 hover:bg-brand-primary-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload App
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>

          {/* Recovery Actions */}
          {recoveryActions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-secondary mb-3">
                Recovery Options
              </h3>
              <div className="space-y-2">
                {recoveryActions.slice(0, 3).map((action) => (
                  <Button
                    key={action.id}
                    onClick={() => handleRecoveryAction(action.action)}
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/20 text-primary hover:bg-primary/10"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Support Actions */}
          <div className="border-t border-primary/10 pt-6">
            <h3 className="text-sm font-medium text-secondary mb-3">
              Need Help?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={downloadErrorReport}
                variant="outline"
                size="sm"
                className="border-primary/20 text-primary hover:bg-primary/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              
              <Button
                onClick={() => {
                  const subject = encodeURIComponent(`Critical App Error: ${errorReport.error.message}`);
                  const body = encodeURIComponent(
                    `Critical error occurred in the graffiti generator.\n\n` +
                    `Error: ${errorReport.error.message}\n` +
                    `Category: ${category}\n` +
                    `Severity: ${severity}\n` +
                    `URL: ${window.location.href}\n` +
                    `Time: ${new Date().toISOString()}\n\n` +
                    `Please investigate this issue.`
                  );
                  window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
                }}
                variant="outline"
                size="sm"
                className="border-primary/20 text-primary hover:bg-primary/10"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 text-center text-xs text-tertiary">
          <p>
            Error ID: {errorReport.context.timestamp}
          </p>
          <p className="mt-1">
            If this problem persists, please contact support with the error ID above.
          </p>
        </div>

        {/* Debug Information */}
        {import.meta.env.DEV && (
          <details className="mt-6 bg-container rounded border border-primary/10 p-4">
            <summary className="cursor-pointer text-sm font-medium text-secondary hover:text-primary">
              Debug Information (Development Mode)
            </summary>
            <div className="mt-4 text-xs space-y-2">
              <div>
                <strong className="text-primary">Error:</strong>
                <pre className="mt-1 p-2 bg-panel rounded text-xs overflow-auto">
                  {errorReport.error.message}
                </pre>
              </div>
              
              <div>
                <strong className="text-primary">Stack Trace:</strong>
                <pre className="mt-1 p-2 bg-panel rounded text-xs overflow-auto max-h-32">
                  {errorReport.error.stack}
                </pre>
              </div>
              
              <div>
                <strong className="text-primary">Context:</strong>
                <pre className="mt-1 p-2 bg-panel rounded text-xs overflow-auto">
                  {JSON.stringify(errorReport.context, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}; 