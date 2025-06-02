import React from 'react';
import { Shield, RefreshCw, UserX, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { ErrorReport } from '../../../utils/errorReporting';

interface AuthErrorFallbackProps {
  errorReport: ErrorReport;
  resetError?: () => void;
}

export const AuthErrorFallback: React.FC<AuthErrorFallbackProps> = ({
  errorReport,
  resetError
}) => {
  const { category, severity, recoveryActions } = errorReport;

  const getSeverityColor = () => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'HIGH':
        return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      default:
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
    }
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-sm w-full rounded-lg border p-6 bg-container ${getSeverityColor()}`}>
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-current" />
          <div>
            <h3 className="text-lg font-semibold text-current">
              Authentication Error
            </h3>
            <p className="text-sm opacity-80">
              Sign-in process encountered an issue
            </p>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-6">
          <p className="text-sm text-current opacity-90 leading-relaxed">
            There was a problem with authentication. You can continue using the app as a guest or try signing in again.
          </p>
        </div>

        {/* Recovery Actions */}
        <div className="space-y-3">
          {recoveryActions.map((action, index) => {
            const isPrimary = action.isPrimary || index === 0;
            
            return (
              <div key={action.id}>
                <Button
                  onClick={() => handleRecoveryAction(action.action)}
                  variant={isPrimary ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-start ${
                    isPrimary 
                      ? 'bg-brand-primary-600 hover:bg-brand-primary-700 text-white' 
                      : 'border-current/20 text-current hover:bg-current/10'
                  }`}
                >
                  {action.id === 'retry-auth' && <RefreshCw className="w-4 h-4 mr-2" />}
                  {action.id === 'continue-guest' && <UserX className="w-4 h-4 mr-2" />}
                  
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs opacity-75">{action.description}</div>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-400">
              <p className="font-medium mb-1">Your data is safe</p>
              <p>No personal information was compromised. This is a temporary authentication issue.</p>
            </div>
          </div>
        </div>

        {/* Additional Info for Development */}
        {import.meta.env.DEV && (
          <details className="mt-6 text-xs">
            <summary className="cursor-pointer text-current opacity-75 hover:opacity-100">
              Debug Information (Dev Mode)
            </summary>
            <div className="mt-2 p-3 bg-black/20 rounded border border-current/10">
              <p><strong>Error:</strong> {errorReport.error.message}</p>
              <p><strong>Component:</strong> {errorReport.context.component}</p>
              <p><strong>Category:</strong> {category}</p>
              <p><strong>Severity:</strong> {severity}</p>
              {errorReport.context.action && (
                <p><strong>Action:</strong> {errorReport.context.action}</p>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}; 