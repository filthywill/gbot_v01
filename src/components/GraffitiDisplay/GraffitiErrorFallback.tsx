import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface GraffitiErrorFallbackProps {
  inputText?: string;
  error?: Error;
  onRetry?: () => void;
}

export const GraffitiErrorFallback: React.FC<GraffitiErrorFallbackProps> = ({
  inputText = '',
  error,
  onRetry
}) => {
  // Show the text as CSS-styled graffiti when SVG fails
  return (
    <div className="w-full min-h-[200px] flex flex-col items-center justify-center p-8">
      {/* Graceful fallback: Show the text as styled CSS */}
      <div 
        className="text-8xl font-black text-center mb-4 select-text"
        style={{
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)',
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'gradientShift 3s ease infinite',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          transform: 'rotate(-2deg)',
          fontFamily: 'Impact, Arial Black, sans-serif',
          letterSpacing: '0.1em'
        }}
      >
        {inputText || 'GRAFFITI'}
      </div>

      {/* Small, non-intrusive error notice */}
      <div className="flex items-center space-x-2 text-yellow-600 text-sm mb-2">
        <AlertTriangle className="w-4 h-4" />
        <span>Advanced rendering temporarily unavailable</span>
      </div>
      
      {/* Subtle retry option */}
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Try advanced rendering again
        </button>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `
      }} />
    </div>
  );
}; 