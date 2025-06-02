import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Mail } from 'lucide-react';
import { Button } from '../../ui/button';
import { ErrorReport } from '../../../utils/errorReporting';

interface GraffitiErrorFallbackProps {
  errorReport: ErrorReport;
  resetError?: () => void;
}

export const GraffitiErrorFallback: React.FC<GraffitiErrorFallbackProps> = ({
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
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className={`max-w-md w-full rounded-lg border p-6 ${getSeverityColor()}`}>
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-current" />
          <div>
            <h3 className="text-lg font-semibold text-current">
              Graffiti Generation Error
            </h3>
            <p className="text-sm opacity-80">
              {category.replace('_', ' ').toLowerCase()} issue detected
            </p>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-6">
          <p className="text-sm text-current opacity-90 leading-relaxed">
            We're having trouble generating your graffiti. This might be due to a complex text input or temporary processing issue.
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
                  {action.id === 'retry-generation' && <RefreshCw className="w-4 h-4 mr-2" />}
                  {action.id === 'reset-to-default' && <RotateCcw className="w-4 h-4 mr-2" />}
                  {action.id === 'report-issue' && <Mail className="w-4 h-4 mr-2" />}
                  
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs opacity-75">{action.description}</div>
                  </div>
                </Button>
              </div>
            );
          })}
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