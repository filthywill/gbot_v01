import React from 'react';
import { AlertTriangle, RefreshCw, Lightbulb, Zap } from 'lucide-react';
import { Button } from '../ui/button';

interface GraffitiErrorFallbackProps {
  inputText?: string;
  error?: Error;
  onRetry?: () => void;
  // Enhanced configuration options
  showFallbackText?: boolean;
  showSuggestions?: boolean;
  customMessage?: string;
  variant?: 'minimal' | 'detailed' | 'branded';
}

export const GraffitiErrorFallback: React.FC<GraffitiErrorFallbackProps> = ({
  inputText = '',
  error,
  onRetry,
  showFallbackText = true,
  showSuggestions = true,
  customMessage,
  variant = 'detailed'
}) => {
  const displayText = inputText || 'GRAFFITI';
  
  // Determine error type for better messaging
  const getErrorInfo = () => {
    if (customMessage) {
      return {
        title: 'Rendering Issue',
        description: customMessage,
        suggestions: ['Try refreshing the page', 'Contact support if the issue persists']
      };
    }

    if (!error) {
      return {
        title: 'Rendering Issue',
        description: 'The advanced graffiti rendering is temporarily unavailable.',
        suggestions: ['Try refreshing the page', 'Check your internet connection']
      };
    }

    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network')) {
      return {
        title: 'Connection Error',
        description: 'Unable to load graffiti assets. Please check your internet connection.',
        suggestions: ['Check your internet connection', 'Try again in a moment', 'Disable browser extensions that might block requests']
      };
    }
    
    if (message.includes('parse') || message.includes('invalid')) {
      return {
        title: 'Processing Error',
        description: 'There was an issue processing your text for graffiti generation.',
        suggestions: ['Try simpler text', 'Use only letters and numbers', 'Avoid special characters or emojis']
      };
    }

    if (message.includes('memory') || message.includes('timeout')) {
      return {
        title: 'Performance Issue',
        description: 'The text might be too complex or long for current processing capabilities.',
        suggestions: ['Try shorter text', 'Simplify your message', 'Close other browser tabs to free up memory']
      };
    }
    
    return {
      title: 'Rendering Error',
      description: 'Something went wrong while creating your graffiti.',
      suggestions: ['Try a different text', 'Refresh and try again', 'Report this issue if it persists']
    };
  };

  const errorInfo = getErrorInfo();

  // Minimal variant for subtle errors
  if (variant === 'minimal') {
    return (
      <div className="w-full min-h-[200px] flex flex-col items-center justify-center p-4">
        {showFallbackText && (
          <div 
            className="text-4xl md:text-6xl font-bold text-center mb-4 select-text"
            style={{
              color: 'var(--color-brand-primary-600)',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {displayText}
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-sm text-secondary mb-4">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span>{errorInfo.description}</span>
        </div>
        
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Branded variant with enhanced visual appeal
  if (variant === 'branded') {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-brand-primary-50 to-brand-primary-100 dark:from-brand-primary-950 dark:to-brand-primary-900 rounded-lg border border-brand-primary-200 dark:border-brand-primary-800">
        {showFallbackText && (
          <div className="relative mb-8">
            {/* Enhanced glow effect */}
            <div 
              className="absolute inset-0 blur-2xl opacity-40"
              style={{
                background: 'radial-gradient(ellipse at center, var(--color-brand-primary-400), var(--color-brand-primary-600), transparent)',
                transform: 'scale(1.2)',
              }}
            />
            
            {/* Animated background pattern */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  var(--color-brand-primary-200) 10px,
                  var(--color-brand-primary-200) 20px
                )`,
                animation: 'slide 20s linear infinite',
              }}
            />
            
            {/* Main text with enhanced styling */}
            <div 
              className="relative text-7xl md:text-9xl font-black text-center select-text"
              style={{
                background: 'linear-gradient(135deg, var(--color-brand-primary-500), var(--color-brand-primary-600), var(--color-brand-primary-700))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 8px 16px rgba(0,0,0,0.3)',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
                letterSpacing: '0.02em',
                lineHeight: '0.85',
                transform: 'rotate(-1deg)',
              }}
            >
              {displayText}
            </div>
            
            {/* Sparkle effect */}
            <div className="absolute top-2 right-2">
              <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Enhanced error card */}
        <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-xl border border-brand-primary-200 dark:border-brand-primary-800 p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-primary mb-2">
                {errorInfo.title}
              </h3>
              <p className="text-secondary leading-relaxed">
                {errorInfo.description}
              </p>
            </div>
          </div>

          {showSuggestions && errorInfo.suggestions.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-brand-primary-500" />
                <span className="font-semibold text-primary">Quick Fixes:</span>
              </div>
              <div className="grid gap-3">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-brand-primary-50 dark:bg-brand-primary-900/20 rounded-lg">
                    <span className="w-2 h-2 bg-brand-primary-500 rounded-full flex-shrink-0" />
                    <span className="text-sm text-secondary">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            {onRetry && (
              <Button 
                onClick={onRetry}
                className="flex-1 bg-gradient-to-r from-brand-primary-600 to-brand-primary-700 hover:from-brand-primary-700 hover:to-brand-primary-800 text-white shadow-lg"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1 border-brand-primary-200 text-brand-primary-700 hover:bg-brand-primary-50"
              size="sm"
            >
              Refresh Page
            </Button>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes slide {
              0% { transform: translateX(-100px); }
              100% { transform: translateX(100px); }
            }
          `
        }} />
      </div>
    );
  }

  // Default detailed variant
  return (
    <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-app to-container rounded-lg border border-app">
      {showFallbackText && (
        <div className="relative mb-8">
          {/* Background glow effect */}
          <div 
            className="absolute inset-0 blur-xl opacity-30"
            style={{
              background: 'linear-gradient(45deg, var(--color-brand-primary-500), var(--color-brand-primary-600))',
              transform: 'scale(1.1)',
            }}
          />
          
          {/* Main text */}
          <div 
            className="relative text-6xl md:text-8xl font-black text-center select-text"
            style={{
              background: 'linear-gradient(135deg, var(--color-brand-primary-500), var(--color-brand-primary-600), var(--color-brand-primary-700))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 4px 8px rgba(0,0,0,0.2)',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
              letterSpacing: '0.02em',
              lineHeight: '0.9'
            }}
          >
            {displayText}
          </div>
        </div>
      )}

      {/* Error Information Card */}
      <div className="max-w-md w-full bg-container rounded-lg border border-app p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="flex-shrink-0 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-primary mb-1">
              {errorInfo.title}
            </h3>
            <p className="text-sm text-secondary leading-relaxed">
              {errorInfo.description}
            </p>
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && errorInfo.suggestions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-primary">Suggestions:</span>
            </div>
            <ul className="space-y-1">
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-secondary flex items-center space-x-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="flex-1 bg-brand-primary-600 hover:bg-brand-primary-700 text-white"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            Refresh Page
          </Button>
        </div>

        {/* Development Info */}
        {import.meta.env.DEV && error && (
          <details className="mt-6">
            <summary className="cursor-pointer text-xs text-tertiary hover:text-secondary transition-colors">
              Technical Details (Dev Mode)
            </summary>
            <div className="mt-2 p-3 bg-app rounded border text-xs">
              <p className="text-red-400 font-mono break-all">
                {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 text-tertiary text-[10px] overflow-x-auto">
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>

      {/* Status indicator */}
      <div className="mt-6 flex items-center space-x-2 text-xs text-tertiary">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span>Fallback mode active</span>
      </div>
    </div>
  );
}; 